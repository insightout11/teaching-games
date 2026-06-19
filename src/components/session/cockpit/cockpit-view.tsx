'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { useSubmissionsFeed } from '@/hooks/use-submissions-feed';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import Link from 'next/link';
import { ClassQuestionsContent } from '@/components/session/class-questions-widget';
import { PollContent } from '@/components/session/poll-manager';
import { TimerContent } from '@/components/session/timer-tool';
import { FreezeContent } from '@/components/session/freeze-widget';
import { CaptainSuggestionsPanel } from '@/components/session/cockpit/captain-suggestions-panel';
import { DebateBoardPanel } from '@/components/session/cockpit/debate-board-panel';
import type { Session, Class, Student, StudentSubmission } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';

type SessionWithInputSpec = Session & { input_spec?: InputSpec | null };

interface CockpitViewProps {
  session: SessionWithInputSpec;
  cls: Class;
  students: Student[];
  initialInputSpec: InputSpec | null;
}

type CockpitTool = 'poll' | 'timer' | 'freeze';

// Stage label lookup derived from the All-Around Flight preset
const _aaConfig = FLIGHT_PLAN_PRESETS.find(p => p.id === 'all-around-flight-60')?.flightConfig;
const STAGE_BY_GAMEKEY: Record<string, string> = _aaConfig?.stageByKey ?? {};
const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  (_aaConfig?.stages ?? []).map(s => [s.stageId, s.label])
);

function getStageLabelForKey(gameKey: string | undefined | null): string | null {
  if (!gameKey) return null;
  const stageId = STAGE_BY_GAMEKEY[gameKey];
  return STAGE_LABEL[stageId] ?? gameKey;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
}

export function CockpitView({ session, cls, students, initialInputSpec }: CockpitViewProps) {
  const [currentInputSpec, setCurrentInputSpec] = useState<InputSpec | null>(initialInputSpec);
  const [spotlighting, setSpotlighting] = useState<string | null>(null);
  const [spotlightedIds, setSpotlightedIds] = useState<Set<string>>(new Set());
  const [lastSpotlightName, setLastSpotlightName] = useState<string | null>(null);
  const [clearingEvent, setClearingEvent] = useState(false);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const [activeTool, setActiveTool] = useState<CockpitTool>('poll');

  // Derived filter: null = show all, string = filter by that gameKey
  const filterKey: string | null =
    showAllSubmissions || !currentInputSpec?.gameKey ? null : currentInputSpec.gameKey;

  const { submissions, isLoading } = useSubmissionsFeed(session.id, filterKey);

  // Subscribe to session input_spec changes
  useEffect(() => {
    if (isMockMode()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`cockpit-session:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload: { new: unknown }) => {
          const updated = payload.new as { input_spec?: InputSpec | null };
          setCurrentInputSpec(updated.input_spec ?? null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id]);

  // Reset filter toggle when the active module changes
  useEffect(() => {
    setShowAllSubmissions(false);
  }, [currentInputSpec?.gameKey]);

  const handleSpotlight = useCallback(async (sub: StudentSubmission) => {
    setSpotlighting(sub.id);
    try {
      const res = await fetch('/api/session/spotlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          submissionId: sub.id,
          studentName: sub.display_name,
          text: sub.content,
        }),
      });
      if (res.ok) {
        setLastSpotlightName(sub.display_name);
        setSpotlightedIds((prev) => new Set(prev).add(sub.id));
        setTimeout(() => {
          setSpotlightedIds((prev) => {
            const next = new Set(prev);
            next.delete(sub.id);
            return next;
          });
        }, 3000);
      }
    } finally {
      setSpotlighting(null);
    }
  }, [session.id]);

  const handleClearEvent = useCallback(async () => {
    setClearingEvent(true);
    try {
      await fetch('/api/session/input-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, spec: null }),
      });
    } finally {
      setClearingEvent(false);
    }
  }, [session.id]);

  const handleShowAnswer = useCallback(async (question: string, answer: string) => {
    try {
      await fetch('/api/session/screen-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, question, answer }),
      });
    } catch {
      // The question widget does not expose error UI; keep the cockpit usable.
    }
  }, [session.id]);

  const stageLabel = getStageLabelForKey(currentInputSpec?.gameKey);
  const pendingCount = submissions.filter((sub) => sub.status === 'pending').length;
  const approvedCount = submissions.filter((sub) => sub.status === 'approved').length;
  const deviceState = currentInputSpec ? 'Collecting' : 'Standby';
  const cockpitTopic = session.custom_topic || session.topic || 'General';
  const cockpitDifficulty = session.difficulty || 'Intermediate';
  const toolTabs: Array<{ id: CockpitTool; label: string }> = [
    { id: 'poll', label: 'Poll' },
    { id: 'timer', label: 'Timer' },
    { id: 'freeze', label: 'Freeze' },
  ];

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="max-w-lg mx-auto p-4 flex flex-col gap-4 pb-12">

        {/* Debate prep boards — both teams, live, private to the teacher */}
        {currentInputSpec?.type === 'debate-prep' && (
          <DebateBoardPanel
            sessionId={session.id}
            forLabel={currentInputSpec.debateForLabel}
            againstLabel={currentInputSpec.debateAgainstLabel}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <Link
            href={`/sessions/${session.id}`}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors min-h-12 px-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Display
          </Link>
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/60">Captain Console</p>
            <div className="flex items-center justify-end gap-2">
              <span className="truncate text-sm font-semibold text-white max-w-[180px]">{cls.name}</span>
            {session.status === 'active' && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            )}
            </div>
          </div>
        </div>

        {/* Student Questions */}
        <div className="order-1 bg-[#0d1f35] rounded-2xl border border-cyan-400/20 overflow-hidden shadow-[0_0_28px_rgba(34,211,238,0.08)]">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-xs text-cyan-300/70 uppercase tracking-widest font-medium">Student Questions</p>
            <p className="mt-1 text-xs text-white/35">Answer privately, share with the class, or show an answer on the display.</p>
          </div>
          <ClassQuestionsContent
            sessionId={session.id}
            topic={cockpitTopic}
            difficulty={cockpitDifficulty}
            onShowAnswer={handleShowAnswer}
          />
        </div>

        <CaptainSuggestionsPanel
          sessionId={session.id}
          onSpotlightSent={setLastSpotlightName}
        />

        {/* Class Tools */}
        <div className="order-2 bg-[#0d1f35] rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Class Tools</p>
            <p className="mt-1 text-xs text-white/30">Use the same live tools as the session screen.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3 border-b border-white/8">
            {toolTabs.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={[
                  'min-h-11 rounded-xl border px-2 text-xs font-semibold transition-colors',
                  activeTool === tool.id
                    ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                    : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/80',
                ].join(' ')}
              >
                {tool.label}
              </button>
            ))}
          </div>
          {activeTool === 'poll' && <PollContent sessionId={session.id} />}
          {activeTool === 'timer' && <TimerContent sessionId={session.id} />}
          {activeTool === 'freeze' && <FreezeContent sessionId={session.id} />}
        </div>

        {/* Now */}
        <div className="order-3 bg-[#0d1f35] rounded-2xl border border-cyan-400/15 p-4 space-y-3 shadow-[0_0_26px_rgba(34,211,238,0.06)]">
          {currentInputSpec ? (
            <>
              <div className="space-y-1 min-w-0">
                  <p className="text-xs text-cyan-300/60 uppercase tracking-widest font-medium">Now</p>
                  {stageLabel && (
                    <p className="text-base font-bold text-white leading-tight">{stageLabel}</p>
                  )}
                  <p className="text-sm text-white/60 leading-snug">
                    {truncate(currentInputSpec.prompt ?? currentInputSpec.gameKey, 60)}
                  </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/35">
                <span>{deviceState} on student devices</span>
                <span className="text-white/15">/</span>
                <span>{students.length} student{students.length !== 1 ? 's' : ''}</span>
                {lastSpotlightName && (
                  <>
                    <span className="text-white/15">/</span>
                    <span className="text-amber-300/80">Last pick: {lastSpotlightName}</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-cyan-300/60 uppercase tracking-widest font-medium">Now</p>
              <p className="text-sm text-white/40">Nothing on student devices</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/25 pt-1">
                <span>{students.length} student{students.length !== 1 ? 's' : ''}</span>
                {lastSpotlightName && (
                  <>
                    <span className="text-white/15">/</span>
                    <span className="text-amber-300/70">Last pick: {lastSpotlightName}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="order-5 bg-[#0d1f35] rounded-2xl border border-white/10 p-4 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Controls</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/sessions/${session.id}`}
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-center text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Open Display
            </Link>
            <button
              onClick={handleClearEvent}
              disabled={!currentInputSpec || clearingEvent}
              className="min-h-12 rounded-xl border border-red-500/25 bg-red-500/5 px-3 text-sm font-semibold text-red-300 transition-colors hover:border-red-400/45 hover:bg-red-500/10 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/25"
            >
              {clearingEvent ? 'Clearing...' : 'Clear Devices'}
            </button>
          </div>
        </div>

        {/* Needs Review */}
        <div className="order-4 bg-[#0d1f35] rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 gap-3">
            <div className="min-w-0">
              <p className="text-xs text-white/40 uppercase tracking-widest font-medium shrink-0">Needs Review</p>
              <p className="mt-1 text-xs text-white/30">
                {isLoading ? 'Loading...' : `${pendingCount} pending / ${approvedCount} ready`}
              </p>
            </div>
            {currentInputSpec?.gameKey && (
              <div className="flex rounded-lg overflow-hidden border border-white/10">
                <button
                  onClick={() => setShowAllSubmissions(false)}
                  className={[
                    'px-3 min-h-[36px] text-xs font-medium transition-colors',
                    !showAllSubmissions ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70',
                  ].join(' ')}
                >
                  Current
                </button>
                <button
                  onClick={() => setShowAllSubmissions(true)}
                  className={[
                    'px-3 min-h-[36px] text-xs font-medium transition-colors border-l border-white/10',
                    showAllSubmissions ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70',
                  ].join(' ')}
                >
                  All recent
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="px-4 py-8 text-center text-white/30 text-sm">Loading…</div>
          ) : submissions.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/30 text-sm">No submissions yet</div>
          ) : (
            <div className="divide-y divide-white/8">
              {submissions.map((sub) => (
                <SubmissionRow
                  key={sub.id}
                  sub={sub}
                  spotlighting={spotlighting}
                  spotlightedIds={spotlightedIds}
                  onSpotlight={handleSpotlight}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

interface SubmissionRowProps {
  sub: StudentSubmission;
  spotlighting: string | null;
  spotlightedIds: Set<string>;
  onSpotlight: (sub: StudentSubmission) => void;
}

function SubmissionRow({ sub, spotlighting, spotlightedIds, onSpotlight }: SubmissionRowProps) {
  const isSpotlighting = spotlighting === sub.id;
  const wasSpotlighted = spotlightedIds.has(sub.id);
  const submissionLabel = getStageLabelForKey(sub.game_key) ?? sub.game_key;

  return (
    <div className="px-4 py-3 space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{sub.display_name}</span>
            {submissionLabel && (
              <span className="text-xs font-mono bg-white/8 text-white/50 px-1.5 py-0.5 rounded">
                {submissionLabel}
              </span>
            )}
            <StatusBadge status={sub.status} />
            <span className="text-xs text-white/25">{formatRelativeTime(sub.created_at)}</span>
          </div>
          <p className="text-sm text-white/70 leading-snug">{truncate(sub.content, 80)}</p>
        </div>

        <button
          onClick={() => onSpotlight(sub)}
          disabled={isSpotlighting || wasSpotlighted}
          className={[
            'shrink-0 text-xs font-medium px-3 min-h-[40px] rounded-lg transition-all',
            wasSpotlighted
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
              : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-400/40 active:scale-95',
            isSpotlighting && 'opacity-50',
          ].join(' ')}
        >
          {wasSpotlighted ? 'Pick sent' : isSpotlighting ? '...' : "Captain's Pick"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending') {
    return (
      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
        pending
      </span>
    );
  }
  if (status === 'approved') {
    return (
      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        ready
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white/8 text-white/40">
      {status}
    </span>
  );
}

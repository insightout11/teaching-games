'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { useSubmissionsFeed } from '@/hooks/use-submissions-feed';
import { getStageLabelForKey } from '@/lib/stage-labels';
import Link from 'next/link';
import { ClassQuestionsContent } from '@/components/session/class-questions-widget';
import { PollContent } from '@/components/session/poll-manager';
import { TimerContent } from '@/components/session/timer-tool';
import { CaptainSuggestionsPanel } from '@/components/session/cockpit/captain-suggestions-panel';
import { DebateBoardPanel } from '@/components/session/cockpit/debate-board-panel';
import { FindYourWayAid } from '@/components/session/cockpit/find-your-way-aid';
import { ClassBoardControl } from '@/components/session/class-board-control';
import { SIDE_CHANNEL_KEY, type SideChannelItem } from '@/lib/side-channel';
import { SPOTLIGHT_TAGS, SPOTLIGHT_TAG_META, type SpotlightTag } from '@/lib/spotlight';
import type { Session, Class, Student, StudentSubmission } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';
import { getInputSpecRevision } from '@/lib/input-spec';
import { LatestRequestGate } from '@/lib/latest-request-gate';
import {
  logRealtimeDiagnostic,
  reconcileIntervalFor,
  startRealtimeChannelLifecycle,
  type RealtimeHealth,
} from '@/lib/realtime-health';
import type { RealtimeChannel } from '@supabase/supabase-js';

type SessionWithInputSpec = Session & { input_spec?: InputSpec | null };

interface CockpitViewProps {
  session: SessionWithInputSpec;
  cls: Class;
  students: Student[];
  initialInputSpec: InputSpec | null;
}

type CockpitTool = 'poll' | 'timer';

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
  const [lastSpotlight, setLastSpotlight] = useState<{ name: string; text: string } | null>(null);
  const [followUpState, setFollowUpState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [clearingEvent, setClearingEvent] = useState(false);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const [activeTool, setActiveTool] = useState<CockpitTool>('poll');
  const [sideChannelItem, setSideChannelItem] = useState<SideChannelItem | null>(null);
  const [clearingSideChannel, setClearingSideChannel] = useState(false);
  const [realtimeHealth, setRealtimeHealth] = useState<RealtimeHealth>('connecting');
  const cockpitRequestGateRef = useRef(new LatestRequestGate());

  const reconcileCockpitState = useCallback(async () => {
    const sequence = cockpitRequestGateRef.current.begin();
    const response = await fetch(`/api/session/realtime-state?sessionId=${session.id}`, {
      cache: 'no-store',
    });
    if (!cockpitRequestGateRef.current.isCurrent(sequence)) return;
    if (!response.ok) throw new Error(`Cockpit reconciliation failed (${response.status})`);
    const data = await response.json() as {
      inputSpec?: InputSpec | null;
      inputSpecRevision?: string;
      sideChannel?: SideChannelItem | null;
      sideChannelRevision?: string | null;
    };
    if (!cockpitRequestGateRef.current.isCurrent(sequence)) return;
    setCurrentInputSpec(data.inputSpec ?? null);
    setSideChannelItem(data.sideChannel ?? null);
    logRealtimeDiagnostic('cockpit-state', 'canonical_reconcile', {
      revision: data.inputSpecRevision ?? getInputSpecRevision(data.inputSpec ?? null),
      side_revision: data.sideChannelRevision,
    });
  }, [session.id]);

  // Reconcile every visible submission so the global review count cannot be
  // hidden by the current main-task filter. Crew Radio remains visible alongside
  // the current main lane because it is independent teacher input.
  const {
    submissions: allSubmissions,
    isLoading,
    realtimeHealth: submissionsHealth,
  } = useSubmissionsFeed(session.id, null);
  const submissions = showAllSubmissions || !currentInputSpec?.gameKey
    ? allSubmissions
    : allSubmissions.filter((submission) =>
        submission.game_key === currentInputSpec.gameKey || submission.game_key === 'crew-radio'
      );

  // Subscribe to session input_spec changes + the Crew Radio lane, so the
  // "Now" panel shows what's live on each lane of the student devices.
  useEffect(() => {
    if (isMockMode()) {
      setRealtimeHealth('subscribed');
      return;
    }

    const supabase = createClient();
    return startRealtimeChannelLifecycle<RealtimeChannel>({
      scope: 'cockpit-state',
      createChannel: () => supabase
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
            cockpitRequestGateRef.current.invalidate();
            const updated = payload.new as { input_spec?: InputSpec | null };
            const nextSpec = updated.input_spec ?? null;
            setCurrentInputSpec(nextSpec);
            logRealtimeDiagnostic('cockpit-state', 'database_change_apply', {
              revision: getInputSpecRevision(nextSpec),
              lane: 'main',
            });
          },
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'session_private_state',
            filter: `session_id=eq.${session.id}`,
          },
          (payload: { new: unknown }) => {
            const row = payload.new as { key?: string; payload?: { item?: SideChannelItem | null }; updated_at?: string } | null;
            if (row?.key === SIDE_CHANNEL_KEY) {
              cockpitRequestGateRef.current.invalidate();
              setSideChannelItem(row.payload?.item ?? null);
              logRealtimeDiagnostic('cockpit-state', 'database_change_apply', {
                side_revision: row.updated_at ?? row.payload?.item?.id,
                lane: 'side',
              });
            }
          },
        ),
      removeChannel: (channel) => supabase.removeChannel(channel),
      reconcile: reconcileCockpitState,
      onHealth: setRealtimeHealth,
    });
  }, [session.id, reconcileCockpitState]);

  useEffect(() => {
    if (isMockMode()) return;
    void reconcileCockpitState().catch(() => {
      logRealtimeDiagnostic('cockpit-state', 'safety_reconcile_failed');
    });
    const interval = setInterval(
      () => void reconcileCockpitState().catch(() => {
        logRealtimeDiagnostic('cockpit-state', 'safety_reconcile_failed');
      }),
      reconcileIntervalFor(realtimeHealth),
    );
    return () => clearInterval(interval);
  }, [realtimeHealth, reconcileCockpitState]);

  // Reset filter toggle when the active module changes
  useEffect(() => {
    setShowAllSubmissions(false);
  }, [currentInputSpec?.gameKey]);

  const handleSpotlight = useCallback(async (sub: StudentSubmission, tag: SpotlightTag) => {
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
          tag,
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setLastSpotlight({ name: data.shownName ?? sub.display_name, text: data.text ?? sub.content });
        setFollowUpState('idle');
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

  const handleClearSideChannel = useCallback(async () => {
    setClearingSideChannel(true);
    try {
      const res = await fetch('/api/session/side-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, item: null }),
      });
      if (res.ok) setSideChannelItem(null);
    } finally {
      setClearingSideChannel(false);
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

  // Chain a Crew Radio follow-up about the last Captain's Pick — turns one
  // spotlight into a short class arc without touching the main task.
  const handleFollowUp = useCallback(async (mode: 'react' | 'upgrade') => {
    if (!lastSpotlight) return;
    setFollowUpState('sending');
    try {
      const quote = { text: lastSpotlight.text, name: lastSpotlight.name };
      const item = mode === 'react'
        ? {
            kind: 'choice',
            title: 'React to the Captain\'s Pick',
            prompt: 'Do you agree with this idea?',
            options: ['Agree', 'Disagree', 'Not sure'],
            quote,
          }
        : {
            kind: 'write',
            title: 'Upgrade the Captain\'s Pick',
            prompt: 'Rewrite this idea in your own words — can you make it even stronger?',
            maxLength: 280,
            quote,
          };
      const res = await fetch('/api/session/side-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, item }),
      });
      setFollowUpState(res.ok ? 'sent' : 'idle');
    } catch {
      setFollowUpState('idle');
    }
  }, [lastSpotlight, session.id]);

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
  const pendingCount = allSubmissions.filter((sub) => sub.status === 'pending').length;
  const approvedCount = allSubmissions.filter((sub) => sub.status === 'approved').length;
  const deviceState = currentInputSpec ? 'Collecting responses' : 'Ready';
  // No 'General' placeholder — fall back to the class name so downstream AI
  // prompts never get told the topic is literally "General".
  const cockpitTopic = session.custom_topic || session.topic || cls.name;
  const cockpitDifficulty = session.difficulty || 'Intermediate';
  const toolTabs: Array<{ id: CockpitTool; label: string }> = [
    { id: 'poll', label: 'Poll' },
    { id: 'timer', label: 'Timer' },
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

        {/* Find Your Way — the guide's secret destination, private to the teacher */}
        {currentInputSpec?.gameKey === 'trip-directions' && currentInputSpec.type === 'geo-point' && (
          <FindYourWayAid spec={currentInputSpec} />
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
            Student display
          </Link>
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/60">Teacher Cockpit</p>
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

        {/* Class Board — moderation lives here; the shared screen only shows approved items.
            Word-cloud boards have no moderation, so the panel is hidden for them. */}
        {currentInputSpec?.type === 'board' && !currentInputSpec.boardWordCloud && (
          <div className="order-1 bg-[#0d1f35] rounded-2xl border border-cyan-400/20 overflow-hidden shadow-[0_0_28px_rgba(34,211,238,0.08)]">
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-xs text-cyan-300/70 uppercase tracking-widest font-medium">
                {currentInputSpec.boardTitle ?? 'Class Board'}
              </p>
              <p className="mt-1 text-xs text-white/35">Approve student submissions to add them to the shared board.</p>
            </div>
            <ClassBoardControl sessionId={session.id} spec={currentInputSpec} />
          </div>
        )}

        <CaptainSuggestionsPanel
          sessionId={session.id}
          standby={!currentInputSpec}
          onSpotlightSent={(name, text) => {
            setLastSpotlight({ name, text });
            setFollowUpState('idle');
          }}
        />

        {/* Follow up on the last Captain's Pick via Crew Radio */}
        {lastSpotlight && (
          <div className="order-2 bg-[#0d1f35] rounded-2xl border border-amber-400/20 p-4 space-y-2">
            <p className="text-xs text-amber-300/70 uppercase tracking-widest font-medium">
              Follow up on {lastSpotlight.name}&apos;s pick
            </p>
            <p className="text-xs text-white/40 leading-snug">
              &quot;{truncate(lastSpotlight.text, 90)}&quot;
            </p>
            {followUpState === 'sent' ? (
              <p className="text-xs text-emerald-300">Sent to Crew Radio ✓</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleFollowUp('react')}
                  disabled={followUpState === 'sending'}
                  className="min-h-11 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  Ask the class
                </button>
                <button
                  onClick={() => handleFollowUp('upgrade')}
                  disabled={followUpState === 'sending'}
                  className="min-h-11 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/20 disabled:opacity-50"
                >
                  Build on it
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live Tools */}
        <div className="order-2 bg-[#0d1f35] rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Live Tools</p>
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
        </div>

        {/* Now */}
        <div className="order-3 bg-[#0d1f35] rounded-2xl border border-cyan-400/15 p-4 space-y-3 shadow-[0_0_26px_rgba(34,211,238,0.06)]">
          {(realtimeHealth !== 'subscribed' || submissionsHealth !== 'subscribed') && (
            <p className="text-[10px] font-medium uppercase tracking-widest text-amber-300/70">
              Reconnecting… canonical state is being refreshed
            </p>
          )}
          {currentInputSpec ? (
            <>
              <div className="space-y-1 min-w-0">
                  <p className="text-xs text-cyan-300/60 uppercase tracking-widest font-medium">Student device activity</p>
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
                <span>{students.length} on roster</span>
                {lastSpotlight && (
                  <>
                    <span className="text-white/15">/</span>
                    <span className="text-amber-300/80">Last pick: {lastSpotlight.name}</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-cyan-300/60 uppercase tracking-widest font-medium">Student device activity</p>
              <p className="text-sm text-white/40">No activity on student devices</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/25 pt-1">
                <span>{students.length} on roster</span>
                {lastSpotlight && (
                  <>
                    <span className="text-white/15">/</span>
                    <span className="text-amber-300/70">Last pick: {lastSpotlight.name}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Crew Radio lane — the side channel is its own lane; show what's on it. */}
          <div className="flex items-start justify-between gap-3 border-t border-white/8 pt-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-widest text-amber-300/60">Crew Radio · student side channel</p>
              {sideChannelItem ? (
                <p className="text-xs text-white/55 leading-snug">
                  {sideChannelItem.title}: {truncate(sideChannelItem.prompt, 70)}
                </p>
              ) : (
                <p className="text-xs text-white/30">Quiet — nothing on the side channel</p>
              )}
            </div>
            {sideChannelItem && (
              <button
                onClick={handleClearSideChannel}
                disabled={clearingSideChannel}
                className="shrink-0 min-h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white/80 disabled:opacity-50"
              >
                {clearingSideChannel ? 'Clearing…' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="order-5 bg-[#0d1f35] rounded-2xl border border-white/10 p-4 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Teacher controls</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/sessions/${session.id}`}
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-center text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Open student display
            </Link>
            <button
              onClick={handleClearEvent}
              disabled={!currentInputSpec || clearingEvent}
              className="min-h-12 rounded-xl border border-red-500/25 bg-red-500/5 px-3 text-sm font-semibold text-red-300 transition-colors hover:border-red-400/45 hover:bg-red-500/10 disabled:border-white/10 disabled:bg-white/5 disabled:text-white/25"
            >
              {clearingEvent ? 'Clearing...' : 'Clear student activity'}
            </button>
          </div>
        </div>

        {/* Needs Review */}
        <div className="order-4 bg-[#0d1f35] rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 gap-3">
            <div className="min-w-0">
              <p className="text-xs text-white/40 uppercase tracking-widest font-medium shrink-0">Needs Review</p>
              <p className="mt-1 text-xs text-white/30">
                {isLoading ? 'Loading...' : `${pendingCount} awaiting review · ${approvedCount} ready to show`}
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
                  Live lanes
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
  onSpotlight: (sub: StudentSubmission, tag: SpotlightTag) => void;
}

function SubmissionRow({ sub, spotlighting, spotlightedIds, onSpotlight }: SubmissionRowProps) {
  // Default tag by origin: class questions (no game_key) → Question, game answers → Idea.
  const defaultTag: SpotlightTag = sub.game_key ? 'idea' : 'question';
  const [tag, setTag] = useState<SpotlightTag>(defaultTag);
  const [showTagPicker, setShowTagPicker] = useState(false);
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
            <button
              onClick={() => setShowTagPicker((open) => !open)}
              disabled={wasSpotlighted}
              className="min-h-[28px] rounded-full border border-amber-400/25 bg-amber-500/8 px-2 text-[10px] font-bold uppercase tracking-wider text-amber-200/70 transition-colors hover:bg-amber-500/15 disabled:opacity-45"
            >
              {SPOTLIGHT_TAG_META[tag].label}
            </button>
          </div>
          <p className="text-sm text-white/70 leading-snug">{truncate(sub.content, 80)}</p>
        </div>

        <button
          onClick={() => onSpotlight(sub, tag)}
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

      {/* Tag picker — one tap to flip what kind of contribution the pick is. */}
      {showTagPicker && !wasSpotlighted && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {SPOTLIGHT_TAGS.map((option) => (
            <button
              key={option}
              onClick={() => {
                setTag(option);
                setShowTagPicker(false);
              }}
              className={[
                'min-h-8 rounded-full border px-2.5 text-[11px] font-semibold transition-colors',
                option === tag
                  ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                  : 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70',
              ].join(' ')}
            >
              {SPOTLIGHT_TAG_META[option].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending') {
    return (
      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
        Awaiting review
      </span>
    );
  }
  if (status === 'approved') {
    return (
      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        Ready to show
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white/8 text-white/40">
      {status}
    </span>
  );
}

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ActivityProps } from '../types';
import type { Student } from '@/lib/supabase/types';
import type { ExpertPanelPhase, ExpertSlot } from './types';
import type { ExpertPanelContent } from './types';

interface PanelGroup {
  slots: ExpertSlot[];
  questionStart: number; // globalQIndex of first Q in this panel
}

function buildPanels(students: Student[], roleCount: number): PanelGroup[] {
  const n = Math.min(students.length, roleCount);
  const shuffled = [...students].sort(() => Math.random() - 0.5).slice(0, n);
  const panelSize = shuffled.length <= 6 ? 3 : 4;
  const groups: PanelGroup[] = [];
  let qStart = 0;
  for (let i = 0; i < shuffled.length; i += panelSize) {
    const chunk = shuffled.slice(i, i + panelSize);
    groups.push({
      slots: chunk.map((s, j) => ({
        roleIndex: i + j,
        studentId: s.id,
        studentName: s.name,
      })),
      questionStart: qStart,
    });
    qStart += chunk.length;
  }
  return groups;
}

function deriveLocation(panels: PanelGroup[], globalQ: number) {
  for (let pi = 0; pi < panels.length; pi++) {
    const localQ = globalQ - panels[pi].questionStart;
    if (localQ >= 0 && localQ < panels[pi].slots.length) {
      return { panelIndex: pi, localQ, panel: panels[pi], slot: panels[pi].slots[localQ] };
    }
  }
  return null;
}

export function ExpertPanelActivity({
  students,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as ExpertPanelContent;

  const TOTAL_Q = content.questions?.length ?? students.length;

  const [phase, setPhase] = useState<ExpertPanelPhase>('idle');
  const [globalQIndex, setGlobalQIndex] = useState(0);
  const [panels, setPanels] = useState<PanelGroup[]>(() =>
    buildPanels(students, TOTAL_Q)
  );
  const [audienceVotes, setAudienceVotes] = useState<Record<string, string>>({});
  const [voteTimer, setVoteTimer] = useState(0);
  const [expertResponderCount, setExpertResponderCount] = useState(0);

  // Refs for closure-safe access
  const phaseRef = useRef<ExpertPanelPhase>('idle');
  const globalQIndexRef = useRef(0);
  const audienceVotesRef = useRef<Record<string, string>>({});

  phaseRef.current = phase;
  globalQIndexRef.current = globalQIndex;

  // Derived
  const loc = deriveLocation(panels, globalQIndex);
  const currentQuestion = content.questions?.[globalQIndex] ?? null;
  const currentRole = loc ? content.roles?.[loc.slot.roleIndex] : null;

  // Remote vote handler
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'audience-vote') return;
      if (audienceVotesRef.current[vote.clientId]) return;
      setAudienceVotes((prev) => ({ ...prev, [vote.clientId]: vote.choice }));
      audienceVotesRef.current[vote.clientId] = vote.choice;
      onScore?.({
        studentId: vote.studentId ?? null,
        clientId: vote.clientId,
        displayName: vote.displayName,
        promptIndex: globalQIndexRef.current + 1,
        points: 1,
        isCorrect: null,
      });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, onScore]);

  // InputSpec — only during audience-vote
  useEffect(() => {
    if (phase !== 'audience-vote') { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({
      type: 'choice',
      gameKey: 'expert-panel',
      prompt: 'What do you think of this response?',
      options: ['Agree', 'Disagree', 'Interesting', 'Not clear'],
    });
  }, [phase, onSetInputSpec]);

  // Audience vote countdown tick
  useEffect(() => {
    if (phase !== 'audience-vote' || voteTimer <= 0) return;
    const id = setTimeout(() => setVoteTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, voteTimer]);

  const advanceQuestion = useCallback(() => {
    const next = globalQIndexRef.current + 1;
    setAudienceVotes({});
    audienceVotesRef.current = {};
    if (next >= TOTAL_Q) {
      setPhase('summary');
      onPhaseChange?.('finished');
    } else {
      setGlobalQIndex(next);
      setPhase('questioning');
    }
  }, [TOTAL_Q, onPhaseChange]);

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (phase === 'audience-vote' && voteTimer === 0) advanceQuestion();
  }, [voteTimer, phase, advanceQuestion]);

  const handleStart = useCallback(() => {
    setGlobalQIndex(0);
    globalQIndexRef.current = 0;
    setExpertResponderCount(0);
    setAudienceVotes({});
    audienceVotesRef.current = {};
    setPhase('questioning');
    onPhaseChange?.('questioning');
  }, [onPhaseChange]);

  const handleReroll = useCallback(() => {
    setPanels(buildPanels(students, TOTAL_Q));
  }, [students, TOTAL_Q]);

  const handleResponseGiven = useCallback(() => {
    if (!loc) return;
    onScore?.({
      studentId: loc.slot.studentId,
      clientId: null,
      displayName: loc.slot.studentName,
      promptIndex: globalQIndexRef.current + 1,
      points: 1,
      isCorrect: null,
    });
    setExpertResponderCount((c) => c + 1);
    setPhase('responded');
  }, [loc, onScore]);

  const handleOpenAudienceVote = useCallback(() => {
    setAudienceVotes({});
    audienceVotesRef.current = {};
    setVoteTimer(12);
    setPhase('audience-vote');
  }, []);

  const handleNextQuestion = useCallback(() => {
    advanceQuestion();
  }, [advanceQuestion]);

  const handleNewPanel = useCallback(() => {
    setGlobalQIndex(0);
    globalQIndexRef.current = 0;
    setPanels(buildPanels(students, TOTAL_Q));
    setExpertResponderCount(0);
    setAudienceVotes({});
    audienceVotesRef.current = {};
    setVoteTimer(0);
    setPhase('idle');
    onPhaseChange?.('idle');
  }, [students, TOTAL_Q, onPhaseChange]);

  if (!content.roles?.length || !content.questions?.length) {
    return (
      <p className="text-red-400 text-center py-12">Content unavailable. Please regenerate.</p>
    );
  }

  const VOTE_OPTIONS = ['Agree', 'Disagree', 'Interesting', 'Not clear'];
  const totalVotes = Object.keys(audienceVotes).length;
  const panelCount = panels.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-lc-blue">Expert Panel</h3>
        {phase !== 'idle' && phase !== 'summary' && loc && (
          <span className="text-sm opacity-60">
            Q{globalQIndex + 1} of {TOTAL_Q} · Panel {loc.panelIndex + 1} of {panelCount}
          </span>
        )}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="space-y-4">
          <p className="text-center text-sm uppercase tracking-widest opacity-50">Today&apos;s Panel</p>
          <div className={`grid gap-3 ${panels[0]?.slots.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {panels[0]?.slots.map((slot) => {
              const role = content.roles?.[slot.roleIndex];
              if (!role) return null;
              return (
                <div key={slot.roleIndex} className="glass p-4 rounded-2xl border border-lc-blue/25 space-y-2">
                  <p className="font-bold text-lc-blue text-sm">{role.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {role.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs opacity-70">{tag}</span>
                    ))}
                  </div>
                  <p className="text-sm font-semibold">{slot.studentName || '—'}</p>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={handleReroll}
              className="px-5 py-2 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-white/20"
            >
              RE-ROLL
            </button>
            <button
              onClick={handleStart}
              className="px-10 py-4 bg-gradient-to-br from-lc-blue to-blue-500 rounded-full font-game text-xl shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-4 border-white/20"
            >
              START
            </button>
          </div>
        </div>
      )}

      {/* QUESTIONING */}
      {phase === 'questioning' && loc && (
        <div className="space-y-5">
          {/* Question card */}
          <div className="glass p-8 rounded-2xl border-2 border-lc-blue/30 text-center">
            <p className="text-2xl font-semibold leading-snug">
              &ldquo;{currentQuestion?.text ?? 'No question available'}&rdquo;
            </p>
          </div>

          {/* Answer Frame — starters for the speaking role */}
          {currentRole?.starters?.length ? (
            <div className="glass p-4 rounded-xl border border-white/10 space-y-1">
              <p className="text-xs uppercase tracking-widest opacity-40">
                Answer Frame · {currentRole.title}
              </p>
              {currentRole.starters.map((s, i) => (
                <p key={i} className="text-sm italic opacity-60">{s}</p>
              ))}
            </div>
          ) : null}

          {/* Expert cards */}
          <div className={`grid gap-3 ${loc.panel.slots.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {loc.panel.slots.map((slot) => {
              const role = content.roles?.[slot.roleIndex];
              const isSpeaking = slot.roleIndex === loc.slot.roleIndex;
              if (!role) return null;
              return (
                <div
                  key={slot.roleIndex}
                  className={`glass p-4 rounded-2xl space-y-2 transition-all ${
                    isSpeaking
                      ? 'border-2 border-lc-blue shadow-lg shadow-lc-blue/20'
                      : 'border border-white/10 opacity-60'
                  }`}
                >
                  {isSpeaking && (
                    <span className="inline-block px-2 py-0.5 bg-lc-blue/20 text-lc-blue text-xs rounded-full font-semibold">
                      Speaking
                    </span>
                  )}
                  <p className="font-bold text-sm">{role.title}</p>
                  <p className="text-sm opacity-70">{slot.studentName || '—'}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleResponseGiven}
              className="px-8 py-4 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-lg shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              RESPONSE GIVEN
            </button>
          </div>
        </div>
      )}

      {/* RESPONDED */}
      {phase === 'responded' && loc && (
        <div className="space-y-5">
          {/* Dimmed question */}
          <div className="glass p-6 rounded-2xl border border-white/10 text-center opacity-50">
            <p className="text-lg italic">&ldquo;{currentQuestion?.text ?? ''}&rdquo;</p>
          </div>

          {/* Expert cards */}
          <div className={`grid gap-3 ${loc.panel.slots.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {loc.panel.slots.map((slot) => {
              const role = content.roles?.[slot.roleIndex];
              const wasSpeaking = slot.roleIndex === loc.slot.roleIndex;
              if (!role) return null;
              return (
                <div
                  key={slot.roleIndex}
                  className={`glass p-4 rounded-2xl border space-y-1 ${
                    wasSpeaking ? 'border-green-500/40' : 'border-white/10 opacity-60'
                  }`}
                >
                  <p className="font-bold text-sm">{role.title}</p>
                  <p className="text-sm opacity-70">{slot.studentName || '—'}</p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={handleOpenAudienceVote}
              className="px-6 py-3 glass hover:bg-white/10 rounded-xl font-game text-sm transition-all border border-cyan-500/30 text-cyan-400"
            >
              OPEN AUDIENCE VOTE?
            </button>
            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 bg-gradient-to-r from-lc-blue to-blue-500 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              NEXT QUESTION →
            </button>
          </div>
        </div>
      )}

      {/* AUDIENCE-VOTE */}
      {phase === 'audience-vote' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-widest opacity-60">Audience Voting</p>
            <span
              className={`text-4xl font-game tabular-nums transition-colors ${
                voteTimer <= 3 ? 'text-red-400' : 'text-white'
              }`}
            >
              {voteTimer}
            </span>
          </div>

          {/* Bar chart */}
          <div className="space-y-2">
            {VOTE_OPTIONS.map((option) => {
              const count = Object.values(audienceVotes).filter((v) => v === option).length;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={option} className="flex items-center gap-3">
                  <span className="w-24 text-sm opacity-70 shrink-0">{option}</span>
                  <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-lc-blue rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm opacity-70">{count}</span>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs opacity-40">Auto-advances when timer ends</p>
        </div>
      )}

      {/* SUMMARY */}
      {phase === 'summary' && (
        <div className="text-center py-10 space-y-6">
          <p className="text-3xl font-game text-lc-blue">Panel Complete!</p>
          <div className="flex justify-center gap-8">
            <div>
              <p className="text-4xl font-game">{TOTAL_Q}</p>
              <p className="text-sm opacity-50">questions asked</p>
            </div>
            <div>
              <p className="text-4xl font-game">{expertResponderCount}</p>
              <p className="text-sm opacity-50">expert responses</p>
            </div>
          </div>
          <button
            onClick={handleNewPanel}
            className="px-8 py-4 glass hover:bg-white/10 rounded-xl font-game text-lg transition-all border border-white/20"
          >
            NEW PANEL
          </button>
        </div>
      )}
    </div>
  );
}

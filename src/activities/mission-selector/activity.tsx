'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ActivityProps } from '../types';
import type { MissionSelectorContent } from '../types';
import { useSessionStore } from '@/stores/session-store';

type Phase = 'presenting' | 'stance' | 'done';

// picks[clientId] = questionText
type PickMap = Record<string, { question: string; displayName: string; studentId?: string | null }>;
// stances[clientId] = stance text
type StanceMap = Record<string, { text: string; displayName: string }>;

const STANCE_TIMER_SECONDS = 30;

function topVotedQuestion(questions: string[], picks: PickMap): string {
  let best = questions[0] ?? '';
  let bestCount = 0;
  for (const q of questions) {
    const count = Object.values(picks).filter((p) => p.question === q).length;
    if (count > bestCount) {
      bestCount = count;
      best = q;
    }
  }
  return best;
}

export function MissionSelectorActivity({
  sessionSettings,
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onContentRegenerate,
}: ActivityProps) {
  const content = generatedContent as MissionSelectorContent;
  const questions = useMemo(() => content.questions ?? [], [content.questions]);

  const [phase, setPhase] = useState<Phase>('presenting');
  const [picks, setPicks] = useState<PickMap>({});
  const [winningQuestion, setWinningQuestion] = useState<string | null>(null);
  const [stances, setStances] = useState<StanceMap>({});
  const [stanceTimer, setStanceTimer] = useState(STANCE_TIMER_SECONDS);
  const [regenFired, setRegenFired] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const picksRef = useRef(picks);
  picksRef.current = picks;
  const stancesRef = useRef(stances);
  stancesRef.current = stances;

  const sessionId = useSessionStore((s) => s.sessionId);
  const setClassMission = useSessionStore((s) => s.setClassMission);
  const addOpeningStance = useSessionStore((s) => s.addOpeningStance);

  // Auto-start: presents immediately
  useEffect(() => {
    onPhaseChange?.('presenting');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Vote handler ───────────────────────────────────────────────────────────
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      const currentPhase = phaseRef.current;

      if (currentPhase === 'presenting') {
        if (picksRef.current[vote.clientId]) return;
        const questionText = vote.choice;
        setPicks((prev) => ({
          ...prev,
          [vote.clientId]: { question: questionText, displayName: vote.displayName, studentId: vote.studentId ?? null },
        }));
        onScore?.({
          studentId: vote.studentId ?? null,
          clientId: vote.clientId,
          displayName: vote.displayName,
          promptIndex: 1,
          points: 1,
          isCorrect: null,
        });
      } else if (currentPhase === 'stance') {
        if (stancesRef.current[vote.clientId]) return;
        if (!vote.choice?.trim()) return;
        const stanceText = vote.choice.trim();
        setStances((prev) => ({ ...prev, [vote.clientId]: { text: stanceText, displayName: vote.displayName } }));
        addOpeningStance(vote.clientId, stanceText);
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoteVoteHandler, onScore, addOpeningStance]);

  // ── Input spec ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'presenting') {
      onSetInputSpec?.({
        type: 'choice',
        gameKey: 'mission-selector',
        prompt: 'Choose your mission for this lesson:',
        options: questions,
        allowWriteIn: false,
      });
    } else if (phase === 'stance') {
      if (sessionSettings.difficulty === 'Beginner') {
        onSetInputSpec?.(null);
        return;
      }
      onSetInputSpec?.({
        type: 'textarea',
        gameKey: 'mission-selector',
        prompt: 'Write your first thought — before the lesson changes your mind.',
        placeholder: 'Your opening thought…',
        maxLength: 80,
      });
    } else {
      onSetInputSpec?.(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, questions]);

  // ── Stance countdown timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'stance') return;
    setStanceTimer(STANCE_TIMER_SECONDS);
    const interval = setInterval(() => {
      setStanceTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // ── Regen helper ──────────────────────────────────────────────────────────
  const fireRegen = useCallback(async (mission: string) => {
    if (!sessionId || regenFired) return;
    setRegenFired(true);
    try {
      const res = await fetch('/api/session/regenerate-mission-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          context: mission,
          contextType: 'mission',
          activityKeys: ['fact-detective', 'would-you-rather', 'expert-panel', 'scenario-simulator', 'hot-take-arena', 'opinion-shift'],
          topic: sessionSettings.customTopic?.trim() || sessionSettings.topic,
          difficulty: sessionSettings.difficulty,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { updatedContent?: Record<string, unknown> };
        if (data.updatedContent) {
          onContentRegenerate?.(data.updatedContent as Record<string, import('../types').ActivityGeneratedContent>);
        }
      }
    } catch {
      // regen is best-effort — lesson continues without it
    }
  }, [sessionId, regenFired, sessionSettings.customTopic, sessionSettings.topic, sessionSettings.difficulty, onContentRegenerate]);

  // ── Transition handlers ────────────────────────────────────────────────────
  const handleFinish = useCallback(() => {
    const winner = topVotedQuestion(questions, picksRef.current);
    setWinningQuestion(winner);
    setClassMission(winner);

    // Skip stance for Beginner — fire regen immediately
    if (sessionSettings.difficulty === 'Beginner') {
      void fireRegen(winner);
      setPhase('done');
      onPhaseChange?.('done');
      onPhaseChange?.('finished');
      return;
    }

    setPhase('stance');
    onPhaseChange?.('stance');
  }, [questions, setClassMission, sessionSettings.difficulty, fireRegen, onPhaseChange]);

  const handleStanceFinish = useCallback(() => {
    const mission = winningQuestion ?? '';
    void fireRegen(mission);
    setPhase('done');
    onPhaseChange?.('done');
    onPhaseChange?.('finished');
  }, [winningQuestion, fireRegen, onPhaseChange]);

  // Auto-advance stance when timer hits 0
  useEffect(() => {
    if (phase === 'stance' && stanceTimer === 0) {
      handleStanceFinish();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stanceTimer, phase]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const pickCount = Object.keys(picks).length;
  const distribution = questions.map((q) => ({
    question: q,
    count: Object.values(picks).filter((p) => p.question === q).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  const stanceCount = Object.keys(stances).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-violet-400">Mission Selector</h3>
        {phase === 'presenting' && (
          <span className="text-sm opacity-60">{pickCount} selected</span>
        )}
        {phase === 'stance' && (
          <>
            <span className="text-sm opacity-60">{stanceTimer}s</span>
            <button onClick={() => setStanceTimer(prev => prev + 30)} className="px-2 py-1 rounded-lg text-xs font-game bg-white/10 hover:bg-white/20 text-slate-300 transition-all border border-white/10">+30s</button>
          </>
        )}
      </div>

      {/* PRESENTING */}
      {phase === 'presenting' && (
        <div className="space-y-5">
          <div className="space-y-2">
            {distribution.map(({ question, count }) => (
              <div key={question} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-80 flex-1 min-w-0 pr-3 leading-snug">{question}</span>
                  <span className="font-semibold text-violet-400 shrink-0">{count}</span>
                </div>
                <div className="h-2 bg-lc-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: count > 0 ? `${(count / maxCount) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleFinish}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              LOCK IN MISSION
            </button>
          </div>
        </div>
      )}

      {/* STANCE */}
      {phase === 'stance' && (
        <div className="space-y-5">
          {/* Winning question banner */}
          <div className="glass p-5 rounded-2xl border-2 border-violet-500/40 space-y-1 text-center">
            <p className="text-xs opacity-50 uppercase tracking-widest">Class mission</p>
            <p className="text-lg font-semibold text-violet-300">{winningQuestion}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm opacity-70">Opening stances coming in…</p>
              <span className="text-sm text-violet-400 font-semibold">{stanceCount} submitted</span>
            </div>
            {Object.values(stances).map(({ text, displayName }) => (
              <div key={displayName} className="glass px-4 py-2 rounded-xl flex items-start gap-3 text-sm animate-fade-in">
                <span className="opacity-50 shrink-0">{displayName}</span>
                <span className="opacity-80 italic">&ldquo;{text}&rdquo;</span>
              </div>
            ))}
          </div>

          {/* Timer bar */}
          <div className="space-y-1">
            <div className="h-1.5 bg-lc-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${(stanceTimer / STANCE_TIMER_SECONDS) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleStanceFinish}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-game text-sm shadow-lg hover:scale-105 active:scale-95 transition-all text-white"
            >
              BEGIN LESSON
            </button>
          </div>
        </div>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div className="glass p-6 rounded-2xl space-y-3 text-center">
          <p className="text-lg font-semibold text-violet-300">Mission locked in!</p>
          {winningQuestion && (
            <p className="text-sm opacity-70 italic">&ldquo;{winningQuestion}&rdquo;</p>
          )}
          <p className="text-sm opacity-50">Content is being tuned to your mission…</p>
        </div>
      )}
    </div>
  );
}

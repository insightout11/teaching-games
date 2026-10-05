'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Zap, Pause, Play, SkipForward } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';
import type { ActivityProps } from '../types';
import type { SpeakingFrameCard } from '../shared/speaking-turns';
import { fallbackQuickFire } from '@/lib/quick-fire';

// Quick-fire chain (Speak v2 warm-up): one fun question, everyone answers in 10 seconds, the turn
// passes on. Fair order (least-featured first), a visible countdown that moves on by itself just
// after "Time!", Next to finish early, Pause. Everyone talks within the first few minutes, and
// nobody is on stage for long. Phones show "Your turn!" / "You're next".

const TURN_SECONDS = 10;
const GRACE_MS = 1500;

type Phase = 'idle' | 'chain' | 'done';

export function QuickFireActivity({ students, generatedContent, onSetInputSpec, onScore, onPhaseChange }: ActivityProps) {
  const content = generatedContent as { questions?: string[]; topicContext?: string } | null;
  const questions = useMemo(() => (content?.questions?.length ? content.questions.slice(0, 4) : fallbackQuickFire(content?.topicContext ?? '')), [content]);
  const recordFeature = useSessionStore((s) => s.recordFeature);

  const rosterKey = students.map((s) => s.id).join(',');
  const rosterRef = useRef(students); rosterRef.current = students;
  const order = useMemo<Array<Student | null>>(() => {
    const list = rosterRef.current;
    if (!list.length) return [null];
    const counts = useSessionStore.getState().callCounts;
    return [...list].sort((a, b) => (counts[a.id] ?? 0) - (counts[b.id] ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-snapshot only when the roster ids change
  }, [rosterKey]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [q, setQ] = useState(0);
  const [turn, setTurn] = useState(0);
  const [left, setLeft] = useState(TURN_SECONDS);
  const [paused, setPaused] = useState(false);
  const speaker = order[turn] ?? null;
  const next = order[turn + 1] ?? null;
  const lastTurn = turn + 1 >= order.length;
  const lastQuestion = q + 1 >= questions.length;

  // Phones: the question for everyone, "Your turn!" for the speaker, "You're next" for the next one.
  useEffect(() => {
    if (phase !== 'chain') { onSetInputSpec?.(null); return; }
    const per: Record<string, unknown> = { __room: true };
    students.forEach((s) => {
      const card: SpeakingFrameCard = {
        role: 'speaking-frame',
        title: s.id === speaker?.id ? 'Your turn! 10 seconds' : s.id === next?.id ? 'You’re next: get ready' : 'Quick-fire',
        prompt: questions[q],
        helpers: [{ label: 'Start with', items: ['I think…', 'For me,…', 'Probably…', 'Definitely…'] }],
        yourTurn: s.id === speaker?.id,
      };
      per[s.id] = card;
      per[s.name] = card;
    });
    onSetInputSpec?.({ type: 'confirm', gameKey: 'quick-fire', prompt: 'Quick-fire', perStudentData: per, stableInput: true });
  }, [phase, q, speaker, next, students, questions, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const advance = useCallback(() => {
    if (speaker) {
      recordFeature(speaker.id);
      void onScore?.({ studentId: speaker.id, clientId: null, displayName: speaker.name, promptIndex: q * 100 + turn + 1, points: 1, isCorrect: null });
    }
    setLeft(TURN_SECONDS);
    if (!lastTurn) { setTurn((t) => t + 1); return; }
    if (!lastQuestion) { setQ((x) => x + 1); setTurn(0); return; }
    setPhase('done');
    onPhaseChange?.('finished');
  }, [speaker, q, turn, lastTurn, lastQuestion, recordFeature, onScore, onPhaseChange]);

  // The clock: ticks while running; at 0 shows "Time!", then moves on by itself.
  const advanceRef = useRef(advance); advanceRef.current = advance;
  useEffect(() => {
    if (phase !== 'chain' || paused) return;
    if (left <= 0) {
      const id = window.setTimeout(() => advanceRef.current(), GRACE_MS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, paused, left]);

  const start = () => { setQ(0); setTurn(0); setLeft(TURN_SECONDS); setPaused(false); setPhase('chain'); onPhaseChange?.('chain'); };

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[380px] flex-col items-center justify-center gap-6 py-6 text-center">
        <Zap className="h-16 w-16 text-amber-300" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300/80">Quick-fire</p>
          <h3 className="mt-2 text-3xl font-game text-white">Everyone, ten seconds each</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">One question, then the turn passes on. Short answers are fine. Just keep it moving!</p>
        </div>
        <button onClick={start} className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-10 py-4 font-game text-lg text-white shadow-xl transition hover:scale-105">GO</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
        <Zap className="h-12 w-12 text-amber-300" />
        <h3 className="text-2xl font-game text-white">Everyone’s warmed up</h3>
        <p className="max-w-md text-sm text-slate-300">{order.filter(Boolean).length} voices, {questions.length} questions.</p>
      </div>
    );
  }

  const pct = Math.max(0, left) / TURN_SECONDS;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300/80">Quick-fire · question {q + 1} of {questions.length}</p>
        <span className="text-sm text-slate-400">turn {Math.min(turn + 1, order.length)} of {order.length}</span>
      </div>
      <div className="rounded-2xl border-2 border-amber-400/30 bg-amber-500/[0.08] p-6 text-center">
        <p className="text-2xl font-game text-white">{questions[q]}</p>
      </div>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center">
        <p className="text-5xl font-game text-white">{speaker ? speaker.name : 'Everyone'}</p>
        <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${left <= 3 ? 'bg-rose-400' : 'bg-amber-300'}`} style={{ width: `${pct * 100}%` }} />
        </div>
        <p className={`font-game text-3xl ${left <= 0 ? 'text-rose-300' : 'text-amber-200'}`}>{left <= 0 ? 'Time!' : left}</p>
        {next && <p className="text-sm text-slate-400">Next: <span className="text-slate-200">{next.name}</span></p>}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setPaused((p) => !p)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-game text-sm text-slate-200 hover:bg-white/10">
          {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}{paused ? 'RESUME' : 'PAUSE'}
        </button>
        <button onClick={advance} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">
          <SkipForward className="h-4 w-4" aria-hidden />{lastTurn && lastQuestion ? 'FINISH' : lastTurn ? 'NEXT QUESTION' : 'NEXT'}
        </button>
      </div>
    </div>
  );
}

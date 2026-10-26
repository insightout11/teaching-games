'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Zap, Pause, Play, Plus, SkipForward } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';
import type { ActivityProps } from '../types';
import type { SpeakingFrameCard } from '../shared/speaking-turns';
import { fallbackQuickFire, getQuickFireRoster, mixedQuickFire } from '@/lib/quick-fire';

// Quick-fire chain (Speak v2 warm-up): one fun question, everyone answers in a short turn (10, 20 or 30 seconds, +10 when needed), the turn
// passes on. Fair order (least-featured first), a visible countdown that moves on by itself just
// after "Time!", Next to finish early, Pause. Everyone talks within the first few minutes, and
// nobody is on stage for long. Phones show "Your turn!" / "You're next".

const TURN_CHOICES = [10, 20, 30] as const;
const ADD_SECONDS = 10;
const GRACE_MS = 1500;

type Phase = 'idle' | 'chain' | 'done';

export function QuickFireActivity({ students, generatedContent, onSetInputSpec, onScore, onPhaseChange }: ActivityProps) {
  const content = generatedContent as { questions?: string[]; topicContext?: string } | null;
  const questions = useMemo(() => (content?.questions?.length ? content.questions.slice(0, 4) : fallbackQuickFire(content?.topicContext ?? '')), [content]);
  const recordFeature = useSessionStore((s) => s.recordFeature);

  // Everyone takes a turn: phones, and students on the plane without a device (from the room's seat map)
  const deviceless = useSessionStore((s) => s.devicelessStudents);
  const everyone = useMemo(() => getQuickFireRoster(students, deviceless), [students, deviceless]);
  const rosterKey = everyone.map((s) => s.id).join(',');
  const rosterRef = useRef(everyone); rosterRef.current = everyone;
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
  // Turn length: chosen before starting (20 s by default; 10 s was too fast), and +10 s for a turn that needs it
  const [turnSeconds, setTurnSeconds] = useState<number>(20);
  const [turnTotal, setTurnTotal] = useState<number>(20);
  const [left, setLeft] = useState(20);
  const [paused, setPaused] = useState(false);
  // "Same question" (the chain) or "Mix it up": a different random question for each student, one round
  const [mix, setMix] = useState(false);
  const [mixed, setMixed] = useState<string[]>([]);
  const speaker = order[turn] ?? null;
  const next = order[turn + 1] ?? null;
  const lastTurn = turn + 1 >= order.length;
  const lastQuestion = mix || q + 1 >= questions.length;
  const question = mix ? (mixed[turn] ?? questions[0]) : questions[q];

  // Phones: the question for everyone, "Your turn!" for the speaker, "You're next" for the next one.
  useEffect(() => {
    if (phase !== 'chain') { onSetInputSpec?.(null); return; }
    const per: Record<string, unknown> = { __room: true };
    students.forEach((s) => {
      const card: SpeakingFrameCard = {
        role: 'speaking-frame',
        title: s.id === speaker?.id ? `Your turn! ${turnTotal} seconds` : s.id === next?.id ? 'You’re next: get ready' : 'Quick-fire',
        prompt: question,
        helpers: [{ label: 'Start with', items: ['I think…', 'For me,…', 'Probably…', 'Definitely…'] }],
        yourTurn: s.id === speaker?.id,
      };
      per[s.id] = card;
      per[s.name] = card;
    });
    onSetInputSpec?.({ type: 'confirm', gameKey: 'quick-fire', prompt: 'Quick-fire', perStudentData: per, stableInput: true });
  }, [phase, speaker, next, students, question, onSetInputSpec, turnTotal]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const advance = useCallback(() => {
    if (speaker) {
      recordFeature(speaker.id);
      void onScore?.({ studentId: speaker.id, clientId: null, displayName: speaker.name, promptIndex: q * 100 + turn + 1, points: 1, isCorrect: null });
    }
    setLeft(turnSeconds);
    setTurnTotal(turnSeconds);
    if (!lastTurn) { setTurn((t) => t + 1); return; }
    if (!lastQuestion) { setQ((x) => x + 1); setTurn(0); return; }
    setPhase('done');
    onPhaseChange?.('finished');
  }, [speaker, q, turn, lastTurn, lastQuestion, recordFeature, onScore, onPhaseChange, turnSeconds]);

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

  const addTime = () => { setLeft((x) => Math.max(0, x) + ADD_SECONDS); setTurnTotal((t) => Math.max(t, 0) + ADD_SECONDS); };
  const start = () => { setMixed(mix ? mixedQuickFire(questions, order.length) : []); setQ(0); setTurn(0); setLeft(turnSeconds); setTurnTotal(turnSeconds); setPaused(false); setPhase('chain'); onPhaseChange?.('chain'); };

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[380px] flex-col items-center justify-center gap-6 py-6 text-center">
        <Zap className="h-16 w-16 text-amber-300" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300/80">Quick-fire</p>
          <h3 className="mt-2 text-3xl font-game text-white">Everyone, {turnSeconds} seconds each</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">{mix ? 'A different question for each person. Short answers are fine. Just keep it moving!' : 'One question, then the turn passes on. Short answers are fine. Just keep it moving!'}</p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Questions">
          <span className="text-sm text-slate-400">Questions</span>
          <button type="button" onClick={() => setMix(false)} className={`rounded-full border px-3 py-1 text-sm ${!mix ? 'border-amber-300/70 bg-amber-300/15 text-amber-100' : 'border-white/15 text-slate-300 hover:text-white'}`}>Same for everyone</button>
          <button type="button" onClick={() => setMix(true)} className={`rounded-full border px-3 py-1 text-sm ${mix ? 'border-amber-300/70 bg-amber-300/15 text-amber-100' : 'border-white/15 text-slate-300 hover:text-white'}`}>Mix it up</button>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Seconds per turn">
          <span className="text-sm text-slate-400">Each turn</span>
          {TURN_CHOICES.map((n) => (
            <button key={n} type="button" onClick={() => setTurnSeconds(n)} className={`rounded-full border px-3 py-1 text-sm ${turnSeconds === n ? 'border-amber-300/70 bg-amber-300/15 text-amber-100' : 'border-white/15 text-slate-300 hover:text-white'}`}>{n} s</button>
          ))}
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
        <p className="max-w-md text-sm text-slate-300">{order.filter(Boolean).length} voices, {mix ? order.filter(Boolean).length : questions.length} questions.</p>
      </div>
    );
  }

  const pct = Math.min(1, Math.max(0, left) / Math.max(1, turnTotal));
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300/80">{mix ? 'Quick-fire · mix it up' : `Quick-fire · question ${q + 1} of ${questions.length}`}</p>
        <span className="text-sm text-slate-400">turn {Math.min(turn + 1, order.length)} of {order.length}</span>
      </div>
      <div className="rounded-2xl border-2 border-amber-400/30 bg-amber-500/[0.08] p-6 text-center">
        <p className="text-2xl font-game text-white">{question}</p>
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
        <button onClick={addTime} title="Give this turn 10 more seconds" className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 font-game text-sm text-amber-100 hover:bg-amber-300/20">
          <Plus className="h-4 w-4" aria-hidden />10 S
        </button>
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

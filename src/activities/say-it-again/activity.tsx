'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Repeat, Pause, Play, SkipForward, Timer } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';
import type { ActivityProps } from '../types';
import type { SpeakingFrameCard } from '../shared/speaking-turns';
import { SAY_AGAIN_SECONDS, fallbackSayItAgain } from '@/lib/say-it-again';

// Say it again, better (Speak v2, 4-3-2 fluency): everyone answers the same personal question
// three times, with less time each round (40s → 30s → 20s). Saying it again is how fluency grows;
// the shrinking clock makes it a game. Fair order, visible countdown that moves on by itself just
// after "Time!", Next to finish early, Pause. Phones show the question + the lesson phrases.

const GRACE_MS = 1500;
const ROUND_GOALS = [
  'Say as much as you can. No rush, just keep talking.',
  'Same answer, less time. Add one of the lesson phrases.',
  'Last time, the best version. Keep the best bits, drop the rest.',
];

type Phase = 'idle' | 'turns' | 'between' | 'done';

export function SayItAgainActivity({ students, generatedContent, onSetInputSpec, onScore, onPhaseChange }: ActivityProps) {
  const raw = generatedContent as { question?: string; topicContext?: string } | null;
  const question = raw?.question?.trim() || fallbackSayItAgain(raw?.topicContext ?? '');
  const recordFeature = useSessionStore((s) => s.recordFeature);
  const kitPhrases = useSessionStore((s) => s.lessonKit?.phrases);
  const phrases = useMemo(() => (kitPhrases ?? []).slice(0, 6), [kitPhrases]);

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
  const [round, setRound] = useState(0);
  const [turn, setTurn] = useState(0);
  const seconds = SAY_AGAIN_SECONDS[round];
  const [left, setLeft] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const speaker = order[turn] ?? null;
  const next = order[turn + 1] ?? null;
  const lastTurn = turn + 1 >= order.length;
  const lastRound = round + 1 >= SAY_AGAIN_SECONDS.length;

  useEffect(() => {
    if (phase !== 'turns') { onSetInputSpec?.(null); return; }
    const per: Record<string, unknown> = { __room: true };
    const helpers = phrases.length ? [{ label: 'Lesson phrases', items: phrases }] : [];
    students.forEach((s) => {
      const card: SpeakingFrameCard = {
        role: 'speaking-frame',
        title: s.id === speaker?.id ? `Your turn! ${seconds} seconds` : s.id === next?.id ? 'You’re next: get ready' : `Round ${round + 1}: ${seconds} seconds`,
        prompt: question,
        helpers,
        yourTurn: s.id === speaker?.id,
      };
      per[s.id] = card;
      per[s.name] = card;
    });
    onSetInputSpec?.({ type: 'confirm', gameKey: 'say-it-again', prompt: 'Say it again, better', perStudentData: per, stableInput: true });
  }, [phase, round, seconds, speaker, next, students, question, phrases, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const advance = useCallback(() => {
    if (speaker) {
      recordFeature(speaker.id);
      void onScore?.({ studentId: speaker.id, clientId: null, displayName: speaker.name, promptIndex: round * 100 + turn + 1, points: 1, isCorrect: null });
    }
    if (!lastTurn) { setTurn((t) => t + 1); setLeft(seconds); return; }
    if (!lastRound) { setPhase('between'); return; }
    setPhase('done');
    onPhaseChange?.('finished');
  }, [speaker, round, turn, lastTurn, lastRound, seconds, recordFeature, onScore, onPhaseChange]);

  const advanceRef = useRef(advance); advanceRef.current = advance;
  useEffect(() => {
    if (phase !== 'turns' || paused) return;
    if (left <= 0) {
      const id = window.setTimeout(() => advanceRef.current(), GRACE_MS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, paused, left]);

  const startRound = (r: number) => {
    setRound(r); setTurn(0); setLeft(SAY_AGAIN_SECONDS[r]); setPaused(false); setPhase('turns');
    onPhaseChange?.(`round-${r + 1}`);
  };

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 py-6 text-center">
        <Repeat className="h-16 w-16 text-violet-300" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-300/80">Say it again, better</p>
          <h3 className="mt-2 text-3xl font-game text-white">{question}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">Everyone answers three times: 40 seconds, then 30, then 20. Same answer, getting better and faster each time.</p>
        </div>
        <div className="flex gap-2">
          {SAY_AGAIN_SECONDS.map((s, i) => <span key={s} className="rounded-full border border-violet-400/40 bg-violet-500/10 px-4 py-1.5 text-sm font-semibold text-violet-100">Round {i + 1}: {s}s</span>)}
        </div>
        <button onClick={() => startRound(0)} className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 px-10 py-4 font-game text-lg text-white shadow-xl transition hover:scale-105">START</button>
      </div>
    );
  }

  if (phase === 'between') {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center gap-5 text-center">
        <Timer className="h-12 w-12 text-violet-300" />
        <h3 className="text-2xl font-game text-white">Round {round + 2}: {SAY_AGAIN_SECONDS[round + 1]} seconds</h3>
        <p className="max-w-md text-sm text-slate-300">{ROUND_GOALS[round + 1]}</p>
        {round === 0 && phrases.length > 0 && (
          <div className="flex max-w-xl flex-wrap justify-center gap-2">
            {phrases.map((p) => <span key={p} className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-100">{p}</span>)}
          </div>
        )}
        <button onClick={() => startRound(round + 1)} className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 px-8 py-4 font-game text-base text-white shadow-xl transition hover:scale-105">GO</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
        <Repeat className="h-12 w-12 text-violet-300" />
        <h3 className="text-2xl font-game text-white">Said three times, better each time</h3>
        <p className="max-w-md text-sm text-slate-300">40, 30, 20 seconds: that’s how fluency grows.</p>
      </div>
    );
  }

  const pct = Math.max(0, left) / seconds;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300/80">Say it again · round {round + 1} of {SAY_AGAIN_SECONDS.length} · {seconds} seconds</p>
        <span className="text-sm text-slate-400">turn {Math.min(turn + 1, order.length)} of {order.length}</span>
      </div>
      <div className="rounded-2xl border-2 border-violet-400/30 bg-violet-500/[0.08] p-5 text-center">
        <p className="text-2xl font-game text-white">{question}</p>
        <p className="mt-2 text-sm text-violet-100/80">{ROUND_GOALS[round]}</p>
      </div>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center">
        <p className="text-5xl font-game text-white">{speaker ? speaker.name : 'Everyone'}</p>
        <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${left <= 5 ? 'bg-rose-400' : 'bg-violet-300'}`} style={{ width: `${pct * 100}%` }} />
        </div>
        <p className={`font-game text-3xl ${left <= 0 ? 'text-rose-300' : 'text-violet-200'}`}>{left <= 0 ? 'Time!' : left}</p>
        {next && <p className="text-sm text-slate-400">Next: <span className="text-slate-200">{next.name}</span></p>}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setPaused((p) => !p)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-game text-sm text-slate-200 hover:bg-white/10">
          {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}{paused ? 'RESUME' : 'PAUSE'}
        </button>
        <button onClick={advance} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">
          <SkipForward className="h-4 w-4" aria-hidden />{lastTurn && lastRound ? 'FINISH' : lastTurn ? 'END ROUND' : 'NEXT'}
        </button>
      </div>
    </div>
  );
}

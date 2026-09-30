'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, ArrowRight, Check, Clock, Mic, SkipForward, Trophy } from 'lucide-react';
import type { ActivityProps, HotSeatContent, TabooRound } from '../types';
import type { Student } from '@/lib/supabase/types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import type { HotSeatCard, HotSeatRoom } from '@/components/student/hot-seat-panel';

const TURN_SECONDS = 60;
const POINTS_GUESSER = 3;
const POINTS_CLUE = 2;

type Phase = 'idle' | 'ready' | 'turn' | 'summary' | 'done';
type Result = { card: TabooRound; outcome: 'got' | 'pass'; clue?: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Hot Seat (Heads Up for a class): one student can't see the word; every other
 * phone shows it. Classmates take turns giving one spoken clue each; the teacher
 * taps "Got it" when the hot seat says the word. Everyone speaks, every turn.
 */
export function HotSeatActivity({ students, generatedContent, onPhaseChange, onSetInputSpec, onScore }: ActivityProps) {
  const content = generatedContent as HotSeatContent;
  const deckAll = useMemo(() => content.cards ?? [], [content.cards]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [hot, setHot] = useState<Student | null>(null);
  const [turns, setTurns] = useState<Record<string, number>>({});
  const [deck, setDeck] = useState<TabooRound[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [clueIdx, setClueIdx] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [turnStart, setTurnStart] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [flash, setFlash] = useState<string | null>(null);
  const promptIndexRef = useRef(1);

  const card = deck[cardIdx] ?? null;
  const cluers = useMemo(() => students.filter((s) => s.id !== hot?.id), [students, hot]);
  const clueGiver = cluers.length ? cluers[clueIdx % cluers.length] : null;
  const turnResults = results.slice(turnStart);
  const used = useMemo(() => new Set(results.map((r) => r.card.word)), [results]);
  const cardsLeft = deckAll.filter((c) => !used.has(c.word)).length;

  // ─── Timer ───
  useEffect(() => {
    if (phase !== 'turn') return;
    if (timeLeft <= 0) { setPhase('summary'); onPhaseChange?.('summary'); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, onPhaseChange]);

  // ─── Phones ───
  useEffect(() => {
    if ((phase !== 'ready' && phase !== 'turn') || !hot) { onSetInputSpec?.(null); return; }
    const data: Record<string, unknown> = {
      __room: { phase: phase === 'turn' ? 'turn' : 'ready', hotSeat: hot.name, clueGiver: phase === 'turn' ? clueGiver?.name ?? null : null } satisfies HotSeatRoom,
    };
    const put = (s: Student, c: HotSeatCard) => { data[s.id] = c; data[s.name] = c; };
    put(hot, { role: 'hot' });
    if (phase === 'turn' && card) {
      cluers.forEach((s) => put(s, { role: 'clue', word: card.word, hint: card.description, yourTurn: s.id === clueGiver?.id }));
    }
    onSetInputSpec?.({ type: 'confirm', gameKey: 'hot-seat', prompt: `${hot.name} is in the hot seat`, perStudentData: data });
  }, [phase, hot, card, cluers, clueGiver, onSetInputSpec]);

  // ─── Flow ───
  const pickHot = useCallback((taken: Record<string, number>, exclude?: string) => {
    const pool = students.filter((s) => s.id !== exclude);
    if (!pool.length) return null;
    const least = Math.min(...pool.map((s) => taken[s.id] ?? 0));
    const fresh = pool.filter((s) => (taken[s.id] ?? 0) === least);
    return fresh[Math.floor(Math.random() * fresh.length)];
  }, [students]);

  const begin = () => {
    setHot(pickHot(turns));
    setPhase('ready');
    onPhaseChange?.('ready');
  };

  const startTurn = () => {
    const left = deckAll.filter((c) => !used.has(c.word));
    setDeck(shuffle(left.length ? left : deckAll));
    setCardIdx(0);
    setClueIdx(Math.floor(Math.random() * Math.max(1, cluers.length)));
    setTurnStart(results.length);
    setTimeLeft(TURN_SECONDS);
    setPhase('turn');
    onPhaseChange?.('turn');
  };

  const nextCard = (r: Result) => {
    setResults((prev) => [...prev, r]);
    setClueIdx((i) => i + 1);
    setCardIdx((i) => {
      const n = i + 1;
      if (n >= deck.length) { setPhase('summary'); onPhaseChange?.('summary'); }
      return n;
    });
  };

  const gotIt = () => {
    if (!card || !hot) return;
    const idx = promptIndexRef.current++;
    void onScore?.({ studentId: hot.id, clientId: null, displayName: hot.name, promptIndex: idx, points: POINTS_GUESSER, isCorrect: true });
    if (clueGiver) void onScore?.({ studentId: clueGiver.id, clientId: null, displayName: clueGiver.name, promptIndex: idx, points: POINTS_CLUE, isCorrect: null, outcome: 'on-task' });
    setFlash(card.word);
    setTimeout(() => setFlash(null), 1300);
    nextCard({ card, outcome: 'got', clue: clueGiver?.name });
  };

  const nextTurn = () => {
    if (!hot) return;
    const taken = { ...turns, [hot.id]: (turns[hot.id] ?? 0) + 1 };
    setTurns(taken);
    setHot(pickHot(taken, hot.id));
    setPhase('ready');
    onPhaseChange?.('ready');
  };

  // ─── Render ───
  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-6 text-center text-white">
        <Armchair className="mx-auto h-10 w-10 text-amber-300" />
        <p className="font-display text-5xl">Hot Seat.</p>
        <p className="mx-auto max-w-xl text-lg text-white/70">One student sits in the hot seat and can&apos;t see the word. Everyone else sees it on their phone and takes turns giving one spoken clue. How many can they get in {TURN_SECONDS} seconds?</p>
        {students.length < 3 && <p className="text-sm text-amber-200">Needs at least 3 students ({students.length} joined).</p>}
        <div className="flex justify-center">
          <KitButton tone="amber" solid disabled={students.length < 3 || deckAll.length === 0} onClick={begin} className="!px-8 !py-3 !text-base" icon={<Armchair className="h-4 w-4" />}>Choose the hot seat</KitButton>
        </div>
      </div>
    );
  }

  if (phase === 'ready' && hot) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 text-center text-white">
        <KitLabel tone="amber">In the hot seat</KitLabel>
        <p className="font-display text-6xl">{hot.name}</p>
        <p className="text-lg text-white/70">{hot.name}: look away from other screens. Everyone else: the word will appear on your phone. One clue each, in turn, out loud, and never the word itself!</p>
        <div className="flex justify-center gap-2">
          <KitButton onClick={() => setHot(pickHot({ ...turns, [hot.id]: 99 }))}>Someone else</KitButton>
          <KitButton tone="amber" solid onClick={startTurn} className="!px-7 !py-2.5 !text-sm" icon={<Clock className="h-4 w-4" />}>Start {TURN_SECONDS}s</KitButton>
        </div>
        <KitReadout>{cardsLeft} words left</KitReadout>
      </div>
    );
  }

  if (phase === 'turn' && hot) {
    const got = turnResults.filter((r) => r.outcome === 'got').length;
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <KitLabel tone="amber">Hot seat</KitLabel>
            <p className="font-display text-4xl">{hot.name}</p>
          </div>
          <div className="text-right">
            <KitLabel>Got</KitLabel>
            <p className="font-display text-4xl text-emerald-300">{got}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Clock className={`h-5 w-5 ${timeLeft <= 10 ? 'text-rose-300' : 'text-white/60'}`} />
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className={`h-full ${timeLeft <= 10 ? 'bg-rose-400' : 'bg-amber-300'}`} animate={{ width: `${(timeLeft / TURN_SECONDS) * 100}%` }} transition={{ ease: 'linear', duration: 1 }} />
          </div>
          <span className={`w-12 text-right font-mono text-3xl ${timeLeft <= 10 ? 'text-rose-300' : ''}`}>{timeLeft}</span>
          <KitButton onClick={() => setTimeLeft((t) => t + 30)}>+30s</KitButton>
        </div>

        <div className="flex min-h-[170px] items-center justify-center rounded-[1.75rem] border border-white/12 bg-slate-950/45 p-6">
          <AnimatePresence mode="wait">
            {flash ? (
              <motion.p key={`f-${flash}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="font-display text-5xl text-emerald-300">
                <Check className="mr-2 inline h-10 w-10" />{flash}!
              </motion.p>
            ) : (
              <motion.div key={`c-${cardIdx}-${clueIdx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 text-center">
                <KitLabel tone="emerald">Next clue</KitLabel>
                <p className="flex items-center justify-center gap-3 font-display text-5xl"><Mic className="h-9 w-9 text-emerald-300" />{clueGiver?.name ?? '—'}</p>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/45">Word {cardIdx + 1} · it&apos;s on everyone&apos;s phone except {hot.name}&apos;s</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <KitButton onClick={() => setClueIdx((i) => i + 1)} icon={<ArrowRight className="h-3.5 w-3.5" />}>Next clue-giver</KitButton>
          <div className="flex gap-2">
            <KitButton onClick={() => card && nextCard({ card, outcome: 'pass' })} icon={<SkipForward className="h-3.5 w-3.5" />}>Pass</KitButton>
            <KitButton tone="emerald" solid onClick={gotIt} className="!px-7 !py-2.5 !text-sm" icon={<Check className="h-4 w-4" />}>Got it!</KitButton>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'summary' && hot) {
    const got = turnResults.filter((r) => r.outcome === 'got').length;
    return (
      <div className="mx-auto max-w-3xl space-y-5 text-white">
        <div className="text-center">
          <KitLabel tone="emerald">Time!</KitLabel>
          <p className="mt-1 font-display text-5xl">{hot.name}: {got} word{got === 1 ? '' : 's'}</p>
        </div>
        <div className="space-y-2">
          {turnResults.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-2.5 ${r.outcome === 'got' ? 'border-emerald-300/40 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03]'}`}>
              {r.outcome === 'got' ? <Check className="h-5 w-5 text-emerald-300" /> : <SkipForward className="h-5 w-5 text-white/45" />}
              <span className="font-display text-2xl">{r.card.word}</span>
              <span className="text-sm text-white/60">{r.card.description}</span>
              {r.clue && <span className="ml-auto font-mono text-xs text-emerald-200">clue: {r.clue}</span>}
            </motion.div>
          ))}
          {turnResults.length === 0 && <p className="text-center text-white/50">No words this turn.</p>}
        </div>
        <div className="flex justify-center gap-2">
          <KitButton onClick={() => { setPhase('done'); onPhaseChange?.('finished'); }}>Finish</KitButton>
          <KitButton tone="amber" solid disabled={cardsLeft <= 0} onClick={nextTurn} className="!px-6 !py-2.5 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>{cardsLeft > 0 ? 'Next hot seat' : 'All words used'}</KitButton>
        </div>
      </div>
    );
  }

  const total = results.filter((r) => r.outcome === 'got').length;
  return (
    <div className="mx-auto max-w-3xl space-y-4 py-8 text-center text-white">
      <Trophy className="mx-auto h-10 w-10 text-amber-300" />
      <p className="font-display text-5xl">Great clues, everyone!</p>
      <p className="text-lg text-white/70">{total} of {results.length} words guessed</p>
      <div className="flex flex-wrap justify-center gap-2">
        {results.map((r, i) => <span key={i} className={`rounded-full border px-3 py-1 text-base ${r.outcome === 'got' ? 'border-emerald-300/40 text-emerald-100' : 'border-white/15 text-white/55'}`}>{r.card.word}</span>)}
      </div>
    </div>
  );
}

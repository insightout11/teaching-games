'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, Check, Clock, Mic, Shuffle, Sparkles, Star } from 'lucide-react';
import type { GameProps } from '../types';
import type { Student } from '@/lib/supabase/types';
import { getEffectiveTopic } from '@/stores/session-store';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import type { StoryChainCard, StoryChainRoom } from '@/components/student/story-chain-panel';

const TURN_SECONDS = 45;
const POINTS_TURN = 3;
const POINTS_CARD = 2;

// Story cards: a small push that makes each sentence richer (and gives shy speakers an idea).
const CARDS = [
  'Something goes wrong!', 'Add a new character.', 'Use the word "suddenly".', 'Describe a sound.',
  'Say how someone feels.', 'Add a place: where are they now?', 'Use "but".', 'Someone asks a question.',
  'Describe the weather.', 'Add a surprise!', 'Use a past tense verb you love.', 'Someone makes a decision.',
  'Describe something small and strange.', 'Use "because".', 'Time jumps forward.', 'Add a smell or a taste.',
];

type Line = { id: string; teller: string; text: string; card?: string; cardDone?: boolean; isStarter?: boolean };
type Recap = { title: string; summary: string; bestLine?: { text: string; studentName: string; reason: string } };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Story Chain (spoken Story Sprint): the class builds a story out loud, one
 * sentence per student, each prompted by a story card on their phone. Typing is
 * optional (a few words for the board); the AI writes a recap at the end.
 */
export function StoryChain({ students, onScore, sessionSettings, onSetInputSpec, onRegisterRemoteVoteHandler, onBack }: GameProps & { onBack: () => void }) {
  const topic = getEffectiveTopic(sessionSettings);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'telling' | 'recap'>('idle');
  const [lines, setLines] = useState<Line[]>([]);
  const [order, setOrder] = useState<Student[]>([]);
  const [turn, setTurn] = useState(0);
  const [card, setCard] = useState('');
  const [typed, setTyped] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [recap, setRecap] = useState<Recap | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const [retell, setRetell] = useState<string | null>(null);
  const deckRef = useRef<string[]>([]);
  const promptIndexRef = useRef(1);

  const teller = order.length ? order[turn % order.length] : null;
  const lastLine = lines[lines.length - 1]?.text ?? null;

  const drawCard = useCallback(() => {
    if (!deckRef.current.length) deckRef.current = shuffle(CARDS);
    return deckRef.current.pop()!;
  }, []);

  // ─── Phones ───
  useEffect(() => {
    if (phase !== 'telling') { onSetInputSpec?.(null); return; }
    const data: Record<string, unknown> = { __room: { teller: teller?.name ?? null, lastLine, turn } satisfies StoryChainRoom };
    if (teller) {
      const c: StoryChainCard = { role: 'teller', card };
      data[teller.id] = c;
      data[teller.name] = c;
    }
    onSetInputSpec?.({ type: 'confirm', gameKey: 'story-sprint', prompt: 'Story Chain', allowMultiple: true, stableInput: true, perStudentData: data });
  }, [phase, teller, card, lastLine, turn, onSetInputSpec]);

  useEffect(() => {
    if (phase !== 'telling') return;
    onRegisterRemoteVoteHandler?.((vote) => {
      const m = /^line:([\s\S]+)$/.exec(vote.choice ?? '');
      if (!m || !teller) return;
      if (!(vote.studentId === teller.id || vote.clientId === teller.id || vote.displayName === teller.name)) return;
      setTyped(m[1].trim());
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [phase, teller, onRegisterRemoteVoteHandler]);

  // Turn clock (a nudge, not a hard stop)
  useEffect(() => {
    if (phase !== 'telling' || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  // ─── Flow ───
  const begin = async () => {
    setPhase('loading');
    let starter = 'Once upon a time, something unexpected happened.';
    try {
      const res = await fetch('/api/story-sprint/starter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, difficulty: sessionSettings.difficulty }) });
      const data = await res.json();
      if (data?.starterSentence) starter = data.starterSentence;
    } catch { /* keep the generic opening */ }
    setLines([{ id: 'starter', teller: 'Starter', text: starter, isStarter: true }]);
    setOrder(shuffle(students));
    setTurn(0);
    deckRef.current = [];
    setCard(drawCard());
    setTyped(null);
    setTimeLeft(TURN_SECONDS);
    setRecap(null);
    setRetell(null);
    setPhase('telling');
  };

  const commitTurn = (cardDone: boolean) => {
    if (!teller) return;
    const text = typed ?? `(${teller.name}'s part)`;
    setLines((prev) => [...prev, { id: `l-${Date.now()}`, teller: teller.name, text, card, cardDone }]);
    promptIndexRef.current++;
    onScore(teller.id, { isCorrect: null, points: POINTS_TURN + (cardDone ? POINTS_CARD : 0), outcome: 'on-task', responseData: { storyLine: text, card, cardDone } });
    setTurn((t) => t + 1);
    setCard(drawCard());
    setTyped(null);
    setTimeLeft(TURN_SECONDS);
  };

  const finish = async () => {
    setPhase('recap');
    setRecapLoading(true);
    try {
      const res = await fetch('/api/story-sprint/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentences: lines.map((l) => ({ text: l.text, studentName: l.teller, isStarter: l.isStarter })), topic, difficulty: sessionSettings.difficulty }),
      });
      const d = await res.json();
      setRecap({ title: d.title ?? 'Our story', summary: d.summary ?? '', bestLine: d.bestLine ?? (d.bestLineText ? { text: d.bestLineText, studentName: d.bestLineStudentName, reason: d.bestLineReason } : undefined) });
    } catch {
      setRecap({ title: 'Our story', summary: '' });
    }
    setRecapLoading(false);
  };

  const tellers = useMemo(() => Array.from(new Set(lines.filter((l) => !l.isStarter).map((l) => l.teller))), [lines]);

  // ─── Render ───
  if (phase === 'idle' || phase === 'loading') {
    return (
      <div className="mx-auto max-w-3xl space-y-5 py-4 text-center text-white">
        <BookOpen className="mx-auto h-10 w-10 text-amber-300" />
        <p className="font-display text-5xl">Story Chain.</p>
        <p className="mx-auto max-w-xl text-lg text-white/70">Build a story out loud, one sentence each. The storyteller&apos;s phone deals a story card (&ldquo;Something goes wrong!&rdquo;). Say it, don&apos;t write it: typing a few words for the board is optional.</p>
        <div className="flex justify-center gap-2">
          <KitButton onClick={onBack}>Other mode</KitButton>
          <KitButton tone="amber" solid disabled={phase === 'loading' || students.length < 1} onClick={() => void begin()} className="!px-8 !py-3 !text-base" icon={<Sparkles className="h-4 w-4" />}>{phase === 'loading' ? 'Opening the story…' : 'Start the story'}</KitButton>
        </div>
      </div>
    );
  }

  if (phase === 'telling') {
    return (
      <div className="mx-auto max-w-4xl space-y-4 text-white">
        <div className="flex items-center justify-between">
          <KitLabel tone="amber">Story Chain · line {lines.length}</KitLabel>
          <KitReadout>{tellers.length} storyteller{tellers.length === 1 ? '' : 's'} so far</KitReadout>
        </div>
        {/* The story so far (last lines, biggest at the bottom) */}
        <div className="max-h-[38vh] space-y-2 overflow-y-auto rounded-[1.5rem] border border-white/12 bg-slate-950/45 px-5 py-4">
          {lines.map((l, i) => (
            <motion.p key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`leading-snug ${i === lines.length - 1 ? 'font-display text-3xl text-white' : 'text-xl text-white/70'}`}>
              {l.text}{' '}
              {!l.isStarter && <span className="font-mono text-xs text-white/40">{l.teller}{l.cardDone ? ' · card' : ''}</span>}
            </motion.p>
          ))}
        </div>

        {teller && (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="rounded-2xl border-2 border-emerald-300/50 bg-emerald-400/10 px-5 py-4">
              <KitLabel tone="emerald">Now telling</KitLabel>
              <p className="flex items-center gap-2 font-display text-4xl"><Mic className="h-7 w-7 text-emerald-300" />{teller.name}</p>
              <p className="mt-1 text-lg text-amber-100">Card: {card}</p>
              <AnimatePresence>{typed && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 text-white/80">On the board: &ldquo;{typed}&rdquo;</motion.p>}</AnimatePresence>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4">
              <Clock className={`h-5 w-5 ${timeLeft <= 10 ? 'text-rose-300' : 'text-white/60'}`} />
              <span className={`font-mono text-3xl ${timeLeft <= 10 ? 'text-rose-300' : ''}`}>{timeLeft}</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <KitButton onClick={() => setCard(drawCard())} icon={<Shuffle className="h-3.5 w-3.5" />}>New card</KitButton>
            <KitButton onClick={() => { setTurn((t) => t + 1); setCard(drawCard()); setTyped(null); setTimeLeft(TURN_SECONDS); }}>Skip</KitButton>
          </div>
          <div className="flex gap-2">
            <KitButton onClick={() => commitTurn(false)} icon={<ArrowRight className="h-3.5 w-3.5" />}>Next storyteller</KitButton>
            <KitButton tone="amber" solid onClick={() => commitTurn(true)} className="!px-5 !py-2 !text-sm" icon={<Check className="h-4 w-4" />}>Used the card! Next</KitButton>
          </div>
        </div>
        <div className="flex justify-end">
          <KitButton tone="emerald" disabled={lines.length < 3} onClick={() => void finish()} icon={<Sparkles className="h-3.5 w-3.5" />}>The end: story recap</KitButton>
        </div>
      </div>
    );
  }

  // Recap
  return (
    <div className="mx-auto max-w-3xl space-y-5 text-white">
      <div className="text-center">
        <KitLabel tone="amber">Our story</KitLabel>
        <p className="mt-1 font-display text-5xl">{recapLoading ? 'Writing the recap…' : recap?.title}</p>
      </div>
      {recap?.summary && <p className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-4 text-xl leading-relaxed text-white/85">{recap.summary}</p>}
      {recap?.bestLine?.text && (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] p-4">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-amber-200"><Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />Favourite line · {recap.bestLine.studentName}</p>
          <p className="mt-1 font-display text-2xl">&ldquo;{recap.bestLine.text}&rdquo;</p>
          {recap.bestLine.reason && <p className="mt-1 text-white/70">{recap.bestLine.reason}</p>}
        </div>
      )}
      {retell && <p className="text-center text-lg text-emerald-100"><Mic className="mr-1 inline h-5 w-5" />{retell}, retell the whole story in three sentences!</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <KitButton tone="emerald" disabled={!tellers.length} onClick={() => setRetell(tellers[Math.floor(Math.random() * tellers.length)])} icon={<Mic className="h-3.5 w-3.5" />}>{retell ? 'Someone else retells' : 'Retell it'}</KitButton>
        <KitButton onClick={() => setPhase('telling')}>Keep going</KitButton>
        <KitButton tone="amber" solid onClick={() => void begin()} className="!px-6 !py-2.5 !text-sm">New story</KitButton>
      </div>
    </div>
  );
}

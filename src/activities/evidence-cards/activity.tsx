'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileSearch, ThumbsUp, ThumbsDown, Star, ChevronRight } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { ActivityProps } from '../types';
import { motionFor, validMotion, type DebateEvidence } from '@/lib/debate-motion';

// Debate v2 evidence stage (replaces Fact Detective in Debate): real, sourced facts about the
// motion, one card at a time. Phones: does it help FOR or AGAINST? Reveal shows the side and the
// class count (never names). Then the class votes the strongest card; it's saved for prep and the
// landing. With no sourced facts, the motion's own points become "reason" cards.

type Phase = 'idle' | 'card' | 'reveal' | 'strongest' | 'done';
const SIDES = ['FOR', 'AGAINST'];

interface Card extends DebateEvidence { kind: 'fact' | 'reason' }

export function EvidenceCardsActivity({ generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange }: ActivityProps) {
  const raw = generatedContent as { topicContext?: string } | null;
  const stored = useSessionStore((s) => s.lessonThread.debateMotion);
  const setStrongest = useSessionStore((s) => s.setDebateStrongest);
  const motion = useMemo(() => stored ?? validMotion(raw) ?? motionFor(raw?.topicContext ?? ''), [stored, raw]);
  const cards = useMemo<Card[]>(() => {
    if (motion.evidence.length >= 2) return motion.evidence.map((e) => ({ ...e, kind: 'fact' as const }));
    // No sourced facts: the motion's points, mixed for and against, as reasons to sort.
    const reasons: Card[] = [];
    for (let i = 0; i < 3; i++) {
      if (motion.forPoints[i]) reasons.push({ fact: motion.forPoints[i], side: 'for', source: '', kind: 'reason' });
      if (motion.againstPoints[i]) reasons.push({ fact: motion.againstPoints[i], side: 'against', source: '', kind: 'reason' });
    }
    return reasons.slice(0, 4);
  }, [motion]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [idx, setIdx] = useState(0);
  const [sorts, setSorts] = useState<Record<string, string>>({});
  const [strongVotes, setStrongVotes] = useState<Record<string, string>>({});
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const scored = useRef<Set<string>>(new Set());
  const card = cards[idx];
  const cardLabel = (c: Card, i: number) => `${i + 1}. ${c.fact.length > 70 ? `${c.fact.slice(0, 67)}…` : c.fact}`;

  useEffect(() => {
    if (phase === 'card' && card) {
      onSetInputSpec?.({ type: 'binary', gameKey: 'evidence-cards', prompt: `Does this help FOR or AGAINST? "${card.fact}"`, optionLabels: SIDES });
    } else if (phase === 'strongest') {
      onSetInputSpec?.({ type: 'choice', gameKey: 'evidence-cards', prompt: 'Which card is the strongest reason?', options: cards.map(cardLabel) });
    } else onSetInputSpec?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cardLabel is a pure formatter
  }, [phase, card, cards, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current === 'card' && SIDES.indexOf(vote.choice) >= 0) {
        setSorts((prev) => ({ ...prev, [vote.clientId]: vote.choice }));
      } else if (phaseRef.current === 'strongest') {
        setStrongVotes((prev) => ({ ...prev, [vote.clientId]: vote.choice }));
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler]);

  const go = (p: Phase) => { setPhase(p); onPhaseChange?.(p === 'done' ? 'finished' : p); };
  const right = card ? (card.side === 'for' ? 'FOR' : 'AGAINST') : '';
  const sortedRight = Object.keys(sorts).filter((k) => sorts[k] === right).length;
  const sortedN = Object.keys(sorts).length;

  const reveal = () => {
    Object.keys(sorts).forEach((cid) => {
      const key = `${idx}:${cid}`;
      if (sorts[cid] === right && !scored.current.has(key)) {
        scored.current.add(key);
        void onScore?.({ studentId: null, clientId: cid, displayName: '', promptIndex: idx + 1, points: 1, isCorrect: true });
      }
    });
    go('reveal');
  };
  const next = () => {
    setSorts({});
    if (idx + 1 < cards.length) { setIdx((i) => i + 1); go('card'); } else go('strongest');
  };

  const tally = useMemo(() => {
    const t: Record<string, number> = {};
    Object.keys(strongVotes).forEach((k) => { t[strongVotes[k]] = (t[strongVotes[k]] ?? 0) + 1; });
    return t;
  }, [strongVotes]);
  const finish = () => {
    const labels = cards.map(cardLabel);
    const top = labels.map((l, i) => ({ i, n: tally[l] ?? 0 })).sort((a, b) => b.n - a.n)[0];
    if (top && top.n > 0) setStrongest(cards[top.i]);
    go('done');
  };

  if (cards.length === 0) {
    return <p className="py-12 text-center text-slate-300">No evidence for this motion. Skip to the next stage.</p>;
  }

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[380px] flex-col items-center justify-center gap-6 py-6 text-center">
        <FileSearch className="h-16 w-16 text-cyan-300" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Evidence cards</p>
          <h3 className="mt-2 text-3xl font-game text-white">{motion.motion}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">{cards.length} {cards[0].kind === 'fact' ? 'real facts' : 'reasons'}. For each one: does it help the FOR side or the AGAINST side? Vote on your phone, then tell us why.</p>
        </div>
        <button onClick={() => go('card')} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-10 py-4 font-game text-lg text-white shadow-xl transition hover:scale-105">FIRST CARD</button>
      </div>
    );
  }

  if (phase === 'strongest' || phase === 'done') {
    const labels = cards.map(cardLabel);
    return (
      <div className="space-y-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-300/80"><Star className="h-4 w-4" />{phase === 'done' ? 'The strongest card' : 'Which card is the strongest reason?'}</p>
        <div className="grid gap-2">
          {cards.map((c, i) => (
            <div key={c.fact} className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 ${c.side === 'for' ? 'border-sky-400/30 bg-sky-500/[0.06]' : 'border-orange-400/30 bg-orange-500/[0.06]'}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{c.side === 'for' ? 'For' : 'Against'}</p>
                <p className="text-sm text-slate-100">{c.fact}</p>
              </div>
              <span className="shrink-0 text-lg font-game text-amber-200">{tally[labels[i]] ?? 0}</span>
            </div>
          ))}
        </div>
        {phase === 'strongest' && (
          <div className="flex justify-end">
            <button onClick={finish} className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-game text-sm text-white">LOCK IN</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Evidence card {idx + 1} of {cards.length}</p>
        <span className="text-sm text-slate-400">{sortedN} voted</span>
      </div>
      <p className="text-center text-sm text-slate-400">{motion.motion}</p>
      <div className={`rounded-2xl border-2 p-6 text-center ${phase === 'reveal' ? (card.side === 'for' ? 'border-sky-400/50 bg-sky-500/10' : 'border-orange-400/50 bg-orange-500/10') : 'border-white/15 bg-white/[0.04]'}`}>
        <p className="text-2xl font-game text-white">{card.fact}</p>
        {card.source && <p className="mt-3 text-xs text-slate-400">Source: {card.source}</p>}
      </div>
      {phase === 'reveal' && (
        <p className="flex items-center justify-center gap-2 text-lg text-white">
          {card.side === 'for' ? <ThumbsUp className="h-5 w-5 text-sky-300" /> : <ThumbsDown className="h-5 w-5 text-orange-300" />}
          It helps the <span className={`font-game ${card.side === 'for' ? 'text-sky-300' : 'text-orange-300'}`}>{card.side === 'for' ? 'FOR' : 'AGAINST'}</span> side · {sortedRight} of {sortedN} sorted it right
        </p>
      )}
      <div className="flex justify-end">
        {phase === 'card'
          ? <button onClick={reveal} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white">REVEAL</button>
          : <button onClick={next} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white">{idx + 1 < cards.length ? 'NEXT CARD' : 'THE STRONGEST'}<ChevronRight className="h-4 w-4" /></button>}
      </div>
    </div>
  );
}

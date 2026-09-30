'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, ArrowUp, Check, FileSearch, ListOrdered, Lock, Megaphone, RotateCcw, Trophy, Users } from 'lucide-react';
import type { ActivityProps } from '../types';
import { ActivityStatus, type RankItContent, type RankItChallenge } from './types';
import { useSessionStore } from '@/stores/session-store';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';

/**
 * Combine every student's submitted order into one class ranking by mean position
 * (a Borda-style aggregate): the lower an item's average slot across all submissions,
 * the higher it ranks. Items missing from a submission are simply skipped for that
 * submission; ties fall back to the original item order for a stable result.
 */
function aggregateRankings(submissions: string[][], allIds: string[]): string[] {
  const tally = new Map<string, { sum: number; count: number }>();
  allIds.forEach((id) => tally.set(id, { sum: 0, count: 0 }));
  submissions.forEach((sub) => {
    sub.forEach((id, idx) => {
      const t = tally.get(id);
      if (t) {
        t.sum += idx;
        t.count += 1;
      }
    });
  });
  return [...allIds].sort((a, b) => {
    const ta = tally.get(a)!;
    const tb = tally.get(b)!;
    const avgA = ta.count ? ta.sum / ta.count : Infinity;
    const avgB = tb.count ? tb.sum / tb.count : Infinity;
    if (avgA !== avgB) return avgA - avgB;
    return allIds.indexOf(a) - allIds.indexOf(b);
  });
}

type Sub = { name: string; ids: string[] };

// Rank It: "Defend your #1". Phones rank; the class order builds live on a ladder. Two students
// whose #1s differ most defend them (then the floor opens), new evidence arrives one fact at a
// time, the class re-ranks, and the Shift shows what moved and how many changed their #1.
// Fact rankings (with a real answer) end with "how close was the class?"; opinion rankings don't.
export function RankItActivity({ generatedContent, onPhaseChange, onSetInputSpec, onRegisterRemoteVoteHandler, isMicroEvent }: ActivityProps) {
  const content = generatedContent as RankItContent;
  const challenges = content.challenges ?? [];

  const [status, setStatus] = useState<ActivityStatus>(ActivityStatus.IDLE);
  const [idx, setIdx] = useState(0);
  const [subs, setSubs] = useState<Record<string, Sub>>({});
  const [firstRound, setFirstRound] = useState<{ order: string[]; tops: Record<string, string> } | null>(null);
  const [voices, setVoices] = useState<Array<{ name: string; item: string }> | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [shifted, setShifted] = useState(false);
  const addFlightLogEntry = useSessionStore((s) => s.addFlightLogEntry);

  const challenge: RankItChallenge | undefined = challenges[idx];
  const isFact = !!challenge?.correctOrder?.length;
  const allIds = useMemo(() => challenge?.items.map((i) => i.id) ?? [], [challenge]);
  const nameOf = (id: string) => challenge?.items.find((i) => i.id === id)?.name ?? id;
  const factOf = (id: string) => challenge?.items.find((i) => i.id === id)?.hiddenFact ?? '';

  const ranking = useMemo(() => {
    const s = Object.values(subs).map((x) => x.ids);
    return s.length ? aggregateRankings(s, allIds) : firstRound?.order ?? allIds;
  }, [subs, allIds, firstRound]);

  const collecting = status === ActivityStatus.RANKING || status === ActivityStatus.RE_RANKING;
  const go = (s: ActivityStatus, phase: string) => { setStatus(s); onPhaseChange?.(phase); };

  // ─── Phones ───
  useEffect(() => {
    if (collecting && challenge) {
      onSetInputSpec?.({ type: 'ranking', gameKey: 'rank-it', prompt: status === ActivityStatus.RE_RANKING ? `New evidence! Rank again: ${challenge.prompt}` : challenge.prompt, options: challenge.items.map((i) => i.name) });
    } else onSetInputSpec?.(null);
  }, [collecting, status, challenge, onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (!collecting || !challenge) return;
      try {
        const names: string[] = JSON.parse(vote.choice);
        const ids = names.map((n) => challenge.items.find((i) => i.name === n)?.id).filter((x): x is string => !!x);
        if (ids.length) setSubs((prev) => ({ ...prev, [vote.clientId]: { name: vote.displayName, ids } }));
      } catch { /* ignore malformed */ }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [collecting, challenge, onRegisterRemoteVoteHandler]);

  // ─── Flow ───
  const resetRound = () => { setSubs({}); setFirstRound(null); setVoices(null); setRevealed(0); setShifted(false); };
  const start = () => { resetRound(); go(ActivityStatus.RANKING, 'ranking'); };

  const lockFirst = () => {
    const tops: Record<string, string> = {};
    Object.entries(subs).forEach(([cid, s]) => { if (s.ids[0]) tops[cid] = s.ids[0]; });
    setFirstRound({ order: ranking, tops });
    go(ActivityStatus.DISCUSSING, 'discussing');
  };

  /** Two students whose #1 picks sit furthest apart in the class order. */
  const hearTwo = () => {
    const entries = Object.values(subs).filter((s) => s.ids[0]);
    let best: [Sub, Sub] | null = null;
    let gap = -1;
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        if (entries[i].ids[0] === entries[j].ids[0]) continue;
        const d = Math.abs(ranking.indexOf(entries[i].ids[0]) - ranking.indexOf(entries[j].ids[0]));
        if (d > gap) { gap = d; best = [entries[i], entries[j]]; }
      }
    }
    if (best) setVoices(best.map((s) => ({ name: s.name, item: nameOf(s.ids[0]) })));
    else if (entries[0]) setVoices([{ name: entries[0].name, item: nameOf(entries[0].ids[0]) }]);
  };

  const startEvidence = () => { setVoices(null); setRevealed(0); go(ActivityStatus.REVEALING, 'revealing'); };
  const reRank = () => { setSubs({}); go(ActivityStatus.RE_RANKING, 're-ranking'); };
  const lockSecond = () => { setShifted(true); go(ActivityStatus.DISCUSSING, 'shift'); };

  const next = () => {
    if (!isMicroEvent && idx < challenges.length - 1) {
      setIdx((i) => i + 1);
      resetRound();
      go(ActivityStatus.RANKING, 'ranking');
      return;
    }
    const top = challenge ? nameOf(ranking[0]) : '';
    if (top && challenge) {
      addFlightLogEntry({ beat: 'opinion-pulse', text: `Ranked "${top}" #1 in "${challenge.prompt}".`, callback: `You ranked "${top}" first — would you still?` });
    }
    go(ActivityStatus.FINISHED, 'finished');
  };

  if (!challenge) {
    return <div className="py-12 text-center text-white/60">No challenges available. Please regenerate content.</div>;
  }

  // Shift numbers (after the re-rank).
  const changedTop = shifted && firstRound ? Object.entries(subs).filter(([cid, s]) => firstRound.tops[cid] && s.ids[0] && firstRound.tops[cid] !== s.ids[0]).length : 0;
  const comparedTop = shifted && firstRound ? Object.keys(subs).filter((cid) => firstRound.tops[cid]).length : 0;
  const rightPlace = isFact ? ranking.filter((id, i) => challenge.correctOrder![i] === id).length : 0;

  const ladder = (opts: { showFacts?: number; showMoves?: boolean; showAnswer?: boolean }) => (
    <div className="space-y-2">
      {ranking.map((id, i) => {
        const before = firstRound?.order.indexOf(id) ?? i;
        const move = opts.showMoves ? before - i : 0;
        const factIdx = allIds.indexOf(id);
        const factShown = opts.showFacts != null && factIdx < opts.showFacts;
        const correct = opts.showAnswer && challenge.correctOrder?.[i] === id;
        return (
          <motion.div layout key={id} transition={{ type: 'spring', stiffness: 260, damping: 26 }} className={`flex items-start gap-4 rounded-2xl border px-4 py-3 ${i === 0 ? 'border-amber-300/60 bg-amber-300/[0.08]' : 'border-white/10 bg-slate-950/50'}`}>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-2xl ${i === 0 ? 'bg-amber-300 text-slate-950' : 'bg-white/10'}`}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-2xl leading-tight">{nameOf(id)}</p>
              {factShown && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 flex items-start gap-1.5 text-base text-cyan-100"><FileSearch className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />{factOf(id)}</motion.p>}
            </div>
            {move !== 0 && <span className={`flex items-center gap-0.5 self-center font-mono text-lg ${move > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{move > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}{Math.abs(move)}</span>}
            {correct && <Check className="h-6 w-6 self-center text-emerald-300" />}
          </motion.div>
        );
      })}
    </div>
  );

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <KitLabel tone={isFact ? 'cyan' : 'violet'}>{isFact ? 'Fact ranking · there is an answer' : 'Opinion ranking · no right answer'}{!isMicroEvent && challenges.length > 1 ? ` · ${idx + 1} of ${challenges.length}` : ''}</KitLabel>
      {collecting && <KitReadout>{Object.keys(subs).length} ranked</KitReadout>}
    </div>
  );
  const prompt = <p className="text-center font-display text-4xl leading-snug">{challenge.prompt}</p>;

  // ─── IDLE ───
  if (status === ActivityStatus.IDLE) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <ListOrdered className="mx-auto h-10 w-10 text-amber-300" />
        <div>
          <KitLabel tone="amber">Rank It</KitLabel>
          <p className="mt-2 font-display text-5xl">Rank it. Defend it.</p>
        </div>
        <p className="mx-auto max-w-xl text-lg text-white/70">Put the list in order on your phone. The class ladder builds live. Then defend your #1, hear new evidence, and see if anyone changes their mind!</p>
        <div className="flex justify-center"><KitButton tone="amber" solid onClick={start} className="!px-8 !py-3 !text-base" icon={<ListOrdered className="h-4 w-4" />}>Start</KitButton></div>
      </div>
    );
  }

  // ─── FINISHED ───
  if (status === ActivityStatus.FINISHED) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8 text-center text-white">
        <Trophy className="mx-auto h-10 w-10 text-amber-300" />
        <p className="font-display text-5xl">Ranked and defended!</p>
        <KitButton tone="plain" className="mx-auto" onClick={() => { setIdx(0); resetRound(); go(ActivityStatus.IDLE, 'idle'); }} icon={<RotateCcw className="h-3.5 w-3.5" />}>Play again</KitButton>
      </div>
    );
  }

  // ─── RANKING / RE-RANKING ───
  if (collecting) {
    const second = status === ActivityStatus.RE_RANKING;
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        {header}
        {prompt}
        {second && <p className="text-center text-xl text-cyan-100">New evidence is in. Rank again: did anything change?</p>}
        {ladder({ showFacts: second ? allIds.length : undefined, showMoves: second })}
        <div className="flex justify-end">
          <KitButton tone="amber" solid disabled={Object.keys(subs).length === 0} onClick={second ? lockSecond : lockFirst} className="!px-6 !py-2.5" icon={<Lock className="h-4 w-4" />}>{second ? 'Lock it in: show the Shift' : 'Lock it in'}</KitButton>
        </div>
      </div>
    );
  }

  // ─── EVIDENCE (one fact at a time) ───
  if (status === ActivityStatus.REVEALING) {
    const total = allIds.length;
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        {header}
        {prompt}
        <p className="text-center text-xl text-cyan-100"><FileSearch className="mr-1.5 inline h-5 w-5" />New evidence: {revealed} of {total}</p>
        {ladder({ showFacts: revealed })}
        <div className="flex flex-wrap justify-end gap-2">
          {revealed < total
            ? <KitButton tone="cyan" solid onClick={() => setRevealed((n) => n + 1)} className="!px-6 !py-2.5" icon={<FileSearch className="h-4 w-4" />}>Next evidence</KitButton>
            : <KitButton tone="amber" solid onClick={reRank} className="!px-6 !py-2.5" icon={<ListOrdered className="h-4 w-4" />}>Rank again</KitButton>}
          <KitButton tone="plain" onClick={next} icon={<ArrowRight className="h-3.5 w-3.5" />}>Skip</KitButton>
        </div>
      </div>
    );
  }

  // ─── DISCUSSING: "Defend your #1" (first round) or "The Shift" (after the re-rank) ───
  return (
    <div className="mx-auto max-w-4xl space-y-5 text-white">
      {header}
      {prompt}
      {shifted && (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] px-5 py-4 text-center">
          <KitLabel tone="amber">The Shift</KitLabel>
          <p className="mt-1 font-display text-3xl">{comparedTop ? `${changedTop} of ${comparedTop} changed their #1` : 'The class ranked again'}</p>
          {isFact && <p className="mt-1 text-lg text-white/70">{rightPlace} of {allIds.length} in the right place</p>}
        </div>
      )}
      {ladder({ showMoves: shifted, showFacts: shifted ? allIds.length : undefined, showAnswer: shifted && isFact })}
      {shifted && isFact && challenge.correctRationale && <p className="text-center text-lg text-white/70">{challenge.correctRationale}</p>}

      {!shifted && (
        voices ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 sm:grid-cols-2">
            {voices.map((v) => (
              <div key={v.name} className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] p-4 text-center">
                <p className="font-display text-3xl">{v.name}</p>
                <p className="mt-1 text-lg text-amber-100">Why is <span className="text-white">&ldquo;{v.item}&rdquo;</span> your #1?</p>
              </div>
            ))}
            <p className="text-center text-white/60 sm:col-span-2"><Users className="mr-1 inline h-4 w-4" />Then the floor is open: who agrees? Who disagrees?</p>
          </motion.div>
        ) : null
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {!shifted ? <KitButton tone="amber" disabled={Object.keys(subs).length < 1} onClick={hearTwo} icon={<Megaphone className="h-3.5 w-3.5" />}>{voices ? 'Hear two others' : 'Defend your #1'}</KitButton> : <span />}
        <div className="flex gap-2">
          {!shifted && <KitButton tone="cyan" solid onClick={startEvidence} className="!px-5 !py-2" icon={<FileSearch className="h-4 w-4" />}>New evidence</KitButton>}
          <KitButton tone={shifted ? 'amber' : 'plain'} solid={shifted} onClick={next} icon={<ArrowRight className="h-4 w-4" />}>{!isMicroEvent && idx < challenges.length - 1 ? 'Next challenge' : 'Finish'}</KitButton>
        </div>
      </div>
    </div>
  );
}

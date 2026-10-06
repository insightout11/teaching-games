'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { DebateMotion } from '@/lib/debate-motion';

// Debate v2 landing, after the Shift: which argument made you think most? Phones vote from the
// motion's arguments and evidence (both sides); the tally shows on screen, no names.

export function StrongestArgument({ motion, onSetInputSpec, onRegisterRemoteVoteHandler, onPhaseChange }: Pick<ActivityProps, 'onSetInputSpec' | 'onRegisterRemoteVoteHandler' | 'onPhaseChange'> & { motion: DebateMotion }) {
  const options = useMemo(() => {
    const short = (t: string) => (t.length > 80 ? `${t.slice(0, 77)}…` : t);
    const all = [...motion.forPoints, ...motion.againstPoints, ...motion.evidence.map((e) => e.fact)].map(short);
    return all.filter((o, i) => all.indexOf(o) === i).slice(0, 8);
  }, [motion]);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const doneRef = useRef(done); doneRef.current = done;

  useEffect(() => {
    if (done) { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({ type: 'choice', gameKey: 'opinion-shift', prompt: 'Which argument made you think most?', options });
  }, [done, options, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (doneRef.current || options.indexOf(vote.choice) < 0) return;
      setVotes((prev) => ({ ...prev, [vote.clientId]: vote.choice }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [options, onRegisterRemoteVoteHandler]);

  const tally = options.map((o) => ({ o, n: Object.keys(votes).filter((k) => votes[k] === o).length, side: motion.forPoints.some((p) => o.startsWith(p.slice(0, 40))) || motion.evidence.some((e) => e.side === 'for' && o.startsWith(e.fact.slice(0, 40))) ? 'for' : 'against' }))
    .sort((a, b) => b.n - a.n);
  const top = tally[0]?.n ? tally[0] : null;

  return (
    <div className="space-y-5 text-white">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-300/80"><Star className="h-4 w-4" />The strongest argument</p>
      <p className="text-center text-2xl font-game">Which argument made you think most?</p>
      {done && top && (
        <div className={`rounded-2xl border-2 p-5 text-center ${top.side === 'for' ? 'border-sky-400/50 bg-sky-500/10' : 'border-orange-400/50 bg-orange-500/10'}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">{top.side === 'for' ? 'For' : 'Against'} · {top.n} vote{top.n > 1 ? 's' : ''}</p>
          <p className="mt-1 text-xl font-game">{top.o}</p>
        </div>
      )}
      <div className="grid gap-1.5">
        {tally.map((t) => (
          <div key={t.o} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm">
            <span className={t.side === 'for' ? 'text-sky-100' : 'text-orange-100'}>{t.o}</span>
            <span className="shrink-0 font-game text-amber-200">{t.n}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        {done
          ? <button onClick={() => onPhaseChange?.('finished')} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-game text-sm">FINISH</button>
          : <button onClick={() => setDone(true)} className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-game text-sm">REVEAL</button>}
      </div>
    </div>
  );
}

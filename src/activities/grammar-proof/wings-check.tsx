'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Eye, Plane, X } from 'lucide-react';
import type { ActivityProps, GrammarCheckInSentence } from '../types';
import { useSessionStore, type ThreadGrammarCheck } from '@/stores/session-store';
import { HUNT_GOAL } from '@/lib/live-room/hunt';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';

// Wings check: the landing half of the Grammar before/after. Three NEW sentences on the target,
// judged exactly like the Check-in. "Flying it" = at least 2 of 3 judged right. The reveal
// compares with the Check-in: "Before: 4 of 12 flying it -> Now: 10 of 12". Only the students
// who earned wings are named.

const OPTIONS = ['Sounds correct', 'Not sure', 'Sounds wrong'];
const flying = (right: number, total: number) => total > 0 && right >= Math.ceil((total * 2) / 3);

type Props = Pick<ActivityProps, 'onSetInputSpec' | 'onRegisterRemoteVoteHandler' | 'onScore' | 'onPhaseChange'> & {
  sentences: GrammarCheckInSentence[];
  target: string;
  before?: ThreadGrammarCheck;
  onDone: () => void;
};

export function WingsCheck({ sentences, target, before, onDone, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange }: Props) {
  const [idx, setIdx] = useState(0);
  const hunt = useSessionStore((st) => st.lessonThread.hunt);
  const [revealed, setRevealed] = useState(false);
  // votes[sentence][clientId] = choice
  const [votes, setVotes] = useState<Record<number, Record<string, { name: string; studentId: string | null; choice: string }>>>({});

  useEffect(() => {
    if (revealed || !sentences[idx]) { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({ type: 'choice', gameKey: 'grammar-proof', prompt: `“${sentences[idx].text}”`, options: OPTIONS });
  }, [idx, revealed, sentences, onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (revealed || !OPTIONS.includes(vote.choice)) return;
      setVotes((prev) => (prev[idx]?.[vote.clientId] ? prev : { ...prev, [idx]: { ...prev[idx], [vote.clientId]: { name: vote.displayName, studentId: vote.studentId ?? null, choice: vote.choice } } }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [idx, revealed, onRegisterRemoteVoteHandler]);

  const results = useMemo(() => {
    const out: Record<string, { name: string; studentId: string | null; right: number }> = {};
    sentences.forEach((s, i) => {
      Object.entries(votes[i] ?? {}).forEach(([cid, v]) => {
        const ok = (s.isCorrect && v.choice === 'Sounds correct') || (!s.isCorrect && v.choice === 'Sounds wrong');
        const cur = out[cid] ?? { name: v.name, studentId: v.studentId, right: 0 };
        out[cid] = { ...cur, right: cur.right + (ok ? 1 : 0) };
      });
    });
    return out;
  }, [votes, sentences]);

  const answeredNow = Object.keys(votes[idx] ?? {}).length;
  const nowList = Object.values(results);
  const nowFlying = nowList.filter((r) => flying(r.right, sentences.length));
  const beforeList = before ? Object.values(before.results) : [];
  const beforeFlying = before ? beforeList.filter((r) => flying(r.right, before.total)).length : 0;

  const next = () => {
    if (idx + 1 < sentences.length) setIdx((i) => i + 1);
    else {
      Object.entries(results).forEach(([cid, r]) => {
        const ok = flying(r.right, sentences.length);
        void onScore?.({ studentId: r.studentId, clientId: cid, displayName: r.name, promptIndex: 1, points: ok ? 3 : 1, isCorrect: ok });
      });
      setRevealed(true);
      onPhaseChange?.('wings-reveal');
    }
  };

  if (!revealed) {
    const s = sentences[idx];
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-2 text-center text-white">
        <div className="flex items-center justify-between">
          <KitLabel tone="emerald">Wings check · {target} · {idx + 1} of {sentences.length}</KitLabel>
          <KitReadout>{answeredNow} answered</KitReadout>
        </div>
        <p className="text-lg text-white/65">Correct or not? Judge it on your phone.</p>
        <motion.p key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-slate-950/60 px-8 py-10 font-display text-4xl leading-snug">&ldquo;{s?.text}&rdquo;</motion.p>
        <div className="flex justify-end">
          <KitButton tone="emerald" solid disabled={answeredNow === 0} onClick={next} className="!px-6 !py-2.5" icon={idx + 1 < sentences.length ? <ArrowRight className="h-4 w-4" /> : <Eye className="h-4 w-4" />}>{idx + 1 < sentences.length ? 'Next sentence' : 'Show the wings'}</KitButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 text-white">
      <div className="text-center">
        <Plane className="mx-auto h-10 w-10 rotate-45 text-emerald-300" />
        <KitLabel tone="emerald">Wings earned · {target}</KitLabel>
        <div className="mt-3 flex items-center justify-center gap-6">
          {before && (
            <>
              <div><p className="font-mono text-xs uppercase tracking-[0.15em] text-white/45">check-in</p><p className="font-display text-5xl text-white/55">{beforeFlying}<span className="text-2xl"> of {beforeList.length}</span></p></div>
              <ArrowRight className="h-8 w-8 text-emerald-300" />
            </>
          )}
          <div><p className="font-mono text-xs uppercase tracking-[0.15em] text-emerald-200">now</p><motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="font-display text-7xl text-emerald-200">{nowFlying.length}<span className="text-3xl"> of {nowList.length}</span></motion.p></div>
        </div>
        <p className="mt-2 text-xl text-white/70">{nowList.length ? 'students are flying it' : 'No answers yet'}</p>
        {hunt && Object.keys(hunt).length > 0 && (
          <p className="mt-2 text-lg text-violet-200">Grammar Hunt: {Object.values(hunt).reduce((n, h) => n + h.count, 0)} stamps · {Object.values(hunt).filter((h) => h.count >= HUNT_GOAL).length} completed the secret mission</p>
        )}
      </div>

      {nowFlying.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {nowFlying.map((r, i) => (
            <motion.span key={r.name + i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.08 }} className="flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-lg text-emerald-50">
              <Plane className="h-4 w-4 rotate-45 text-emerald-300" />{r.name}
            </motion.span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {sentences.map((s, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
            {s.isCorrect ? <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-300" /> : <X className="mt-1 h-5 w-5 shrink-0 text-rose-300" />}
            <div>
              <p className="text-lg">&ldquo;{s.text}&rdquo;</p>
              <p className="text-white/60">{s.explanation}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <KitButton tone="emerald" solid onClick={onDone} className="!px-6 !py-2.5" icon={<ArrowRight className="h-4 w-4" />}>Now prove it: write it</KitButton>
      </div>
    </div>
  );
}

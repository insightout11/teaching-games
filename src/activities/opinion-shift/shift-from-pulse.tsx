'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Anchor, ArrowRight, Eye, MessageCircleQuestion, Repeat, Scale } from 'lucide-react';
import type { ActivityProps } from '../types';
import type { ThreadPulse } from '@/stores/session-store';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';

// Opinion Shift, spoken-first: the lesson opened with a Quick Pulse question, so the landing asks
// the SAME question again. The reveal is the Shift: before vs now, how many changed their mind,
// then a student who changed and one who held firm explain why, out loud.

type Phase = 'idle' | 'asking' | 'shift';

const LIKERT = ['1', '2', '3', '4', '5'];
const LIKERT_LABELS = ['Strongly disagree', 'Disagree', 'Not sure', 'Agree', 'Strongly agree'];

export function ShiftFromPulse({ baseline, onPhaseChange, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onLandingAnswer }: Pick<ActivityProps, 'onPhaseChange' | 'onSetInputSpec' | 'onRegisterRemoteVoteHandler' | 'onScore' | 'onLandingAnswer'> & { baseline: ThreadPulse }) {
  const likert = baseline.type === 'likert';
  const options = useMemo(() => (likert ? LIKERT : ['Yes', 'No']), [likert]);
  const label = (o: string) => (likert ? LIKERT_LABELS[Number(o) - 1] ?? o : o);

  const [phase, setPhase] = useState<Phase>('idle');
  const [now, setNow] = useState<Record<string, { name: string; studentId: string | null; choice: string }>>({});
  const [voices, setVoices] = useState<Array<{ name: string; before: string; now: string; changed: boolean }> | null>(null);

  const go = (p: Phase) => { setPhase(p); onPhaseChange?.(p === 'shift' ? 'revealing' : p); };

  useEffect(() => {
    if (phase !== 'asking') { onSetInputSpec?.(null); return; }
    onSetInputSpec?.(likert
      ? { type: 'choice', gameKey: 'opinion-shift', prompt: `Where do you stand NOW? ${baseline.text}`, options: LIKERT, optionLabels: ['1 – Strongly Disagree', '2', '3', '4', '5 – Strongly Agree'] }
      : { type: 'binary', gameKey: 'opinion-shift', prompt: `And now? ${baseline.text}`, optionLabels: ['Yes', 'No'] });
  }, [phase, likert, baseline.text, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phase !== 'asking') return;
      const choice = String(vote.choice);
      if (!options.includes(choice)) return;
      setNow((prev) => ({ ...prev, [vote.clientId]: { name: vote.displayName, studentId: vote.studentId ?? null, choice } }));
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [phase, options, onRegisterRemoteVoteHandler]);

  const both = useMemo(() => Object.entries(now).filter(([cid]) => baseline.votes[cid]), [now, baseline.votes]);
  const changers = both.filter(([cid, v]) => baseline.votes[cid].choice !== v.choice);
  const holders = both.filter(([cid, v]) => baseline.votes[cid].choice === v.choice);
  const count = (votes: Array<{ choice: string }>, o: string) => votes.filter((v) => v.choice === o).length;
  const beforeVotes = Object.values(baseline.votes);
  const nowVotes = Object.values(now);

  const reveal = () => {
    Object.entries(now).forEach(([cid, v]) => {
      const before = baseline.votes[cid]?.choice;
      onLandingAnswer?.(cid, before ? `${label(before)} → ${label(v.choice)}` : label(v.choice));
      void onScore?.({ studentId: v.studentId, clientId: cid, displayName: v.name, promptIndex: 1, points: 1, isCorrect: null });
    });
    go('shift');
  };

  const hearWhy = () => {
    const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
    const out: Array<{ name: string; before: string; now: string; changed: boolean }> = [];
    const c = changers.length ? pick(changers) : null;
    const h = holders.length ? pick(holders) : null;
    if (c) out.push({ name: c[1].name, before: label(baseline.votes[c[0]].choice), now: label(c[1].choice), changed: true });
    if (h) out.push({ name: h[1].name, before: label(baseline.votes[h[0]].choice), now: label(h[1].choice), changed: false });
    setVoices(out);
  };

  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <Scale className="mx-auto h-10 w-10 text-amber-300" />
        <div>
          <KitLabel tone="amber">Opinion Shift</KitLabel>
          <p className="mt-2 font-display text-5xl">Did anything change?</p>
        </div>
        <p className="mx-auto max-w-xl text-lg text-white/70">At the start of the lesson you answered this question. Answer it again now. It&apos;s fine if your view didn&apos;t change!</p>
        <p className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-slate-950/50 px-6 py-4 font-display text-3xl">{baseline.text}</p>
        <div className="flex justify-center"><KitButton tone="amber" solid onClick={() => go('asking')} className="!px-8 !py-3 !text-base" icon={<Repeat className="h-4 w-4" />}>Ask again</KitButton></div>
      </div>
    );
  }

  if (phase === 'asking') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <div className="flex items-center justify-between">
          <KitLabel tone="amber">Opinion Shift · where do you stand now?</KitLabel>
          <KitReadout>{nowVotes.length} answered</KitReadout>
        </div>
        <p className="font-display text-4xl leading-snug">{baseline.text}</p>
        <div className="flex justify-center"><KitButton tone="emerald" solid disabled={nowVotes.length === 0} onClick={reveal} className="!px-6 !py-2.5" icon={<Eye className="h-4 w-4" />}>Show the Shift</KitButton></div>
      </div>
    );
  }

  // ─── THE SHIFT ───
  const max = Math.max(1, ...options.map((o) => Math.max(count(beforeVotes, o), count(nowVotes, o))));
  return (
    <div className="mx-auto max-w-4xl space-y-5 text-white">
      <div className="text-center">
        <KitLabel tone="amber">The Shift</KitLabel>
        <p className="mt-1 font-display text-5xl">{both.length ? `${changers.length} of ${both.length} changed their mind` : 'Here is where the class stands'}</p>
        <p className="mt-2 text-xl text-white/65">{baseline.text}</p>
      </div>
      <div className="space-y-2.5">
        {options.map((o, i) => (
          <div key={o} className="grid grid-cols-[11rem_1fr] items-center gap-3">
            <span className="text-right text-lg text-white/80">{label(o)}</span>
            <div className="space-y-1">
              <div className="flex items-center gap-2"><div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-white/25" style={{ width: `${(count(beforeVotes, o) / max) * 100}%` }} /></div><span className="w-6 text-sm text-white/45">{count(beforeVotes, o)}</span></div>
              <div className="flex items-center gap-2"><div className="h-4 flex-1 overflow-hidden rounded-full bg-white/5"><motion.div className="h-full rounded-full bg-amber-300" initial={{ width: `${(count(beforeVotes, o) / max) * 100}%` }} animate={{ width: `${(count(nowVotes, o) / max) * 100}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }} /></div><span className="w-6 text-sm text-amber-100">{count(nowVotes, o)}</span></div>
            </div>
          </div>
        ))}
        <p className="text-center font-mono text-xs uppercase tracking-[0.15em] text-white/45"><span className="mr-1 inline-block h-2 w-4 rounded-full bg-white/25 align-middle" />start of lesson · <span className="mx-1 inline-block h-2 w-4 rounded-full bg-amber-300 align-middle" />now</p>
      </div>

      {voices && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 sm:grid-cols-2">
          {voices.map((v) => (
            <div key={v.name} className={`rounded-2xl border p-4 text-center ${v.changed ? 'border-amber-300/40 bg-amber-300/[0.07]' : 'border-cyan-300/40 bg-cyan-400/[0.07]'}`}>
              <p className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-white/55">{v.changed ? <><ArrowRight className="h-3.5 w-3.5" />changed their mind</> : <><Anchor className="h-3.5 w-3.5" />held firm</>}</p>
              <p className="mt-1 font-display text-3xl">{v.name}</p>
              <p className="mt-1 text-lg text-white/75">{v.changed ? `${v.before} → ${v.now}. What changed your mind?` : `Still "${v.now}". What kept you there?`}</p>
            </div>
          ))}
        </motion.div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <KitButton tone="amber" disabled={both.length === 0} onClick={hearWhy} icon={<MessageCircleQuestion className="h-3.5 w-3.5" />}>{voices ? 'Hear two others' : 'Hear why'}</KitButton>
        <KitButton tone="plain" onClick={() => onPhaseChange?.('finished')} icon={<ArrowRight className="h-3.5 w-3.5" />}>Done</KitButton>
      </div>
    </div>
  );
}

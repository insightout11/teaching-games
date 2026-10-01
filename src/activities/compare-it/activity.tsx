'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, Scale, Sparkles, Trophy } from 'lucide-react';
import type { ActivityProps, CompareItContent } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { useSessionStore } from '@/stores/session-store';
import { SpeakerBar, speakingFramePerStudent, useSpeakingTurns } from '../shared/speaking-turns';

// Compare It (comparisons family): two things on screen -> a student says a comparison out
// loud ("Tokyo is bigger than Paris"); the last rounds show three -> a superlative ("the
// biggest"). Two sentences per round by default, fewest-turns-first, teacher-judged.

type Phase = 'idle' | 'round' | 'done';
const PER_ROUND = 2;

export function CompareItActivity({ students, generatedContent, onSetInputSpec, onScore, onPhaseChange, isMicroEvent }: ActivityProps) {
  const content = generatedContent as CompareItContent;
  const all = content.rounds ?? [];
  const rounds = isMicroEvent ? all.slice(0, 2) : all;
  const recordStruggle = useSessionStore((s) => s.recordStruggle);
  const turns = useSpeakingTurns(students);

  const [phase, setPhase] = useState<Phase>('idle');
  const [idx, setIdx] = useState(0);
  const [said, setSaid] = useState(0);
  const [models, setModels] = useState(0);
  const [total, setTotal] = useState(0);

  const round = rounds[idx];
  const superlative = (round?.items.length ?? 0) >= 3;

  useEffect(() => {
    if (phase !== 'round' || !round) { onSetInputSpec?.(null); return; }
    const forms = (content.bank ?? []).map((b) => (superlative ? `${b.adj} → ${b.superlative}` : `${b.adj} → ${b.comparative}`));
    const per = speakingFramePerStudent(students, turns.speakerId, {
      title: superlative ? 'Compare all three' : 'Compare the two',
      prompt: round.items.map((i) => i.name).join(superlative ? ', ' : ' vs '),
      helpers: [
        { label: 'Try', items: round.adjectives },
        { label: superlative ? 'The …est / the most …' : '…er than / more … than', items: forms },
      ],
    });
    onSetInputSpec?.({ type: 'confirm', gameKey: 'compare-it', prompt: 'Compare It', perStudentData: per, stableInput: true });
  }, [phase, round, superlative, students, turns.speakerId, content.bank, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const open = (i: number) => { setIdx(i); setSaid(0); setModels(0); setPhase('round'); onPhaseChange?.('round'); turns.start(); };
  const good = () => {
    if (turns.speaker) void onScore?.({ studentId: turns.speaker.id, clientId: null, displayName: turns.speaker.name, promptIndex: idx + 1, points: 2, isCorrect: true });
    setSaid((n) => n + 1);
    setTotal((n) => n + 1);
    turns.advance();
  };
  const showModel = () => {
    if (!round) return;
    if (models === 0) recordStruggle({ stage: 'compare-it', text: round.items.map((i) => i.name).join(' / '), fix: round.models[0] });
    setModels((m) => Math.min(round.models.length, m + 1));
  };
  const next = () => (idx + 1 < rounds.length ? open(idx + 1) : (setPhase('done'), onPhaseChange?.('done')));

  if (rounds.length === 0) {
    return <div className="py-10 text-center text-white/60">No rounds came through. Try launching it again.</div>;
  }

  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <Scale className="mx-auto h-10 w-10 text-amber-300" />
        <div>
          <KitLabel tone="amber">Compare It · comparatives &amp; superlatives</KitLabel>
          <p className="mt-2 font-display text-5xl">Which one is bigger? Faster? The best?</p>
        </div>
        <p className="mx-auto max-w-xl text-lg text-white/70">Two things appear. When it&apos;s your turn, compare them in one sentence. In the last rounds there are three: who&apos;s the <span className="text-white">-est</span>? Your phone has the words.</p>
        <div className="flex justify-center"><KitButton tone="amber" solid onClick={() => open(0)} className="!px-8 !py-3 !text-base" icon={<Scale className="h-4 w-4" />}>Start</KitButton></div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8 text-center text-white">
        <Trophy className="mx-auto h-10 w-10 text-amber-300" />
        <p className="font-display text-5xl">{total} comparisons!</p>
        <p className="text-xl text-white/65">Bigger, faster, the best: the class compared it all.</p>
      </div>
    );
  }

  if (!round) return null;
  const done = said >= PER_ROUND;
  return (
    <div className="mx-auto max-w-5xl space-y-5 text-white">
      <div className="flex items-center justify-between">
        <KitLabel tone="amber">Compare It · round {idx + 1} of {rounds.length}{superlative ? ' · superlatives' : ''}</KitLabel>
        <KitReadout>{said} / {PER_ROUND} sentences</KitReadout>
      </div>

      <div className={`grid gap-3 ${superlative ? 'sm:grid-cols-3' : 'sm:grid-cols-[1fr_auto_1fr]'} items-stretch`}>
        {round.items.map((it, i) => (
          <div key={it.name} className="contents">
            {!superlative && i === 1 && <div className="flex items-center justify-center font-display text-4xl text-white/40">vs</div>}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} className="rounded-3xl border border-white/10 bg-slate-950/60 px-6 py-8 text-center">
              <p className="font-display text-4xl">{it.name}</p>
              {it.fact && <p className="mt-2 text-lg text-white/65">{it.fact}</p>}
            </motion.div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">{round.adjectives.map((a) => <span key={a} className="rounded-full border border-white/15 px-3 py-1 text-lg">{a}</span>)}</div>
      {models > 0 && <div className="space-y-1 rounded-2xl border border-emerald-300/30 bg-emerald-400/[0.07] px-4 py-3 text-center">{round.models.slice(0, models).map((m) => <p key={m} className="text-xl text-emerald-50">&ldquo;{m}&rdquo;</p>)}</div>}

      {!done && turns.speaker && <SpeakerBar name={turns.speaker.name} retry={turns.retry} prompt={superlative ? 'which one is the most…?' : 'compare them!'} onGood={good} onRetry={() => turns.setRetry(true)} onSkip={turns.advance} />}
      {done && <p className="text-center text-2xl text-emerald-200"><Sparkles className="mr-1 inline h-5 w-5" />Nice comparisons!</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <KitButton tone="plain" disabled={models >= round.models.length} onClick={showModel} icon={<Eye className="h-3.5 w-3.5" />}>Show a model</KitButton>
        <KitButton tone="amber" solid={done} onClick={next} className="!px-5 !py-2 !text-sm" icon={<ArrowRight className="h-4 w-4" />}>{idx + 1 < rounds.length ? 'Next round' : 'Finish'}</KitButton>
      </div>
    </div>
  );
}

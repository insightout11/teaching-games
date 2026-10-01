'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, MessageCircleQuestion, Sparkles, Trophy } from 'lucide-react';
import type { ActivityProps, AnswerFirstContent } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { useSessionStore } from '@/stores/session-store';
import { SpeakerBar, speakingFramePerStudent, useSpeakingTurns } from '../shared/speaking-turns';

// Answer First (questions family): the screen shows an ANSWER ("At 7 o'clock."); a student asks
// a question that fits, out loud. Any sensible question counts: the teacher judges.

type Phase = 'idle' | 'round' | 'done';

const HELPERS = [
  { label: 'Question words', items: ['What', 'Where', 'When', 'Who', 'Why', 'How', 'How much', 'How long'] },
  { label: 'Build it', items: ['Wh- + do/does/did + you + verb?', 'Wh- + is/are/was + …?', 'Do/Did/Can/Have + you + …?'] },
];

export function AnswerFirstActivity({ students, generatedContent, onSetInputSpec, onScore, onPhaseChange, isMicroEvent }: ActivityProps) {
  const content = generatedContent as AnswerFirstContent;
  const all = content.rounds ?? [];
  const rounds = isMicroEvent ? all.slice(0, 3) : all;
  const recordStruggle = useSessionStore((s) => s.recordStruggle);
  const turns = useSpeakingTurns(students);

  const [phase, setPhase] = useState<Phase>('idle');
  const [idx, setIdx] = useState(0);
  const [model, setModel] = useState(false);
  const [asked, setAsked] = useState(0);

  const round = rounds[idx];

  useEffect(() => {
    if (phase !== 'round' || !round) { onSetInputSpec?.(null); return; }
    const per = speakingFramePerStudent(students, turns.speakerId, {
      title: `The answer is…`,
      prompt: `“${round.answer}”  What's the question? (${round.questionWord})`,
      helpers: HELPERS,
    });
    onSetInputSpec?.({ type: 'confirm', gameKey: 'answer-first', prompt: 'Answer First', perStudentData: per, stableInput: true });
  }, [phase, round, students, turns.speakerId, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const open = (i: number) => { setIdx(i); setModel(false); setPhase('round'); onPhaseChange?.('round'); turns.start(); };
  const next = () => (idx + 1 < rounds.length ? open(idx + 1) : (setPhase('done'), onPhaseChange?.('done')));
  const good = () => {
    if (turns.speaker) void onScore?.({ studentId: turns.speaker.id, clientId: null, displayName: turns.speaker.name, promptIndex: idx + 1, points: 2, isCorrect: true });
    setAsked((n) => n + 1);
    turns.advance();
    next();
  };
  const showModel = () => {
    if (!round) return;
    if (!model) recordStruggle({ stage: 'answer-first', text: round.answer, fix: round.model });
    setModel(true);
  };

  if (rounds.length === 0) return <div className="py-10 text-center text-white/60">No rounds came through. Try launching it again.</div>;

  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-4 text-center text-white">
        <MessageCircleQuestion className="mx-auto h-10 w-10 text-amber-300" />
        <div>
          <KitLabel tone="amber">Answer First · question forms</KitLabel>
          <p className="mt-2 font-display text-5xl">We have the answers. What are the questions?</p>
        </div>
        <p className="mx-auto max-w-xl text-lg text-white/70">An answer appears. When it&apos;s your turn, ask a question that fits it. There can be more than one good question!</p>
        <div className="flex justify-center"><KitButton tone="amber" solid onClick={() => open(0)} className="!px-8 !py-3 !text-base" icon={<MessageCircleQuestion className="h-4 w-4" />}>Start</KitButton></div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8 text-center text-white">
        <Trophy className="mx-auto h-10 w-10 text-amber-300" />
        <p className="font-display text-5xl">{asked} great question{asked === 1 ? '' : 's'}!</p>
      </div>
    );
  }

  if (!round) return null;
  return (
    <div className="mx-auto max-w-5xl space-y-5 text-white">
      <div className="flex items-center justify-between">
        <KitLabel tone="amber">Answer First · {idx + 1} of {rounds.length}</KitLabel>
        <KitReadout>{asked} asked</KitReadout>
      </div>
      <motion.div key={idx} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-white/10 bg-slate-950/60 px-8 py-12 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/45">The answer is</p>
        <p className="mt-3 font-display text-5xl leading-snug">&ldquo;{round.answer}&rdquo;</p>
        <p className="mt-5 inline-block rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1 font-mono text-sm uppercase tracking-[0.15em] text-amber-200">{round.questionWord === 'Yes/No' ? 'Yes / No question' : `${round.questionWord} …?`}</p>
      </motion.div>
      {model && <p className="text-center text-2xl text-emerald-100">&ldquo;{round.model}&rdquo;</p>}
      {turns.speaker && <SpeakerBar name={turns.speaker.name} retry={turns.retry} prompt="what's the question?" onGood={good} onRetry={() => turns.setRetry(true)} onSkip={turns.advance} />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <KitButton tone="plain" disabled={model} onClick={showModel} icon={<Eye className="h-3.5 w-3.5" />}>Show a model</KitButton>
        <KitButton tone="plain" onClick={next} icon={idx + 1 < rounds.length ? <ArrowRight className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}>{idx + 1 < rounds.length ? 'Next answer' : 'Finish'}</KitButton>
      </div>
    </div>
  );
}

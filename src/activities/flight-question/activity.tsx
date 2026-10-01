'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Lock, Pencil, Plane, Telescope } from 'lucide-react';
import type { ActivityProps, FlightQuestionContent } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { useSessionStore } from '@/stores/session-store';

// Captain's Flight takeoff: the Flight Question. One big question the whole lesson investigates.
// Phones: two taps, where do you stand (agree ↔ disagree) and what will the source say (A/B).
// Nothing is revealed now: the prediction pays off after the briefing, the stance at the Verdict.

type Phase = 'idle' | 'stance' | 'predict' | 'locked';
type Vote = { name: string; choice: string };

const LIKERT = ['1', '2', '3', '4', '5'];
const LIKERT_LABELS = ['1 – Strongly Disagree', '2', '3', '4', '5 – Strongly Agree'];

export function FlightQuestionActivity({ generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange }: ActivityProps) {
  const content = generatedContent as FlightQuestionContent;
  const recordPulse = useSessionStore((s) => s.recordPulse);
  const setPredictionResults = useSessionStore((s) => s.setPredictionResults);
  const setFlightQuestion = useSessionStore((s) => s.setFlightQuestion);

  const [question, setQuestion] = useState(content.question);
  const [editing, setEditing] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [stances, setStances] = useState<Record<string, Vote>>({});
  const [predictions, setPredictions] = useState<Record<string, Vote>>({});
  const prediction = content.prediction;

  const go = (p: Phase) => { setPhase(p); onPhaseChange?.(p === 'locked' ? 'finished-boarding' : p); };

  useEffect(() => {
    if (phase === 'stance') onSetInputSpec?.({ type: 'choice', gameKey: 'flight-question', prompt: `${question} Where do you stand?`, options: LIKERT, optionLabels: LIKERT_LABELS });
    else if (phase === 'predict' && prediction) onSetInputSpec?.({ type: 'choice', gameKey: 'flight-question', prompt: prediction.text, options: [prediction.optionA, prediction.optionB] });
    else onSetInputSpec?.(null);
  }, [phase, question, prediction, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      const choice = String(vote.choice);
      if (phase === 'stance' && LIKERT.includes(choice)) {
        setStances((prev) => {
          if (!prev[vote.clientId]) void onScore?.({ studentId: vote.studentId ?? null, clientId: vote.clientId, displayName: vote.displayName, promptIndex: 1, points: 1, isCorrect: null });
          return { ...prev, [vote.clientId]: { name: vote.displayName, choice } };
        });
      } else if (phase === 'predict' && prediction && (choice === prediction.optionA || choice === prediction.optionB)) {
        setPredictions((prev) => ({ ...prev, [vote.clientId]: { name: vote.displayName, choice } }));
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [phase, prediction, onRegisterRemoteVoteHandler, onScore]);

  const board = () => {
    setEditing(false);
    setFlightQuestion({ question: question.trim() || content.question, type: content.questionType });
    go('stance');
  };
  const lockStance = () => {
    recordPulse({ text: question, type: 'likert', votes: stances });
    if (prediction) go('predict'); else go('locked');
  };
  const lockPrediction = () => {
    if (prediction) {
      const votes = Object.values(predictions);
      setPredictionResults([{ ...prediction, countA: votes.filter((v) => v.choice === prediction.optionA).length, countB: votes.filter((v) => v.choice === prediction.optionB).length }]);
    }
    go('locked');
  };

  const questionCard = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-amber-300/40 bg-gradient-to-b from-amber-300/[0.09] to-transparent px-8 py-10 text-center">
      <p className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-amber-300/80"><Compass className="h-4 w-4" />Today&apos;s flight question</p>
      {editing
        ? <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} className="mt-3 w-full resize-none rounded-xl border border-white/20 bg-slate-950/60 p-3 text-center font-display text-4xl text-white outline-none" />
        : <p className="mt-3 font-display text-5xl leading-tight md:text-6xl">{question}</p>}
    </motion.div>
  );

  if (phase === 'idle') {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-4 text-white">
        {questionCard}
        <p className="text-center text-lg text-white/70">This is the question our whole flight will investigate. You&apos;ll answer it now, and again when we land.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <KitButton tone="plain" onClick={() => setEditing((v) => !v)} icon={<Pencil className="h-3.5 w-3.5" />}>{editing ? 'Done editing' : 'Edit the question'}</KitButton>
          <KitButton tone="amber" solid onClick={board} className="!px-8 !py-3 !text-base" icon={<Plane className="h-4 w-4" />}>Board the question</KitButton>
        </div>
      </div>
    );
  }

  if (phase === 'stance') {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-2 text-white">
        <div className="flex items-center justify-between"><KitLabel tone="amber">Boarding · where do you stand?</KitLabel><KitReadout>{Object.keys(stances).length} answered</KitReadout></div>
        {questionCard}
        <p className="text-center text-xl text-white/70">Agree or disagree? Tap on your phone. There are no wrong answers, and you can change your mind later!</p>
        <div className="flex justify-end"><KitButton tone="amber" solid disabled={Object.keys(stances).length === 0} onClick={lockStance} icon={<ArrowRight className="h-4 w-4" />}>{prediction ? 'Next: make a prediction' : 'Lock it in'}</KitButton></div>
      </div>
    );
  }

  if (phase === 'predict' && prediction) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-2 text-white">
        <div className="flex items-center justify-between"><KitLabel tone="cyan">Boarding · make a prediction</KitLabel><KitReadout>{Object.keys(predictions).length} predicted</KitReadout></div>
        <div className="rounded-3xl border border-cyan-300/30 bg-cyan-400/[0.06] px-8 py-8 text-center">
          <Telescope className="mx-auto h-8 w-8 text-cyan-300" />
          <p className="mt-3 font-display text-4xl">{prediction.text}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[prediction.optionA, prediction.optionB].map((o, i) => <div key={o} className="rounded-2xl border border-white/15 bg-slate-950/50 px-5 py-4 text-xl"><span className="mr-2 font-mono text-cyan-300">{i === 0 ? 'A' : 'B'}</span>{o}</div>)}
          </div>
        </div>
        <p className="text-center text-lg text-white/65">We&apos;ll find out during the flight.</p>
        <div className="flex justify-end"><KitButton tone="cyan" solid disabled={Object.keys(predictions).length === 0} onClick={lockPrediction} icon={<Lock className="h-4 w-4" />}>Lock it in</KitButton></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4 text-center text-white">
      {questionCard}
      <p className="flex items-center justify-center gap-2 text-2xl text-emerald-200"><Lock className="h-5 w-5" />Answers locked in. We&apos;ll come back to this when we land.</p>
    </div>
  );
}

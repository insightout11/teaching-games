'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookMarked, Check, Compass, MessageSquareQuote, Telescope, X } from 'lucide-react';
import type { ActivityProps, FlightVerdictContent } from '../types';
import { KitButton, KitLabel, KitReadout } from '@/components/session/widget-kit';
import { useSessionStore } from '@/stores/session-store';
import { ShiftFromPulse, type ShiftSummary } from '../opinion-shift/shift-from-pulse';
import { SpeakerBar, speakingFramePerStudent, useSpeakingTurns } from '../shared/speaking-turns';

// Captain's Flight landing: the Verdict. The Flight Question returns:
//  1. the Shift (re-ask the stance; start vs now; who changed and why)
//  2. prediction vs reality (what the class expected the source to say, and what it said)
//  3. Final Words (one spoken sentence each, starters on phones, fewest-turns-first)
//  4. the logbook card (question, shift, top phrases, hunt stamps)

type Step = 'shift' | 'reality' | 'words' | 'card';

export function FlightVerdictActivity(props: ActivityProps) {
  const { students, generatedContent, onSetInputSpec, onScore, onPhaseChange } = props;
  const content = generatedContent as FlightVerdictContent;
  const thread = useSessionStore((s) => s.lessonThread);
  const predictions = useSessionStore((s) => s.predictionResults);
  const lessonKit = useSessionStore((s) => s.lessonKit);
  const addFlightLogEntry = useSessionStore((s) => s.addFlightLogEntry);
  const turns = useSpeakingTurns(students);

  const question = thread.flightQuestion?.question;
  const baseline = useMemo(
    () => (question ? thread.pulse.find((p) => p.text === question) : undefined) ?? thread.pulse.find((p) => p.type === 'likert' && Object.keys(p.votes).length > 0),
    [question, thread.pulse],
  );
  const prediction = predictions[0];

  const [step, setStep] = useState<Step>(baseline ? 'shift' : prediction ? 'reality' : 'words');
  const [shift, setShift] = useState<ShiftSummary | null>(null);
  const [spoken, setSpoken] = useState(0);

  const go = (s: Step) => { setStep(s); onPhaseChange?.(`verdict-${s}`); };
  const afterShift = (summary: ShiftSummary) => { setShift(summary); go(prediction ? 'reality' : 'words'); };

  // Final Words: phones show the starters; the speaker's phone says "your turn".
  useEffect(() => {
    if (step !== 'words') { if (step !== 'shift') onSetInputSpec?.(null); return; }
    onSetInputSpec?.({ type: 'confirm', gameKey: 'flight-verdict', prompt: 'Final Word', perStudentData: speakingFramePerStudent(students, turns.speakerId, { title: 'Your Final Word', prompt: question ?? 'One sentence about today’s flight', helpers: [{ label: 'Start with', items: content.starters }] }), stableInput: true });
  }, [step, students, turns.speakerId, question, content.starters, onSetInputSpec]);
  useEffect(() => { if (step === 'words') turns.start(); }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishCard = () => {
    const shiftLine = shift && shift.total ? `${Math.round((shift.agreeBefore / Math.max(1, Object.keys(baseline?.votes ?? {}).length)) * 100)}% → ${Math.round((shift.agreeNow / shift.total) * 100)}% agreed` : '';
    addFlightLogEntry({ beat: 'verdict', text: `Flight question "${question ?? ''}"${shiftLine ? `: ${shiftLine}` : ''}${shift?.changed ? `, ${shift.changed} changed their mind` : ''}.`, callback: question ? `Would you still answer "${question}" the same way?` : '' });
    onPhaseChange?.('finished');
  };

  // ─── 1. THE SHIFT ───
  if (step === 'shift' && baseline) {
    return <ShiftFromPulse {...props} baseline={baseline} title="The Verdict" onDone={afterShift} />;
  }

  // ─── 2. PREDICTION VS REALITY ───
  if (step === 'reality' && prediction) {
    const majority = prediction.countA === prediction.countB ? null : prediction.countA > prediction.countB ? 'A' : 'B';
    const right = majority === prediction.correctAnswer;
    const opts = [{ k: 'A' as const, text: prediction.optionA, n: prediction.countA }, { k: 'B' as const, text: prediction.optionB, n: prediction.countB }];
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <KitLabel tone="cyan">The Verdict · prediction vs reality</KitLabel>
        <p className="flex items-center gap-2 font-display text-4xl"><Telescope className="h-8 w-8 text-cyan-300" />{prediction.text}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {opts.map((o) => {
            const correct = o.k === prediction.correctAnswer;
            return (
              <motion.div key={o.k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border px-5 py-4 ${correct ? 'border-emerald-300 bg-emerald-400/10' : 'border-white/10 bg-slate-950/50 opacity-70'}`}>
                <p className="flex items-center gap-2 text-xl">{correct ? <Check className="h-5 w-5 text-emerald-300" /> : <X className="h-5 w-5 text-white/40" />}{o.text}</p>
                <p className="mt-1 font-mono text-sm text-white/55">{o.n} predicted this</p>
              </motion.div>
            );
          })}
        </div>
        <p className="text-center text-2xl">{majority ? (right ? 'The class saw it coming!' : 'The source surprised most of us!') : 'The class was split down the middle!'}</p>
        {prediction.revealFact && <p className="text-center text-lg text-white/70">{prediction.revealFact}</p>}
        <div className="flex justify-end"><KitButton tone="amber" solid onClick={() => go('words')} icon={<ArrowRight className="h-4 w-4" />}>Final Words</KitButton></div>
      </div>
    );
  }

  // ─── 3. FINAL WORDS ───
  if (step === 'words') {
    return (
      <div className="mx-auto max-w-4xl space-y-5 text-white">
        <div className="flex items-center justify-between"><KitLabel tone="amber">The Verdict · Final Words</KitLabel><KitReadout>{spoken} spoken</KitReadout></div>
        {question && <p className="text-center font-display text-4xl leading-snug">{question}</p>}
        <div className="flex flex-wrap justify-center gap-2">{content.starters.map((s) => <span key={s} className="rounded-full border border-white/15 px-3 py-1 text-lg text-white/80">{s}</span>)}</div>
        {turns.speaker && <SpeakerBar name={turns.speaker.name} retry={turns.retry} prompt="your Final Word!" onGood={() => { if (turns.speaker) void onScore?.({ studentId: turns.speaker.id, clientId: null, displayName: turns.speaker.name, promptIndex: 1, points: 2, isCorrect: true }); setSpoken((n) => n + 1); turns.advance(); }} onRetry={() => turns.setRetry(true)} onSkip={turns.advance} />}
        <div className="flex justify-end"><KitButton tone="amber" solid={spoken >= Math.min(students.length, 3)} onClick={() => go('card')} icon={<BookMarked className="h-4 w-4" />}>To the logbook</KitButton></div>
      </div>
    );
  }

  // ─── 4. THE LOGBOOK CARD ───
  const huntTotal = Object.values(thread.hunt ?? {}).reduce((n, h) => n + h.count, 0);
  const phrases = (lessonKit?.phrases ?? []).slice(0, 3);
  return (
    <div className="mx-auto max-w-2xl space-y-5 py-4 text-white">
      <motion.div initial={{ opacity: 0, y: 12, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} className="rounded-3xl border border-amber-200/40 px-8 py-7" style={{ background: '#f4efe3', color: '#1b2233' }}>
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em]" style={{ color: '#7a6f5a' }}><Compass className="h-4 w-4" />Flight log</p>
        <p className="mt-2 font-display text-3xl leading-tight">{question ?? 'Today’s flight'}</p>
        <div className="mt-4 space-y-1.5 text-lg">
          {shift && shift.compared > 0 && <p><strong>{shift.changed} of {shift.compared}</strong> changed their mind</p>}
          {prediction && <p>Prediction: {prediction.countA + prediction.countB > 0 && (prediction.countA > prediction.countB ? 'A' : 'B') === prediction.correctAnswer ? 'the class got it right' : 'the source surprised us'}</p>}
          {phrases.length > 0 && <p className="flex items-start gap-2"><MessageSquareQuote className="mt-1 h-4 w-4 shrink-0" />{phrases.join(' · ')}</p>}
          {spoken > 0 && <p>{spoken} Final Word{spoken === 1 ? '' : 's'} spoken</p>}
          {huntTotal > 0 && <p>{huntTotal} mission stamps</p>}
        </div>
      </motion.div>
      <div className="flex justify-center"><KitButton tone="amber" solid onClick={finishCard} className="!px-8 !py-3" icon={<Check className="h-4 w-4" />}>Land the flight</KitButton></div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Scale, Check } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { ActivityProps } from '../types';
import { motionFor, validMotion } from '@/lib/debate-motion';

// Debate v2 takeoff: the motion itself, one question — "Where do you stand?" (1–5). It's the
// lesson's "before": recorded as the first opinion pulse, so the Opinion Shift landing re-asks
// exactly this question. The motion is stored for the later stages (evidence, prep, debate).
// The screen shows only how many answered: the spread is revealed at landing.

const LIKERT = ['1', '2', '3', '4', '5'];
const LABELS = ['1 – Strongly disagree', '2', '3 – Not sure', '4', '5 – Strongly agree'];

type Phase = 'idle' | 'voting' | 'done';

export function MotionPulseActivity({ generatedContent, sessionSettings, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange }: ActivityProps) {
  const raw = generatedContent as { topicContext?: string } | null;
  const [motion] = useState(() => validMotion(raw) ?? motionFor(raw?.topicContext ?? '', sessionSettings?.difficulty));
  const setDebateMotion = useSessionStore((s) => s.setDebateMotion);
  const recordPulse = useSessionStore((s) => s.recordPulse);
  const [phase, setPhase] = useState<Phase>('idle');
  const [votes, setVotes] = useState<Record<string, { name: string; choice: string }>>({});
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const scored = useRef<Set<string>>(new Set());

  useEffect(() => { setDebateMotion(motion); }, [motion, setDebateMotion]);

  useEffect(() => {
    if (phase !== 'voting') { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({ type: 'choice', gameKey: 'motion-pulse', prompt: motion.pulse, options: LIKERT, optionLabels: LABELS });
  }, [phase, motion.pulse, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'voting' || LIKERT.indexOf(vote.choice) < 0) return;
      setVotes((prev) => ({ ...prev, [vote.clientId]: { name: vote.displayName, choice: vote.choice } }));
      if (!scored.current.has(vote.clientId)) {
        scored.current.add(vote.clientId);
        void onScore?.({ studentId: vote.studentId ?? null, clientId: vote.clientId, displayName: vote.displayName, promptIndex: 1, points: 1, isCorrect: null });
      }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, onScore]);

  const finish = () => {
    // The before: the Opinion Shift re-asks this exact question at landing.
    recordPulse({ text: motion.pulse, type: 'likert', votes });
    setPhase('done');
    onPhaseChange?.('finished');
  };

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[380px] flex-col items-center justify-center gap-6 py-6 text-center">
        <Scale className="h-16 w-16 text-amber-300" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300/80">Today’s motion</p>
          <h3 className="mt-2 text-4xl font-game text-white">{motion.motion}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">Before we argue: where do you stand right now? Answer on your phone. We’ll ask again at the end.</p>
        </div>
        <button onClick={() => { setPhase('voting'); onPhaseChange?.('voting'); }} className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-10 py-4 font-game text-lg text-white shadow-xl transition hover:scale-105">ASK THE CLASS</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
        <Check className="h-12 w-12 text-emerald-300" />
        <h3 className="text-2xl font-game text-white">Positions taken</h3>
        <p className="max-w-md text-sm text-slate-300">Now let’s look at the evidence.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300/80">Motion pulse</p>
        <span className="text-sm text-slate-400">{Object.keys(votes).length} answered</span>
      </div>
      <div className="rounded-2xl border-2 border-amber-400/30 bg-amber-500/[0.08] p-6 text-center">
        <p className="text-3xl font-game text-white">{motion.pulse}</p>
        <p className="mt-3 text-sm text-slate-300">1 = strongly disagree · 5 = strongly agree</p>
      </div>
      <div className="flex justify-end">
        <button onClick={finish} className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">DONE</button>
      </div>
    </div>
  );
}

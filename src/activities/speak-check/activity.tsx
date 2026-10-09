'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Check } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { ActivityProps } from '../types';
import { bankSituationFor, fallbackSpeakSituation, validSpeakSituation, type SpeakAnswer } from '@/lib/speak-check';

// Speak v2 takeoff: the situation check (Try 1, cold). Phones pick the reply they'd use, how
// confident they'd feel and the can-do; the screen shows only how many answered. The results stay
// hidden until the landing reveal (owner rule: the before → after shows only at landing).

type Phase = 'idle' | 'check' | 'done';

export function SpeakCheckActivity({ generatedContent, onSetInputSpec, onRegisterRemoteVoteHandler, onScore, onPhaseChange }: ActivityProps) {
  const raw = generatedContent as { situation?: unknown; topicContext?: string } | null;
  const [situation] = useState(() => validSpeakSituation(raw) ?? bankSituationFor(raw?.topicContext ?? '') ?? fallbackSpeakSituation(raw?.topicContext ?? ''));
  const setSpeakCheck = useSessionStore((s) => s.setSpeakCheck);
  const recordSpeakAnswer = useSessionStore((s) => s.recordSpeakAnswer);
  const answered = useSessionStore((s) => Object.keys(s.lessonThread.speakCheck?.before ?? {}).length);
  const [phase, setPhase] = useState<Phase>('idle');
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const scored = useRef<Set<string>>(new Set());

  useEffect(() => { setSpeakCheck(situation); }, [situation, setSpeakCheck]);

  useEffect(() => {
    if (phase !== 'check') { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'speak-check',
      prompt: 'Situation check',
      perStudentData: { __speakcheck: { situation: situation.situation, replies: situation.before.replies, canDo: situation.canDo } },
      stableInput: true,
    });
  }, [phase, situation, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'check') return;
      try {
        const a = JSON.parse(vote.choice) as SpeakAnswer;
        if (typeof a.reply !== 'number') return;
        recordSpeakAnswer('before', vote.clientId, a);
        if (!scored.current.has(vote.clientId)) {
          scored.current.add(vote.clientId);
          void onScore?.({ studentId: vote.studentId ?? null, clientId: vote.clientId, displayName: vote.displayName, promptIndex: 1, points: 1, isCorrect: null });
        }
      } catch { /* not a check answer */ }
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, recordSpeakAnswer, onScore]);

  const finish = () => { setPhase('done'); onPhaseChange?.('finished'); };

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[380px] flex-col items-center justify-center gap-6 py-6 text-center">
        <MessageCircle className="h-16 w-16 text-cyan-300" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Speak · Try 1</p>
          <h3 className="mt-2 text-3xl font-game text-white">What would you say?</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">One real situation. Answer on your phone: no right or wrong yet. We’ll try it again at the end of the lesson.</p>
        </div>
        <button onClick={() => { setPhase('check'); onPhaseChange?.('check'); }} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-10 py-4 font-game text-lg text-white shadow-xl transition hover:scale-105">START</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
        <Check className="h-12 w-12 text-emerald-300" />
        <h3 className="text-2xl font-game text-white">Try 1 is in</h3>
        <p className="max-w-md text-sm text-slate-300">We’ll come back to this situation when we land.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Speak · Situation check</p>
        <span className="text-sm text-slate-400">{answered} answered</span>
      </div>
      <div className="rounded-2xl border-2 border-cyan-500/30 bg-cyan-500/[0.08] p-6 text-center">
        {situation.pictures?.length ? (
          <div className="flex justify-center gap-3">
            {situation.pictures.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p} src={`/stickers/${p}.webp`} alt="" className="h-24 w-24 rounded-2xl bg-white object-contain" />
            ))}
          </div>
        ) : null}
        <p className="text-2xl font-game text-white">{situation.situation}</p>
        <p className="mt-3 text-sm text-slate-300">On your phone: which reply would you use, and how confident would you feel?</p>
      </div>
      <div className="flex justify-end">
        <button onClick={finish} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">DONE</button>
      </div>
    </div>
  );
}

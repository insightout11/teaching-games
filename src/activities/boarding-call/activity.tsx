'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PlaneTakeoff, Luggage, Check } from 'lucide-react';
import type { ActivityProps, BoardingCallContent } from '../types';

// Boarding Call — the Travel takeoff. The whole class flies together from a shared origin, so the
// three prompts are about the DESTINATION ahead. Spoken-first: students answer each prompt ALOUD;
// their devices only show the prompt (with a packing hint) and a "Ready" tap that registers
// participation. No answers are typed, stored, or fed anywhere — reflection stays oral.

type Phase = 'idle' | 'prompting' | 'done';

const FALLBACK_PROMPTS = [
  'What are you packing for the trip?',
  'What are you most excited to see?',
  'What’s one worry about the trip?',
];

export function BoardingCallActivity({
  generatedContent,
  onPhaseChange,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
}: ActivityProps) {
  const content = generatedContent as BoardingCallContent;
  const prompts = content.prompts?.length ? content.prompts : FALLBACK_PROMPTS;
  const city = content.city || 'your destination';

  const [phase, setPhase] = useState<Phase>('idle');
  const [index, setIndex] = useState(0);
  const [readyByPrompt, setReadyByPrompt] = useState<Record<number, string[]>>({});

  const phaseRef = useRef(phase); phaseRef.current = phase;
  const indexRef = useRef(index); indexRef.current = index;
  const scoredRef = useRef<Set<string>>(new Set());

  const buttonLabel = index === 0 ? 'I’m packed' : 'I’m ready';

  // Device scaffolding — spoken-first: the prompt + (on prompt 1) the packing hint, plus a tap.
  useEffect(() => {
    if (phase !== 'prompting') { onSetInputSpec?.(null); return; }
    onSetInputSpec?.({
      type: 'confirm',
      gameKey: 'boarding-call',
      prompt: prompts[index],
      ...(index === 0 && content.packingHint ? { instruction: content.packingHint } : {}),
      buttonLabel,
    });
  }, [phase, index, prompts, content.packingHint, buttonLabel, onSetInputSpec]);
  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  // A tap registers participation (once per student per prompt) — the answer itself is spoken.
  useEffect(() => {
    onRegisterRemoteVoteHandler?.((vote) => {
      if (phaseRef.current !== 'prompting') return;
      const idx = indexRef.current;
      const key = `${idx}:${vote.clientId}`;
      if (scoredRef.current.has(key)) return;
      scoredRef.current.add(key);
      setReadyByPrompt((prev) => ({ ...prev, [idx]: [...(prev[idx] ?? []), vote.displayName] }));
      void onScore?.({ studentId: vote.studentId ?? null, clientId: vote.clientId, displayName: vote.displayName, promptIndex: idx + 1, points: 1, isCorrect: null });
    });
    return () => onRegisterRemoteVoteHandler?.(null);
  }, [onRegisterRemoteVoteHandler, onScore]);

  const start = useCallback(() => {
    setIndex(0);
    setPhase('prompting');
    onPhaseChange?.('prompting');
  }, [onPhaseChange]);

  const next = useCallback(() => {
    if (index >= prompts.length - 1) {
      onSetInputSpec?.(null);
      setPhase('done');
      onPhaseChange?.('finished');
      return;
    }
    setIndex((i) => i + 1);
  }, [index, prompts.length, onSetInputSpec, onPhaseChange]);

  const readyNames = readyByPrompt[index] ?? [];

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
          <PlaneTakeoff className="relative h-20 w-20 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Boarding Call</p>
          <h3 className="mt-2 text-4xl font-game text-white">Next stop: {city}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            You’re all flying to {city} together. Three quick questions before takeoff — answer each one out loud, then tap when you’re ready.
          </p>
        </div>
        <button onClick={start} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95">BEGIN BOARDING</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <PlaneTakeoff className="h-14 w-14 text-cyan-300" />
        <h3 className="text-3xl font-game text-white">Cleared for takeoff</h3>
        <p className="max-w-md text-sm text-slate-300">Everyone’s packed and ready. Next stop: {city}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Boarding Call · Question {index + 1} of {prompts.length}</p>
        <span className="text-sm text-slate-400">{readyNames.length} ready</span>
      </div>

      <div className="rounded-2xl border-2 border-cyan-500/30 bg-cyan-500/[0.08] p-6 text-center">
        <h3 className="text-2xl font-game text-white">{prompts[index]}</h3>
        {index === 0 && content.packingHint && (
          <p className="mx-auto mt-3 flex max-w-md items-center justify-center gap-2 text-sm text-cyan-100/90">
            <Luggage className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden />{content.packingHint}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-400">Everyone answers out loud, then taps “{buttonLabel}”.</p>
      </div>

      {readyNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {readyNames.map((name) => (
            <span key={name} className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-100">
              <Check className="h-3.5 w-3.5" aria-hidden />{name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end">
        <button onClick={next} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-game text-sm text-white transition hover:scale-[1.02]">
          {index >= prompts.length - 1 ? 'CLEARED FOR TAKEOFF' : 'NEXT QUESTION'}
        </button>
      </div>
    </div>
  );
}

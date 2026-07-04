'use client';

import { useCallback, useMemo, useState } from 'react';
import { PlaneLanding, ShieldCheck } from 'lucide-react';
import type { Student } from '@/lib/supabase/types';
import type { ActivityProps, TripArrivalContent } from '../types';
import { PerformedExchange, type ExchangeLine } from '../shared/performed-exchange';

// Arrival stage of the Travel arc. A deterministic immigration scene performed LINE BY LINE:
// one immigration officer + the travellers present (real students), each traveller takes a
// full turn through passport control, blanks (___) personalise the answers, and both roles'
// phrases are pushed to student devices as scaffolding.

const OFFICER_PHRASES = [
  'Passport, please.',
  "What's the purpose of your visit?",
  'How long are you staying?',
  'Where are you staying?',
  'Enjoy your stay!',
];
const TRAVELLER_PHRASES = [
  'Here you are.',
  "I'm here on holiday. / I'm here for work.",
  'For ___ days.',
  'At the ___ Hotel. / With friends.',
  'Thank you very much.',
];

type Phase = 'idle' | 'running' | 'done';

export function TripArrivalActivity({
  students,
  generatedContent,
  onSetInputSpec,
  onScore,
  onPhaseChange,
}: ActivityProps) {
  const content = generatedContent as TripArrivalContent;
  const [phase, setPhase] = useState<Phase>('idle');

  const scriptFor = useCallback((traveller: Student | null): ExchangeLine[] => {
    const name = traveller ? traveller.name : 'traveller';
    return [
      { speaker: 'service', text: `Welcome to ${content.city}. Passport, please.` },
      { speaker: 'traveller', text: 'Here you are.' },
      { speaker: 'service', text: "What's the purpose of your visit?" },
      { speaker: 'traveller', text: "I'm here ___.", hint: 'e.g. on holiday, for work, visiting friends' },
      { speaker: 'service', text: 'How long are you staying?' },
      { speaker: 'traveller', text: 'For ___ days.', hint: `How long is ${name}'s trip?` },
      { speaker: 'service', text: 'Where are you staying?' },
      { speaker: 'traveller', text: "I'm staying at ___.", hint: 'a hotel, a hostel, with friends…' },
      { speaker: 'service', text: `Everything looks good. Enjoy your stay in ${content.city}!` },
      { speaker: 'traveller', text: 'Thank you very much.' },
    ];
  }, [content.city]);

  const context = useMemo(
    () => `Passport control at ${content.airport} — answer the officer's questions to enter ${content.city}.`,
    [content.airport, content.city],
  );

  const start = () => { setPhase('running'); onPhaseChange?.('running'); };
  const finish = useCallback(() => { setPhase('done'); onPhaseChange?.('finished'); }, [onPhaseChange]);

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
          <PlaneLanding className="relative h-20 w-20 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Arrival</p>
          <h3 className="mt-2 text-4xl font-game text-white">Immigration at {content.city}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{content.framingPrompt}</p>
          <p className="mx-auto mt-2 max-w-lg text-xs text-slate-400">
            One student is the officer; every traveller performs the exchange line by line. Blanks are theirs to fill.
          </p>
        </div>
        <button onClick={start} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95">START THE SCENE</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <PlaneLanding className="h-14 w-14 text-cyan-300" />
        <h3 className="text-3xl font-game text-white">Through the border</h3>
        <p className="max-w-md text-sm text-slate-300">Welcome to {content.city}. Next: getting into the city.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Arrival · Immigration</p>
        <h3 className="mt-1 text-2xl font-game text-white">Passport control, {content.city}</h3>
      </div>
      <PerformedExchange
        students={students}
        gameKey="trip-arrival"
        context={context}
        serviceRole="Immigration officer"
        travellerRole="Traveller"
        serviceHint="Asks the questions."
        travellerHint="Answers — fill the blanks your way."
        ServiceIcon={ShieldCheck}
        accent="cyan"
        scriptFor={scriptFor}
        servicePhrases={OFFICER_PHRASES}
        travellerPhrases={TRAVELLER_PHRASES}
        onSetInputSpec={onSetInputSpec}
        onScore={onScore}
        onFinished={finish}
      />
    </div>
  );
}

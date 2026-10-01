'use client';

import { useCallback, useState } from 'react';
import { BedDouble, ConciergeBell } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';
import type { BudgetTier } from '@/lib/world-flight/traveller-cards';
import type { ActivityProps, TripHotelContent } from '../types';
import { PerformedExchange, scriptTierFor, type ExchangeLine } from '../shared/performed-exchange';

// Hotel stop of the Travel arc, on the line-by-line PerformedExchange engine (Travel v2): one
// receptionist + each traveller checks in. The room matches the traveller's budget tier from their
// Traveller Card. Take 1 is the script; Take 2 is a hotel problem in their own words.

const RECEPTION_PHRASES = [
  'Good evening. Do you have a booking?',
  'Can I see your passport, please?',
  'Your room is on the ___ floor.',
  'Breakfast is from ___ to ___.',
  'Enjoy your stay!',
];
const GUEST_PHRASES = [
  'Hi, I have a booking under ___.',
  'For ___ nights.',
  'What time is breakfast?',
  'Is there Wi-Fi?',
  'Thank you!',
];

const ROOM_BY_BUDGET: Record<BudgetTier, string> = {
  '$': 'a bed in the hostel dorm',
  '$$': 'a double room',
  '$$$': 'a suite with a view',
};

type Phase = 'idle' | 'running' | 'done';

export function TripHotelActivity({ students, generatedContent, sessionSettings, onSetInputSpec, onScore, onPhaseChange }: ActivityProps) {
  const content = generatedContent as Partial<TripHotelContent>;
  const city = content.city || content.topicContext?.replace(/^Trip to /, '') || 'the city';
  const [phase, setPhase] = useState<Phase>('idle');
  const addTripLogEntry = useSessionStore((s) => s.addTripLogEntry);
  const cards = useSessionStore((s) => s.lessonThread.travellers);
  const tier = scriptTierFor(sessionSettings.difficulty);

  const scriptFor = useCallback((traveller: Student | null): ExchangeLine[] => {
    const card = traveller ? cards?.[traveller.id] : undefined;
    const room = card ? ROOM_BY_BUDGET[card.budget] : 'a double room';
    if (tier === 'basic') {
      return [
        { speaker: 'service', text: 'Hello! Do you have a booking?' },
        { speaker: 'traveller', text: 'Yes. My name is ___.', hint: 'your name' },
        { speaker: 'service', text: `Yes, ${room}. How many nights?` },
        { speaker: 'traveller', text: '___ nights, please.', hint: 'two, three, five…' },
        { speaker: 'service', text: 'Here is your key. Enjoy your stay!' },
        { speaker: 'traveller', text: 'Thank you!' },
      ];
    }
    const standard: ExchangeLine[] = [
      { speaker: 'service', text: `Good evening, welcome to ${city}. Do you have a booking?` },
      { speaker: 'traveller', text: 'Yes, I have a booking under ___.', hint: 'your name' },
      { speaker: 'service', text: `Let me see… yes, ${room} for how many nights?` },
      { speaker: 'traveller', text: 'For ___ nights.', hint: 'a number' },
      { speaker: 'service', text: 'Can I see your passport, please?' },
      { speaker: 'traveller', text: 'Here you are. What time is breakfast?' },
      { speaker: 'service', text: 'Breakfast is from seven to ten, on the ground floor.' },
      { speaker: 'traveller', text: 'Great. Is there ___?', hint: 'Wi-Fi, a gym, a lift, a safe…' },
    ];
    const closing: ExchangeLine[] = [
      { speaker: 'service', text: 'Here is your key card. Your room is on the ___ floor. Enjoy your stay!', hint: 'the receptionist picks a floor' },
      { speaker: 'traveller', text: 'Thank you very much.' },
    ];
    if (tier === 'standard') return [...standard, ...closing];
    return [
      ...standard,
      { speaker: 'service', text: 'Yes, of course. Is there anything else I can help you with?' },
      { speaker: 'traveller', text: 'Could you recommend ___?', hint: 'a place to eat, something to see, how to get around' },
      { speaker: 'service', text: '___', hint: 'recommend something real in the city, with one reason' },
      ...closing,
    ];
  }, [city, tier, cards]);

  const start = () => { setPhase('running'); onPhaseChange?.('running'); };
  const finish = useCallback(() => {
    addTripLogEntry({ stageId: 'hotel', text: `Checked in at the hotel in ${city}`, vocab: ['booking', 'key card'] });
    setPhase('done');
    onPhaseChange?.('finished');
  }, [addTripLogEntry, city, onPhaseChange]);

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
          <BedDouble className="relative h-20 w-20 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Hotel</p>
          <h3 className="mt-2 text-4xl font-game text-white">Check-in in {city}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            {content.framingPrompt || `Check in at your hotel in ${city}.`}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-xs text-slate-400">
            One student is the receptionist. Every guest checks in line by line, then plays it again with a problem.
          </p>
        </div>
        <button onClick={start} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95">START THE SCENE</button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <BedDouble className="h-14 w-14 text-cyan-300" />
        <h3 className="text-3xl font-game text-white">Checked in</h3>
        <p className="max-w-md text-sm text-slate-300">Bags down. Time to go out and see {city}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/70">Hotel · Check-in</p>
        <h3 className="mt-1 text-2xl font-game text-white">The front desk, {city}</h3>
      </div>
      <PerformedExchange
        students={students}
        gameKey="trip-hotel"
        context={`The hotel front desk in ${city}. Check in, then ask about your stay.`}
        serviceRole="Receptionist"
        travellerRole="Guest"
        serviceHint="Checks the guest in and answers questions."
        travellerHint="Checks in, line by line."
        ServiceIcon={ConciergeBell}
        accent="cyan"
        scriptFor={scriptFor}
        servicePhrases={RECEPTION_PHRASES}
        travellerPhrases={GUEST_PHRASES}
        onSetInputSpec={onSetInputSpec}
        onScore={onScore}
        onFinished={finish}
        problemStop="hotel"
      />
    </div>
  );
}

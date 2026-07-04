'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UtensilsCrossed, ConciergeBell } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import type { Student } from '@/lib/supabase/types';
import type { InputSpec } from '@/lib/input-spec';
import type { ActivityProps, TripMealContent, TripDishOption } from '../types';
import { PerformedExchange, scriptTierFor, type ExchangeLine } from '../shared/performed-exchange';

// Local Table stage of the Travel arc. Two halves:
//  1. MENU — the city's REAL dishes with what each one is; students pick the dish that
//     interests them on their device (that's the learning + the agency).
//  2. ORDER — a line-by-line performed exchange with a waiter. Each customer takes a turn
//     ordering THEIR chosen dish; the dish's real description feeds the waiter's answer.

const WAITER_PHRASES = [
  'Are you ready to order?',
  'Good choice. Anything to drink?',
  "It's ___ — one of our favourites.",
  "I'll bring that right over.",
  "Here's your bill.",
];
const CUSTOMER_PHRASES = [
  "I'd like the ___, please.",
  "What's in the ___?",
  'Is it spicy / vegetarian?',
  'Just water, please.',
  'Could we have the bill, please?',
];

type Phase = 'idle' | 'menu' | 'order' | 'done';

export function TripMealActivity({
  students,
  generatedContent,
  sessionSettings,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onPhaseChange,
}: ActivityProps) {
  const content = generatedContent as TripMealContent;
  const dishes = useMemo(() => content.dishes ?? [], [content.dishes]);
  const addTripLogEntry = useSessionStore((s) => s.addTripLogEntry);
  const tier = scriptTierFor(sessionSettings.difficulty);

  const [phase, setPhase] = useState<Phase>('idle');
  const [picks, setPicks] = useState<Record<string, string>>({}); // displayName -> dish name
  const scoredRef = useRef<Set<string>>(new Set());

  const buildSpec = useCallback((): InputSpec => ({
    type: 'choice',
    gameKey: 'trip-meal',
    prompt: `Pick a dish to try in ${content.city}`,
    options: dishes.map((dish) => dish.name),
  }), [content.city, dishes]);

  useEffect(() => {
    if (phase === 'menu') {
      onSetInputSpec?.(buildSpec());
      onRegisterRemoteVoteHandler?.((vote) => {
        setPicks((prev) => ({ ...prev, [vote.displayName]: vote.choice }));
        if (!scoredRef.current.has(vote.clientId)) {
          scoredRef.current.add(vote.clientId);
          void onScore?.({
            studentId: vote.studentId ?? null,
            clientId: vote.clientId,
            displayName: vote.displayName,
            promptIndex: 1,
            points: 1,
            isCorrect: null,
          });
        }
      });
      return () => { onRegisterRemoteVoteHandler?.(null); };
    }
    if (phase !== 'order') onSetInputSpec?.(null);
    onRegisterRemoteVoteHandler?.(null);
    return undefined;
  }, [phase, buildSpec, onSetInputSpec, onRegisterRemoteVoteHandler, onScore]);

  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const countFor = useCallback((name: string) => Object.values(picks).filter((p) => p === name).length, [picks]);

  const dishFor = useCallback((traveller: Student | null): TripDishOption | null => {
    if (traveller) {
      const picked = picks[traveller.name];
      const match = dishes.find((d) => d.name === picked);
      if (match) return match;
    }
    return dishes[0] ?? null;
  }, [picks, dishes]);

  const scriptFor = useCallback((traveller: Student | null): ExchangeLine[] => {
    const dish = dishFor(traveller);
    const dishName = dish?.name ?? '___';
    if (tier === 'basic') {
      return [
        { speaker: 'service', text: 'Hello! What would you like?' },
        { speaker: 'traveller', text: `The ${dishName}, please.` },
        { speaker: 'service', text: 'Anything to drink?' },
        { speaker: 'traveller', text: '___, please.', hint: 'water, juice, a coffee…' },
        { speaker: 'service', text: 'Coming right up!' },
        { speaker: 'traveller', text: 'Thank you!' },
      ];
    }
    const standard: ExchangeLine[] = [
      { speaker: 'service', text: 'Welcome! Are you ready to order?' },
      { speaker: 'traveller', text: `Yes — I'd like the ${dishName}, please.` },
      { speaker: 'service', text: 'Good choice. Anything to drink?' },
      { speaker: 'traveller', text: '___, please.', hint: 'e.g. water, a lemonade, a coffee' },
      { speaker: 'traveller', text: `Actually — what's in the ${dishName}?` },
      { speaker: 'service', text: "It's ___ — one of our favourites.", hint: dish ? `Real answer: ${dish.whatItIs}` : 'describe the dish' },
    ];
    const closing: ExchangeLine[] = [
      { speaker: 'traveller', text: 'Sounds great. Thank you!' },
      { speaker: 'service', text: "I'll bring that right over." },
    ];
    if (tier === 'standard') return [...standard, ...closing];
    // advanced — dietary check and sorting the bill before the closing.
    return [
      ...standard,
      { speaker: 'traveller', text: 'Is it very ___?', hint: 'spicy, salty, heavy…' },
      { speaker: 'service', text: 'A little! Most people love it — I can ask the kitchen to go easy if you like.' },
      { speaker: 'traveller', text: '___, please. And could we have the bill afterwards?', hint: 'accept or adjust — "That would be great" / "No, keep it as it is"' },
      { speaker: 'service', text: 'Of course.' },
      ...closing,
    ];
  }, [dishFor, tier]);

  const start = () => { setPhase('menu'); onPhaseChange?.('menu'); };
  const toOrder = () => {
    const ordered = Array.from(new Set(Object.values(picks)));
    if (ordered.length > 0) {
      addTripLogEntry({ stageId: 'local-table', text: `Ate ${ordered.join(', ')} in ${content.city}` });
    }
    setPhase('order');
    onPhaseChange?.('order');
  };
  const finish = useCallback(() => { setPhase('done'); onPhaseChange?.('finished'); }, [onPhaseChange]);

  const DishList = ({ showCounts }: { showCounts?: boolean }) => (
    <ul className="space-y-2">
      {dishes.map((dish) => (
        <li key={dish.id} className="flex items-start justify-between gap-3 rounded-xl border border-amber-300/15 bg-slate-950/40 px-4 py-3">
          {dish.imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={dish.imageUrl} alt={dish.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-game text-base text-amber-100">{dish.name}</p>
            <p className="mt-0.5 text-sm text-slate-300">{dish.whatItIs}</p>
            {dish.note && <p className="mt-1 text-xs text-slate-400">{dish.note}</p>}
          </div>
          {showCounts && countFor(dish.name) > 0 && (
            <span className="shrink-0 rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-bold text-amber-200">{countFor(dish.name)}</span>
          )}
        </li>
      ))}
    </ul>
  );

  if (phase === 'idle') {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl" />
          <UtensilsCrossed className="relative h-20 w-20 text-amber-300" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300/70">Local Table</p>
          <h3 className="mt-2 text-4xl font-game text-white">Eat in {content.city}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{content.framingPrompt}</p>
        </div>
        <div className="w-full max-w-lg text-left"><DishList /></div>
        <button onClick={start} className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 px-12 py-5 font-game text-xl text-white shadow-xl transition hover:scale-105 active:scale-95">OPEN MENU</button>
      </div>
    );
  }

  if (phase === 'order') {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300/70">Local Table · Ordering</p>
          <h3 className="mt-1 text-2xl font-game text-white">Order your dish</h3>
        </div>
        <PerformedExchange
          students={students}
          gameKey="trip-meal"
          context={`A local restaurant in ${content.city} — order the dish you picked from the menu.`}
          serviceRole="Waiter"
          travellerRole="Customer"
          serviceHint="Takes the orders and answers questions."
          travellerHint="Orders their chosen dish, line by line."
          ServiceIcon={ConciergeBell}
          accent="amber"
          scriptFor={scriptFor}
          servicePhrases={WAITER_PHRASES}
          travellerPhrases={CUSTOMER_PHRASES}
          onSetInputSpec={onSetInputSpec}
          onScore={onScore}
          onFinished={finish}
        />
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-6 text-center">
        <UtensilsCrossed className="h-14 w-14 text-amber-300" />
        <h3 className="text-3xl font-game text-white">Enjoy the meal</h3>
        <p className="max-w-md text-sm text-slate-300">The class tried real {content.city} food. On to the next stop.</p>
      </div>
    );
  }

  // phase === 'menu'
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300/70">Local Table</p>
          <h3 className="mt-1 text-2xl font-game text-white">The menu — pick a dish</h3>
        </div>
        <button onClick={toOrder} className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-2.5 font-game text-sm text-white shadow-lg transition hover:scale-105 active:scale-95">START ORDERING</button>
      </div>
      <p className="text-sm text-slate-400">Students pick their dish on their device. Each one is real {content.city} food — read what it is. Then everyone orders theirs, line by line.</p>
      <DishList showCounts />
    </div>
  );
}

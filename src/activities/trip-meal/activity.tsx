'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import type { InputSpec } from '@/lib/input-spec';
import type { ActivityProps, TripMealContent } from '../types';

// Local Table stage of the Travel arc. Shows the city's REAL dishes as a menu (so students
// learn what the food is), students pick the dish that interests them on their device, then
// the class does a waiter/customer ordering roleplay for the dishes they chose.

const CUSTOMER_PHRASES = [
  'Could I see the menu, please?',
  "I'd like the ___, please.",
  "What's in the ___?",
  'Is it spicy / vegetarian?',
  'Could we have the bill, please?',
];
const WAITER_PHRASES = [
  'Are you ready to order?',
  'Anything to drink?',
  "I'd recommend the ___.",
  "I'll bring that right over.",
  "Here's your bill.",
];

type Phase = 'idle' | 'menu' | 'order' | 'done';

function PhraseCard({ title, phrases }: { title: string; phrases: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <ul className="space-y-1.5">
        {phrases.map((phrase) => (
          <li key={phrase} className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200">{phrase}</li>
        ))}
      </ul>
    </div>
  );
}

export function TripMealActivity({
  generatedContent,
  onSetInputSpec,
  onRegisterRemoteVoteHandler,
  onScore,
  onPhaseChange,
}: ActivityProps) {
  const content = generatedContent as TripMealContent;
  const dishes = useMemo(() => content.dishes ?? [], [content.dishes]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [picks, setPicks] = useState<Record<string, string>>({}); // clientId -> dish name
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
        setPicks((prev) => ({ ...prev, [vote.clientId]: vote.choice }));
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
    } else {
      onSetInputSpec?.(null);
      onRegisterRemoteVoteHandler?.(null);
    }
    return () => { onRegisterRemoteVoteHandler?.(null); };
  }, [phase, buildSpec, onSetInputSpec, onRegisterRemoteVoteHandler, onScore]);

  useEffect(() => () => onSetInputSpec?.(null), [onSetInputSpec]);

  const countFor = useCallback((name: string) => Object.values(picks).filter((p) => p === name).length, [picks]);
  const pickedDishes = useMemo(() => Array.from(new Set(Object.values(picks))), [picks]);

  const start = () => { setPhase('menu'); onPhaseChange?.('menu'); };
  const toOrder = () => { setPhase('order'); onPhaseChange?.('order'); };
  const finish = () => { setPhase('done'); onPhaseChange?.('finished'); };

  const DishList = ({ showCounts }: { showCounts?: boolean }) => (
    <ul className="space-y-2">
      {dishes.map((dish) => (
        <li key={dish.id} className="flex items-start justify-between gap-3 rounded-xl border border-amber-300/15 bg-slate-950/40 px-4 py-3">
          <div className="min-w-0">
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
      <div className="space-y-5 py-2">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300/70">Order your dish</p>
          <h3 className="mt-1 text-2xl font-game text-white">Waiter &amp; customer</h3>
        </div>
        {pickedDishes.length > 0 && (
          <div className="rounded-2xl border border-amber-300/15 bg-slate-950/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">On the table tonight</p>
            <div className="flex flex-wrap gap-2">
              {pickedDishes.map((name) => (
                <span key={name} className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-100">{name}</span>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <PhraseCard title="Customer" phrases={CUSTOMER_PHRASES} />
          <PhraseCard title="Waiter" phrases={WAITER_PHRASES} />
        </div>
        <div className="text-center">
          <button onClick={finish} className="rounded-2xl bg-white/10 px-10 py-4 font-game text-lg text-white transition hover:bg-white/20">FINISH</button>
        </div>
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
      <p className="text-sm text-slate-400">Students pick their dish on their device. Each one is real {content.city} food — read what it is.</p>
      <DishList showCounts />
    </div>
  );
}

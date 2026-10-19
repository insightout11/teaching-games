'use client';

import { useState } from 'react';
import { Languages, Landmark, Utensils, Vote, type LucideIcon } from 'lucide-react';
import { findTripDestination } from '@/lib/world-flight/trip-pack';
import { localWords } from '@/lib/world-flight/souvenirs';

type Card = 'food' | 'sights' | 'words';
const CARDS: Array<{ key: Card; label: string; icon: LucideIcon }> = [
  { key: 'food', label: 'Food', icon: Utensils },
  { key: 'sights', label: 'Sights', icon: Landmark },
  { key: 'words', label: 'Local words', icon: Languages },
];

/**
 * The arrival's last few minutes: three cards (food, sights, local words) from the city's own pack. The class picks
 * one (a quick vote on phones and seats) or the teacher does, and talks about it for 2–3 minutes.
 */
export function ArrivalCards({ cityId, city, onClassVote }: { cityId: string; city: string; onClassVote: (options: string[]) => void }) {
  const [open, setOpen] = useState<Card | null>(null);
  const pack = findTripDestination(cityId, city);
  const dishes = pack?.travelAnchors?.dishes.slice(0, 2) ?? [];
  const sights = pack?.travelAnchors?.attractions.slice(0, 2) ?? [];
  const words = localWords(cityId).slice(0, 3);
  const has: Record<Card, boolean> = { food: dishes.length > 0, sights: sights.length > 0, words: words.length > 0 };
  const available = CARDS.filter((c) => has[c.key]);
  if (available.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {available.map((c) => (
          <button key={c.key} type="button" onClick={() => setOpen((o) => (o === c.key ? null : c.key))}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${open === c.key ? 'border-[#1b2233] bg-[#1b2233] text-[#f4efe3]' : 'border-[#1b2233]/25 text-[#1b2233] hover:bg-[#1b2233]/5'}`}>
            <c.icon className="h-4 w-4" /> {c.label}
          </button>
        ))}
        {available.length > 1 && (
          <button type="button" onClick={() => onClassVote(available.map((c) => c.label))} className="flex items-center gap-1 text-xs text-[#1b2233]/70 hover:text-[#1b2233]">
            <Vote className="h-3.5 w-3.5" /> Let the class choose
          </button>
        )}
      </div>
      {open === 'food' && (
        <ul className="space-y-1.5 rounded-xl bg-[#1b2233]/5 p-3 text-sm">
          {dishes.map((d) => <li key={d.id}><b>{d.name}</b>: {d.whatItIs}</li>)}
          <li className="text-[#1b2233]/60">Would you try it? Why, or why not?</li>
        </ul>
      )}
      {open === 'sights' && (
        <ul className="space-y-1.5 rounded-xl bg-[#1b2233]/5 p-3 text-sm">
          {sights.map((a) => <li key={a.id}><b>{a.name}</b>: {a.whatItIs}</li>)}
          <li className="text-[#1b2233]/60">Which would you visit first in {city}?</li>
        </ul>
      )}
      {open === 'words' && (
        <ul className="space-y-1.5 rounded-xl bg-[#1b2233]/5 p-3 text-sm">
          {words.map((w) => <li key={w.word}><b>{w.word}</b> ({w.language}, say “{w.say}”): {w.meaning}</li>)}
          <li className="text-[#1b2233]/60">Everyone say them together, then use one in a sentence.</li>
        </ul>
      )}
    </div>
  );
}

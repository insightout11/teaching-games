'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Check, ChevronLeft, ChevronRight, Compass, Gift, Mountain, Route, Stamp } from 'lucide-react';
import { RARITY_STYLE } from '@/lib/live-room/landmark-rarity';
import type { VoteCityCard } from '@/components/session/live-room/city-vote-board';

// The same map as the room's (MapLibre), loaded only when the vote opens.
const WorldFlightMap = dynamic(() => import('@/components/world-flight/world-flight-map').then((m) => m.WorldFlightMap), { ssr: false });

export interface CityResearchData {
  cards: VoteCityCard[];
  map: { origin: { id: string; lat: number; lng: number; city: string }; rangeKm: number; visitedIds: string[]; journey: Array<{ from: string | null; to: string }> };
}

/** Read a vote's research block from poll metadata; null if it is not a city vote with cards. */
export function cityResearchOf(metadata: unknown): CityResearchData | null {
  const r = (metadata as { research?: CityResearchData } | null)?.research;
  return r && Array.isArray(r.cards) && r.cards.length > 0 && r.map?.origin ? r : null;
}

/**
 * The city vote on the phone (Oct 2026, pilot 001: students wanted to research cities before choosing): the class map
 * and the same city cards as the big screen (sights with rarity words, items they could earn, what the city is known
 * for, the strategy line). Tap a city on the map or swipe the cards; vote from the card.
 */
export function CityResearch({ data, selected, busy, onVote }: { data: CityResearchData; selected: string | null; busy: boolean; onVote: (city: string) => void }) {
  const [i, setI] = useState(() => Math.max(0, data.cards.findIndex((c) => c.city === selected)));
  const card = data.cards[Math.min(i, data.cards.length - 1)];
  const go = (n: number) => setI((n + data.cards.length) % data.cards.length);
  return (
    <div className="space-y-3">
      <div className="h-44 overflow-hidden rounded-xl border border-white/10">
        <WorldFlightMap
          origin={data.map.origin}
          rangeKm={data.map.rangeKm}
          visitedIds={data.map.visitedIds}
          journey={data.map.journey}
          selectedId={card.id}
          onCityClick={(id) => { const k = data.cards.findIndex((c) => c.id === id); if (k >= 0) setI(k); }}
          className="h-full w-full"
        />
      </div>
      <div className="rounded-2xl border border-white/12 bg-slate-900/80 p-3 text-[13px] text-white/85">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => go(i - 1)} aria-label="Previous city" className="rounded-full bg-white/10 p-1.5"><ChevronLeft className="h-4 w-4" /></button>
          <div className="min-w-0 text-center">
            <p className="font-display text-2xl leading-tight text-white">{card.city}</p>
            <p className="text-xs text-white/55">{card.country}{card.newStamp ? '' : ' · been here'} · {i + 1} of {data.cards.length}</p>
          </div>
          <button type="button" onClick={() => go(i + 1)} aria-label="Next city" className="rounded-full bg-white/10 p-1.5"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="mt-2 space-y-1.5">
          {card.newStamp && <p className="flex items-center gap-1.5 text-emerald-200"><Stamp className="h-3.5 w-3.5" />New stamp for the passport</p>}
          {card.onTheWay.length > 0 && <p className="flex gap-1.5"><Route className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />On the way: {card.onTheWay.join(', ')}</p>}
          {card.sights && card.sights.length > 0 && (
            <p className="flex flex-wrap items-center gap-1"><Mountain className="h-3.5 w-3.5 shrink-0 text-violet-300" />Sights:
              {card.sights.map((s) => <span key={s.name} className="whitespace-nowrap">{s.name} <span className={`rounded-full px-1.5 text-[10px] font-semibold uppercase ${RARITY_STYLE[s.rarity]}`}>{s.rarity}</span></span>)}
            </p>
          )}
          {card.items && card.items.length > 0 && (
            <p className="flex flex-wrap items-center gap-1"><Gift className="h-3.5 w-3.5 shrink-0 text-emerald-300" />Could earn:
              {card.items.map((it) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={it.country} src={`/stickers/${it.sticker ?? 'present'}.webp`} alt={it.item} title={`${it.item} (talk about ${it.country})`} className="h-7 w-7 rounded bg-white/90 p-0.5" />
              ))}
            </p>
          )}
          {card.souvenir && <p className="flex gap-1.5"><Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />Souvenir: {card.souvenir}{card.souvenirRare ? ' (rare)' : ''}</p>}
          {card.knownFor && card.knownFor.length > 0 && <p className="text-xs text-white/60">Known for: {card.knownFor.join(' · ')}</p>}
          {card.strategy && <p className="flex gap-1.5 text-emerald-200"><Compass className="mt-0.5 h-3.5 w-3.5 shrink-0" />{card.strategy}</p>}
        </div>
        <button type="button" disabled={busy} onClick={() => onVote(card.city)} className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ${selected === card.city ? 'bg-emerald-400 text-slate-950' : 'bg-amber-300 text-slate-950'} disabled:opacity-50`}>
          {selected === card.city ? <><Check className="h-4 w-4" /> Your vote: {card.city}</> : `Vote for ${card.city}`}
        </button>
      </div>
    </div>
  );
}

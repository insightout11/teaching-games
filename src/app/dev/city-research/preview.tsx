'use client';

import { useState } from 'react';
import { CityResearch, type CityResearchData } from '@/components/student/city-research';
import { getDestinationById } from '@/data/world-flight/destinations';
import { landmarksOnRoute } from '@/lib/live-room/landmark-rarity';
import { COUNTRY_ITEMS } from '@/data/world-flight/country-items';

/** A phone-sized preview with real route data from Cairo (items are a sample, not the route's real crossings). */
export function CityResearchPreview() {
  const from = getDestinationById('cairo')!;
  const ids = ['dubai', 'istanbul', 'rome', 'nairobi', 'athens'].filter((id) => getDestinationById(id));
  const data: CityResearchData = {
    map: { origin: { id: from.id, lat: from.lat, lng: from.lng, city: from.city }, rangeKm: 4200, visitedIds: [from.id], journey: [] },
    cards: ids.map((id, k) => {
      const c = getDestinationById(id)!;
      return {
        id, city: c.city, country: c.country, lat: c.lat, lng: c.lng, newStamp: k !== 2, souvenir: null, souvenirRare: false,
        strategy: k === 1 ? 'Gets you closer to London' : null,
        onTheWay: [],
        knownFor: [c.travelAnchors?.attractions?.[0]?.name, c.travelAnchors?.dishes?.[0]?.name].filter((x): x is string => !!x),
        sights: landmarksOnRoute('cairo', id).slice(0, 3).map((l) => ({ name: l.name, rarity: l.rarity })),
        items: COUNTRY_ITEMS.slice(k, k + 2).map((it) => ({ item: it.item, sticker: it.sticker, country: it.country })),
      };
    }),
  };
  const [vote, setVote] = useState<string | null>(null);
  return (
    <main className="min-h-screen bg-[#0b1220] p-4">
      <div className="mx-auto max-w-[390px]"><CityResearch data={data} selected={vote} busy={false} onVote={setVote} /></div>
    </main>
  );
}

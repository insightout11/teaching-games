'use client';

import { useEffect, useState } from 'react';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import type { TimeOfDay, WeatherCondition } from '@/components/world-flight/arrival-scene/types';

/** Every city's landed frame with all the new extras on. ?tod=night and ?month=4 change the light and season; ?from=20&n=12 pages. */
export function ArrivalSweep() {
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState<URLSearchParams | null>(null);
  useEffect(() => { setQ(new URLSearchParams(window.location.search)); setReady(true); }, []);
  if (!ready || !q) return <main className="min-h-screen bg-[#0b1220]" />;
  const tod = (q.get('tod') ?? 'day') as TimeOfDay;
  const month = Number(q.get('month') ?? new Date().getMonth() + 1);
  const weather = (q.get('weather') ?? 'clear') as WeatherCondition;
  const ids = q.get('ids')?.split(',');
  const from = Number(q.get('from') ?? 0), n = Number(q.get('n') ?? 12);
  const list = ids ? WORLD_DESTINATIONS.filter((d) => ids.includes(d.id)) : WORLD_DESTINATIONS.slice(from, from + n);
  return (
    <main className="min-h-screen bg-[#0b1220] p-3 text-white">
      <p className="mb-2 text-xs text-white/60">{from}–{from + list.length - 1} of {WORLD_DESTINATIONS.length} · {tod} · {weather} · month {month}</p>
      <div className={`grid gap-2 ${q.get('cols') === '1' ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {list.map((d) => (
          <div key={d.id}>
            <p className="text-[11px] text-white/70">{d.id}</p>
            <div className="relative aspect-video overflow-hidden rounded">
              <DestinationArrivalScene
                destinationId={d.id}
                scene={d.scene}
                phase="landed"
                progress={1}
                motion="static"
                timeOfDay={tod}
                weather={weather}
                extras={{ reflections: true, framing: true, animal: true, postcard: true, month, southern: d.lat < 0, title: { city: d.city, country: d.country } }}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

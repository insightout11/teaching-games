'use client';

import { useEffect, useMemo, useState } from 'react';
import { CockpitSky } from '@/components/live-room/flight/cockpit-sky';
import { CockpitWorld, type RouteClock } from '@/components/live-room/flight/cockpit-world';
import { setRealCoast } from '@/components/live-room/flight/ground-texture';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { coastStrip, type CoastStrip } from '@/lib/live-room/coast-strip';

/** Preview of the route coast strip (Oct 2026): Manila to Hanoi, the coast read at the plane's place on the route. */
const ROUTES = [
  { label: 'Manila to Hanoi', from: { lat: 14.5995, lng: 120.9842 }, to: { lat: 21.0278, lng: 105.8342 } },
  { label: 'Tokyo to Seoul', from: { lat: 35.6762, lng: 139.6503 }, to: { lat: 37.5665, lng: 126.978 } },
  { label: 'Athens to Rome', from: { lat: 37.9838, lng: 23.7275 }, to: { lat: 41.9028, lng: 12.4964 } },
  { label: 'Cairo to Rome', from: { lat: 30.0444, lng: 31.2357 }, to: { lat: 41.9028, lng: 12.4964 } },
];

export function CoastStripGallery() {
  useEffect(() => { setRealCoast(true); }, []);
  const [ri, setRi] = useState(0);
  const route = ROUTES[ri];
  const [strip, setStrip] = useState<CoastStrip | null>(null);
  const [t, setT] = useState(0.02);
  const [playing, setPlaying] = useState(false);
  const [minutes, setMinutes] = useState(3); // how long the fast-forward flight takes
  useEffect(() => { setStrip(null); void coastStrip(route.from, route.to).then(setStrip); }, [route]);
  const [clock, setClock] = useState<RouteClock>({ at: Date.now(), t, perMs: 0 });
  useEffect(() => { setClock({ at: Date.now(), t, perMs: playing ? 1 / (minutes * 60_000) : 0 }); }, [t, playing, minutes]);
  // keep the slider in step while playing
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((x) => Math.min(1, x + 1000 / (minutes * 60_000))), 1000);
    return () => clearInterval(id);
  }, [playing, minutes]);
  const dest = WORLD_DESTINATIONS.find((d) => d.scene)!;
  const palette = useMemo(() => composeTimedPalette(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tod') === 'dusk' ? 'dusk' : 'day', dest.scene!), [dest]);
  return (
    <div className="min-h-screen space-y-3 bg-[#070b14] p-4 text-white">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-3 font-display text-2xl">Coast strip</h1>
        {ROUTES.map((r, i) => <button key={r.label} type="button" onClick={() => { setRi(i); setT(0.02); }} className={`rounded-full border px-3 py-1 text-xs ${ri === i ? 'border-amber-300/70 text-amber-100' : 'border-white/15 text-white/70'}`}>{r.label}</button>)}
        <button type="button" onClick={() => setPlaying((p) => !p)} className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-[#1b2233]">{playing ? 'Pause' : `Fly (${minutes} min)`}</button>
        <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="rounded bg-slate-900 px-2 py-1 text-xs"><option value={1}>1 min</option><option value={3}>3 min</option><option value={10}>10 min</option></select>
        <span className="font-mono text-xs text-white/60">{strip ? `${Math.round(t * strip.routeKm)} of ${Math.round(strip.routeKm)} km · ${strip.land.length} land outlines` : 'working out the coast…'}</span>
      </div>
      <input type="range" min={0} max={1} step={0.002} value={t} onChange={(e) => setT(Number(e.target.value))} className="w-full" aria-label="Place on the route" />
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
        <CockpitSky palette={palette} timeOfDay="day" altitude={1} />
        <CockpitWorld terrain="farmland" region="Asia" palette={palette} night={false} speed={0.55} cloudCover={10} coastStrip={strip} routeClock={clock} />
      </div>
    </div>
  );
}

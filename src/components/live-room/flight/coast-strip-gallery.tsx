'use client';

import { useEffect, useMemo, useState } from 'react';
import { CockpitSky, LIGHT_POS } from '@/components/live-room/flight/cockpit-sky';
import type { WorldLandmark, WorldLandmarkKind } from '@/components/live-room/flight/world-landmarks';
import type { SceneEvent } from '@/components/live-room/flight/event-art';
import { CockpitWorld, type RouteClock } from '@/components/live-room/flight/cockpit-world';
import { realCoast, setRealCoast, realTerrain, setRealTerrain } from '@/components/live-room/flight/ground-texture';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { highGroundAhead, type HighGround } from '@/lib/live-room/elevation-ahead';
import { greatCirclePoint } from '@/lib/live-room/route-terrain';
import { coastStrip, type CoastStrip } from '@/lib/live-room/coast-strip';

/** Preview of the route coast strip (Oct 2026): Manila to Hanoi, the coast read at the plane's place on the route. */
const ROUTES = [
  { label: 'Kathmandu to Lhasa', from: { lat: 27.7172, lng: 85.324 }, to: { lat: 29.652, lng: 91.1721 } },
  { label: 'Zurich to Milan', from: { lat: 47.3769, lng: 8.5417 }, to: { lat: 45.4642, lng: 9.19 } },
  { label: 'Manila to Hanoi', from: { lat: 14.5995, lng: 120.9842 }, to: { lat: 21.0278, lng: 105.8342 } },
  { label: 'Tokyo to Seoul', from: { lat: 35.6762, lng: 139.6503 }, to: { lat: 37.5665, lng: 126.978 } },
  { label: 'Athens to Rome', from: { lat: 37.9838, lng: 23.7275 }, to: { lat: 41.9028, lng: 12.4964 } },
  { label: 'Cairo to Rome', from: { lat: 30.0444, lng: 31.2357 }, to: { lat: 41.9028, lng: 12.4964 } },
];

export function CoastStripGallery() {
  const [query, setQuery] = useState(() => new URLSearchParams());
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params);
    if (params.has('t')) setT(Math.max(0, Math.min(1, Number(params.get('t')) || 0)));
  }, []);
  useEffect(() => {
    const previous = realCoast(), previousTerrain = realTerrain();
    setRealTerrain(new URLSearchParams(window.location.search).get('terrain') !== 'off');
    // Preview-only coast override; restore the owner's class setting on exit.
    setRealCoast(new URLSearchParams(window.location.search).get('coast') !== 'off');
    return () => { setRealCoast(previous); setRealTerrain(previousTerrain); };
  }, []);
  const [ri, setRi] = useState(0);
  const route = ROUTES[ri];
  const [strip, setStrip] = useState<CoastStrip | null>(null);
  const [ground, setGround] = useState<HighGround | undefined>();
  const [t, setT] = useState(0.02);
  const groundT = Math.floor(t * 40) / 40;
  useEffect(() => {
    let stale = false;
    const at = greatCirclePoint(route.from, route.to, groundT);
    const next = greatCirclePoint(route.from, route.to, Math.min(1, groundT + 0.001));
    const rad = Math.PI / 180;
    const heading = Math.atan2(Math.sin((next.lng - at.lng) * rad) * Math.cos(next.lat * rad),
      Math.cos(at.lat * rad) * Math.sin(next.lat * rad) - Math.sin(at.lat * rad) * Math.cos(next.lat * rad) * Math.cos((next.lng - at.lng) * rad)) / rad;
    void highGroundAhead(at, heading).then(g => { if (!stale) setGround(g); });
    return () => { stale = true; };
  }, [route, groundT]);
  const [playing, setPlaying] = useState(false);
  const [minutes, setMinutes] = useState(3); // how long the fast-forward flight takes
  useEffect(() => {
    let stale = false; setStrip(null); setGround(undefined);
    void coastStrip(route.from, route.to).then(value => { if (!stale) setStrip(value); });
    return () => { stale = true; };
  }, [route]);
  const [clock, setClock] = useState<RouteClock>({ at: Date.now(), t, perMs: 0 });
  useEffect(() => { setClock({ at: Date.now(), t, perMs: playing ? 1 / (minutes * 60_000) : 0, km: strip?.routeKm }); }, [t, playing, minutes, strip]);
  // keep the slider in step while playing
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((x) => Math.min(1, x + 1000 / (minutes * 60_000))), 1000);
    return () => clearInterval(id);
  }, [playing, minutes]);
  const requestedTod = query.get('tod');
  const tod: TimeOfDay = requestedTod === 'dusk' || requestedTod === 'dawn' || requestedTod === 'night' ? requestedTod : 'day';
  const light = LIGHT_POS[tod];
  const alt = Math.max(0.2, Math.min(1, Number(query.get('alt') ?? '1') || 1));
  // Optional preview fixtures exercise the existing landmark/event art on an elevated surface.
  const demoKind = query.get('landmark');
  const demoLandmarks = useMemo<WorldLandmark[]>(() => ['fuji', 'everest', 'pyramids', 'volcano'].includes(demoKind ?? '') && strip
    ? [{ id: `surface-${demoKind}`, kind: demoKind as WorldLandmarkKind, ahead: 50, lateral: -12, along: strip.routeKm * 0.5 + 50 }] : [], [demoKind, strip]);
  const demoEvent = query.get('event');
  const demoEvents = useMemo<SceneEvent[]>(() => demoEvent === 'fire' || demoEvent === 'storm' || demoEvent === 'volcano'
    ? [{ id: `surface-${demoEvent}`, kind: demoEvent, ahead: 55, lateral: 12 }] : [], [demoEvent]);
  const dest = WORLD_DESTINATIONS.find((d) => d.scene)!;
  const palette = useMemo(() => composeTimedPalette(tod, dest.scene!), [tod, dest]);
  return (
    <div className="min-h-screen space-y-3 bg-[#070b14] p-4 text-white">
      <div className="flex flex-wrap items-center gap-1.5">
        <h1 className="mr-1 font-display text-xl">Coast strip</h1>
        {ROUTES.map((r, i) => <button key={r.label} type="button" aria-pressed={ri === i} onClick={() => { setRi(i); setT(0.02); }} className={`rounded-full border px-2 py-1 text-xs ${ri === i ? 'border-amber-300/70 text-amber-100' : 'border-white/15 text-white/70'}`}>{r.label}</button>)}
        <button type="button" onClick={() => setPlaying((p) => !p)} className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-[#1b2233]">{playing ? 'Pause' : `Fly (${minutes} min)`}</button>
        <select aria-label="Flight duration" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="rounded bg-slate-900 px-2 py-1 text-xs"><option value={1}>1 min</option><option value={3}>3 min</option><option value={10}>10 min</option></select>
        <span className="font-mono text-xs text-white/60">{strip ? `${Math.round(t * strip.routeKm)} of ${Math.round(strip.routeKm)} km · ${strip.land.length} land outlines` : 'working out the coast…'}</span>
      </div>
      <input type="range" min={0} max={1} step={0.002} value={t} onChange={(e) => setT(Number(e.target.value))} className="w-full" aria-label="Place on the route" />
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
        <CockpitSky palette={palette} timeOfDay={tod} altitude={alt} />
        <CockpitWorld altitude={alt} surfaceSun={{ x: parseFloat(light.x) / 100, y: parseFloat(light.y) / 100 }} terrain="farmland" region="Asia" palette={palette} night={tod === 'night'} speed={0.55} cloudCover={10} coastStrip={strip} routeClock={clock} highGround={ground} landmarks={demoLandmarks} events={demoEvents} />
      </div>
    </div>
  );
}

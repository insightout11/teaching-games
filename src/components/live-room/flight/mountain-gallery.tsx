'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CockpitSky } from '@/components/live-room/flight/cockpit-sky';
import { CockpitWorld } from '@/components/live-room/flight/cockpit-world';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { setPeakStyle } from '@/components/live-room/flight/peak-art';
import { setGroundRelief, setSoftEdges } from '@/components/live-room/flight/ground-texture';
import type { Terrain } from '@/components/live-room/flight/cockpit-ground';

const RANGES: Array<{ region: string; label: string }> = [
  { region: 'Europe', label: 'Alpine (Europe): snowy' },
  { region: 'Asia', label: 'Asia: mixed snow and forest' },
  { region: 'Africa', label: 'Arid (Africa): bare rock' },
];
const TIMES: TimeOfDay[] = ['day', 'dusk', 'night'];

function Cell({ region, tod, moving, terrain = 'mountains' }: { region: string; tod: TimeOfDay; moving: boolean; terrain?: Terrain }) {
  const dest = WORLD_DESTINATIONS.find((d) => d.scene) ?? WORLD_DESTINATIONS[0];
  const palette = useMemo(() => composeTimedPalette(tod, dest.scene!), [tod, dest]);
  // a still picture: draw for a moment, then stop drawing (so a page of pictures costs nothing)
  const [hold, setHold] = useState(false);
  useEffect(() => { if (moving) return; const t = setTimeout(() => setHold(true), 1500); return () => clearTimeout(t); }, [moving]);
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
      <CockpitSky palette={palette} timeOfDay={tod} altitude={1} />
      <CockpitWorld terrain={terrain} region={region} palette={palette} night={tod === 'night'} speed={moving ? 0.55 : 0.0001} paused={!moving && hold} />
    </div>
  );
}

/** Frames per second, measured over the last second (60 = smooth; under 40 = visibly jerky). */
function Fps() {
  const [fps, setFps] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    let frames = 0, t0 = performance.now();
    const tick = (t: number) => {
      frames++;
      if (t - t0 >= 1000) { setFps(Math.round((frames * 1000) / (t - t0))); frames = 0; t0 = t; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  return <span className={`rounded-full px-3 py-1 font-mono text-xs ${fps >= 50 ? 'bg-emerald-500/20 text-emerald-200' : fps >= 35 ? 'bg-amber-500/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'}`}>{fps} frames a second</span>;
}

/** Watch the ground change from one land type to the next (soft, patchy edges vs the old straight band). */
const EDGES: Array<[Terrain, Terrain, string]> = [['farmland', 'forest', 'Europe'], ['forest', 'farmland', 'Europe'], ['desert', 'savanna', 'Africa'], ['savanna', 'desert', 'Africa'], ['farmland', 'mountains', 'Europe'], ['grassland', 'farmland', 'Asia']];
function EdgeView({ from, to, region, soft }: { from: Terrain; to: Terrain; region: string; soft: boolean }) {
  const [terrain, setTerrain] = useState<Terrain>(from);
  useEffect(() => { setSoftEdges(soft); const t = setTimeout(() => setTerrain(to), 1500); return () => clearTimeout(t); }, [to, soft]);
  const dest = WORLD_DESTINATIONS.find((d) => d.scene) ?? WORLD_DESTINATIONS[0];
  const palette = useMemo(() => composeTimedPalette('day', dest.scene!), [dest]);
  return (
    <div className="min-h-screen bg-[#070b14] p-4 text-white">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <a href="?" className="text-sm text-cyan-200 underline">Back to all</a>
        <a href={`?edge=${from},${to}${soft ? '&hard=1' : ''}`} className="text-sm text-cyan-200 underline">Show {soft ? 'old (straight band)' : 'new (soft patches)'}</a>
        <Fps />
        <span className="font-mono text-xs text-white/60">{soft ? 'new' : 'old'} · {from} → {to} · reload to watch again</span>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
        <CockpitSky palette={palette} timeOfDay="day" altitude={1} />
        <CockpitWorld terrain={terrain} region={region} palette={palette} night={false} speed={0.55} />
      </div>
    </div>
  );
}

/** The mountains gallery: every kind of range at every time of day, with the real cockpit renderer. */
export function MountainGallery() {
  const [style, setStyle] = useState<'old' | 'new'>('new');
  const moving = false; // the grid shows stills; one view at a time flies (like the room)
  // ?one=Asia&tod=dusk shows a single view, large.
  const [one, setOne] = useState<{ region: string; tod: TimeOfDay; terrain: Terrain } | null>(null);
  const [edge, setEdge] = useState<{ from: Terrain; to: Terrain; region: string; soft: boolean } | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = q.get('style') === 'old' ? 'old' : 'new';
    setStyle(s);
    setPeakStyle(s);
    setGroundRelief(s === 'new' && q.get('hills') !== 'off');
    const e = q.get('edge')?.split(',');
    if (e?.length === 2) { const found = EDGES.find(([a, b]) => a === e[0] && b === e[1]); setEdge({ from: e[0] as Terrain, to: e[1] as Terrain, region: found?.[2] ?? 'Europe', soft: !q.has('hard') }); }
    const region = q.get('one');
    if (region) setOne({ region, tod: (TIMES.includes(q.get('tod') as TimeOfDay) ? q.get('tod') : 'day') as TimeOfDay, terrain: (q.get('ground') ?? 'mountains') as Terrain });
  }, []);
  if (edge) return <EdgeView key={`${edge.from}${edge.to}${edge.soft}`} {...edge} />;
  if (one) {
    return (
      <div className="min-h-screen bg-[#070b14] p-4">
        <div className="mb-2 flex flex-wrap items-center gap-3 text-white">
          <a href={`?style=${style}`} className="text-sm text-cyan-200 underline">Back to all</a>
          <a href={`?style=${style === 'old' ? 'new' : 'old'}&one=${one.region}&tod=${one.tod}&ground=${one.terrain}`} className="text-sm text-cyan-200 underline">Show {style === 'old' ? 'new' : 'old'}</a>
          <Fps />
          <span className="font-mono text-xs text-white/60">{style} · {one.terrain} · {one.region} · {one.tod}</span>
        </div>
        <Cell key={style} region={one.region} tod={one.tod} moving terrain={one.terrain} />
      </div>
    );
  }
  return (
    <div className="min-h-screen space-y-4 bg-[#070b14] p-5 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl">Mountains from the cockpit</h1>
        <span className="rounded-full border border-white/20 px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] text-amber-200">{style === 'old' ? 'Old peaks' : 'New peaks'}</span>
        <a href={style === 'old' ? '?style=new' : '?style=old'} className="text-sm text-cyan-200 underline">Show the {style === 'old' ? 'new' : 'old'} peaks</a>
        <span className="text-sm text-white/60">Click any picture to watch it fly, full size.</span>
      </div>
      <section>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">Watch the ground change (softer edges)</p>
        <div className="flex flex-wrap gap-2">
          {EDGES.map(([a, b]) => (
            <a key={`${a}${b}`} href={`?edge=${a},${b}`} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/85 hover:border-amber-300/60">{a} → {b}</a>
          ))}
        </div>
      </section>
      <section>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">The ground {style === 'new' ? 'with relief' : 'as before (flat)'}: farmland, forest, savanna, desert</p>
        <div className="grid gap-3 md:grid-cols-4">
          {([['farmland', 'Europe'], ['forest', 'Europe'], ['savanna', 'Africa'], ['desert', 'Africa']] as Array<[Terrain, string]>).map(([t, rg]) => (
            <a key={t} href={`?style=${style}&one=${rg}&tod=day&ground=${t}`} className="block">
              <Cell key={`${style}|${t}`} region={rg} tod="day" moving={moving} terrain={t} />
              <p className="mt-1 text-xs text-white/50">{t} · day</p>
            </a>
          ))}
        </div>
      </section>
      {RANGES.map((r) => (
        <section key={r.region}>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">{r.label}</p>
          <div className="grid gap-3 md:grid-cols-3">
            {TIMES.map((t) => (
              <a key={t} href={`?style=${style}&one=${r.region}&tod=${t}`} className="block">
                <Cell key={style} region={r.region} tod={t} moving={moving} />
                <p className="mt-1 text-xs text-white/50">{t}</p>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

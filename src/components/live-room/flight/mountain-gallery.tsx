'use client';

import { useEffect, useMemo, useState } from 'react';
import { CockpitSky } from '@/components/live-room/flight/cockpit-sky';
import { CockpitWorld } from '@/components/live-room/flight/cockpit-world';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { setPeakStyle } from '@/components/live-room/flight/peak-art';
import { setGroundRelief } from '@/components/live-room/flight/ground-texture';
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
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
      <CockpitSky palette={palette} timeOfDay={tod} altitude={1} />
      <CockpitWorld terrain={terrain} region={region} palette={palette} night={tod === 'night'} speed={moving ? 0.55 : 0.0001} />
    </div>
  );
}

/** The mountains gallery: every kind of range at every time of day, with the real cockpit renderer. */
export function MountainGallery() {
  const [style, setStyle] = useState<'old' | 'new'>('new');
  const [moving, setMoving] = useState(true);
  // ?one=Asia&tod=dusk shows a single view, large.
  const [one, setOne] = useState<{ region: string; tod: TimeOfDay; terrain: Terrain } | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = q.get('style') === 'old' ? 'old' : 'new';
    setStyle(s);
    setPeakStyle(s);
    setGroundRelief(s === 'new');
    const region = q.get('one');
    if (region) setOne({ region, tod: (TIMES.includes(q.get('tod') as TimeOfDay) ? q.get('tod') : 'day') as TimeOfDay, terrain: (q.get('ground') ?? 'mountains') as Terrain });
  }, []);
  if (one) {
    return (
      <div className="min-h-screen bg-[#070b14] p-4">
        <Cell key={style} region={one.region} tod={one.tod} moving={moving} terrain={one.terrain} />
        <p className="mt-2 font-mono text-xs text-white/60">{style} · {one.terrain} · {one.region} · {one.tod}</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen space-y-4 bg-[#070b14] p-5 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl">Mountains from the cockpit</h1>
        <span className="rounded-full border border-white/20 px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] text-amber-200">{style === 'old' ? 'Old peaks' : 'New peaks'}</span>
        <a href={style === 'old' ? '?style=new' : '?style=old'} className="text-sm text-cyan-200 underline">Show the {style === 'old' ? 'new' : 'old'} peaks</a>
        <button type="button" onClick={() => setMoving((m) => !m)} className="rounded-full border border-white/20 px-3 py-1 text-xs">{moving ? 'Pause' : 'Fly'}</button>
      </div>
      <section>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">The ground {style === 'new' ? 'with relief' : 'as before (flat)'}: farmland, forest, savanna, desert</p>
        <div className="grid gap-3 md:grid-cols-4">
          {([['farmland', 'Europe'], ['forest', 'Europe'], ['savanna', 'Africa'], ['desert', 'Africa']] as Array<[Terrain, string]>).map(([t, rg]) => (
            <div key={t}>
              <Cell key={`${style}|${moving}|${t}`} region={rg} tod="day" moving={moving} terrain={t} />
              <p className="mt-1 text-xs text-white/50">{t} · day</p>
            </div>
          ))}
        </div>
      </section>
      {RANGES.map((r) => (
        <section key={r.region}>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">{r.label}</p>
          <div className="grid gap-3 md:grid-cols-3">
            {TIMES.map((t) => (
              <div key={t}>
                <Cell key={`${style}|${moving}`} region={r.region} tod={t} moving={moving} />
                <p className="mt-1 text-xs text-white/50">{t}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

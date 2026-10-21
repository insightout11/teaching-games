'use client';

import { useMemo } from 'react';
import { CockpitSky } from '@/components/live-room/flight/cockpit-sky';
import { CockpitWorld } from '@/components/live-room/flight/cockpit-world';
import type { Terrain } from '@/components/live-room/flight/cockpit-ground';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

/** Hills in the colour of their ground (Oct 2026): desert, farmland, hill country and tundra, by day and at night. */
const ROWS: Array<{ terrain: Terrain; region: string; label: string }> = [
  { terrain: 'desert', region: 'Africa', label: 'Desert' },
  { terrain: 'farmland', region: 'Europe', label: 'Farmland' },
  { terrain: 'hills', region: 'Europe', label: 'Hill country' },
  { terrain: 'tundra', region: 'North America', label: 'Tundra' },
];
const TIMES: TimeOfDay[] = ['day', 'night'];

function Cell({ terrain, region, tod }: { terrain: Terrain; region: string; tod: TimeOfDay }) {
  const scene = (WORLD_DESTINATIONS.find((d) => d.scene) ?? WORLD_DESTINATIONS[0]).scene!;
  const palette = useMemo(() => composeTimedPalette(tod, scene), [tod, scene]);
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
      <CockpitSky palette={palette} timeOfDay={tod} altitude={1} />
      <CockpitWorld terrain={terrain} region={region} palette={palette} night={tod === 'night'} cloudCover={5} speed={0.15} />
    </div>
  );
}

export function HillsGallery() {
  return (
    <div className="min-h-screen space-y-4 bg-[#070b14] p-5 text-white">
      <h1 className="font-display text-2xl">Hills in the colour of their ground</h1>
      {ROWS.map((r) => (
        <section key={r.terrain}>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">{r.label}</p>
          <div className="grid gap-3 md:grid-cols-2">{TIMES.map((t) => <Cell key={t} terrain={r.terrain} region={r.region} tod={t} />)}</div>
        </section>
      ))}
    </div>
  );
}

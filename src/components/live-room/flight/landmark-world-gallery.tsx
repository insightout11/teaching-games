'use client';

import { useEffect, useMemo, useState } from 'react';
import { CockpitSky } from '@/components/live-room/flight/cockpit-sky';
import { CockpitWorld } from '@/components/live-room/flight/cockpit-world';
import type { Terrain } from '@/components/live-room/flight/cockpit-ground';
import type { WorldLandmark, WorldLandmarkKind } from '@/components/live-room/flight/world-landmarks';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

const SCENES: Array<{ kind: WorldLandmarkKind; label: string; terrain: Terrain; region: string; ahead: number; lateral: number }> = [
  { kind: 'fuji', label: 'Mount Fuji', terrain: 'farmland', region: 'Asia', ahead: 55, lateral: -14 },
  { kind: 'pyramids', label: 'The Pyramids of Giza', terrain: 'desert', region: 'Africa', ahead: 34, lateral: 1.5 },
  { kind: 'everest', label: 'Mount Everest', terrain: 'mountains', region: 'Asia', ahead: 40, lateral: -6 },
  { kind: 'matterhorn', label: 'The Matterhorn', terrain: 'mountains', region: 'Europe', ahead: 34, lateral: 5 },
  { kind: 'kilimanjaro', label: 'Mount Kilimanjaro', terrain: 'savanna', region: 'Africa', ahead: 48, lateral: -10 },
  { kind: 'volcano', label: 'A volcano (shared shape): Mount Etna', terrain: 'farmland', region: 'Europe', ahead: 40, lateral: 7 },
  { kind: 'niagara', label: 'Niagara Falls', terrain: 'farmland', region: 'North America', ahead: 30, lateral: 7 },
];
const TIMES: TimeOfDay[] = ['day', 'dusk', 'night'];
/** ?ahead=60 places the landmark that many km ahead (for the render script's far and near pictures). */
const aheadParam = () => { if (typeof window === 'undefined') return null; const v = Number(new URLSearchParams(window.location.search).get('ahead')); return v > 0 ? v : null; };

function Cell({ scene, tod, moving }: { scene: (typeof SCENES)[number]; tod: TimeOfDay; moving: boolean }) {
  const dest = WORLD_DESTINATIONS.find((d) => d.scene) ?? WORLD_DESTINATIONS[0];
  const palette = useMemo(() => composeTimedPalette(tod, dest.scene!), [tod, dest]);
  const landmarks = useMemo<WorldLandmark[]>(() => [{ id: scene.kind, kind: scene.kind, ahead: aheadParam() ?? (moving && !(typeof window !== 'undefined' && window.location.search.includes('near')) ? 140 : scene.ahead), lateral: scene.lateral }], [scene, moving]); // flying: starts at the far edge
  // a still: draw for a moment, then stop drawing
  const [hold, setHold] = useState(false);
  useEffect(() => { if (moving) return; const t = setTimeout(() => setHold(true), 1500); return () => clearTimeout(t); }, [moving]);
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
      <CockpitSky palette={palette} timeOfDay={tod} altitude={1} />
      <CockpitWorld terrain={scene.terrain} region={scene.region} palette={palette} night={tod === 'night'} speed={moving ? (typeof window !== 'undefined' && window.location.search.includes('freeze') ? 0.0001 : typeof window !== 'undefined' && window.location.search.includes('near') ? 0.06 : 0.55) : 0.0001} paused={!moving && hold} landmarks={landmarks} />
    </div>
  );
}

/** Landmarks in the passing scenery: each at day, dusk and night, with the real cockpit renderer. Click one to fly past it. */
export function LandmarkWorldGallery() {
  const [one, setOne] = useState<{ kind: WorldLandmarkKind; tod: TimeOfDay; still: boolean } | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const k = q.get('one') as WorldLandmarkKind | null;
    if (k && SCENES.some((s) => s.kind === k)) setOne({ kind: k, tod: (TIMES.includes(q.get('tod') as TimeOfDay) ? q.get('tod') : 'day') as TimeOfDay, still: q.has('still') });
  }, []);
  if (one) {
    const scene = SCENES.find((s) => s.kind === one.kind)!;
    return (
      <div className="min-h-screen bg-[#070b14] p-4 text-white">
        <div className="mb-2 flex items-center gap-3">
          <a href="?" className="text-sm text-cyan-200 underline">Back to all</a>
          <span className="font-mono text-xs text-white/60">{scene.label} · {one.tod} · flying past (reload to start again)</span>
        </div>
        <Cell scene={scene} tod={one.tod} moving={!one.still} />
      </div>
    );
  }
  return (
    <div className="min-h-screen space-y-4 bg-[#070b14] p-5 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl">Landmarks in the scenery</h1>
        <span className="text-sm text-white/60">Click any picture to fly past it, full size.</span>
      </div>
      {SCENES.map((sc) => (
        <section key={sc.kind}>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-white/60">{sc.label}</p>
          <div className="grid gap-3 md:grid-cols-3">
            {TIMES.map((t) => (
              <a key={t} href={`?one=${sc.kind}&tod=${t}`} className="block">
                <Cell scene={sc} tod={t} moving={false} />
                <p className="mt-1 text-xs text-white/50">{t}</p>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

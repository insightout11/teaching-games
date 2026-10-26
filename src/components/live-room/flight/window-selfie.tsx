'use client';

import { useEffect, useMemo, useState } from 'react';
import { CockpitSky, LIGHT_POS } from '@/components/live-room/flight/cockpit-sky';
import { CockpitWorld } from '@/components/live-room/flight/cockpit-world';
import type { Terrain } from '@/components/live-room/flight/cockpit-ground';
import type { WorldLandmarkKind } from '@/components/live-room/flight/world-landmarks';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import type { CrewExpression } from '@/components/ui/crew-character';
import { MascotFigure } from '@/components/ui/mascot-figure';
import type { MascotLook } from '@/lib/mascot';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { realTerrain } from '@/components/live-room/flight/ground-texture';
import { selfieTerrainRoute } from '@/lib/live-room/terrain-landmarks';
import { coastStrip, type CoastStrip } from '@/lib/live-room/coast-strip';
import type { RouteClock } from '@/components/live-room/flight/cockpit-world';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

/**
 * The window selfie (approved by the owner 21 Oct 2026, layout A): the side view out of the passenger window (the real
 * scenery with the landmark), a wing in view, and the student's crew avatar in the seat, as a print with a caption.
 * Scenery and avatar only: never a camera photo of the child.
 */

const TIMES: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];
const asTime = (t: string): TimeOfDay => (TIMES.includes(t as TimeOfDay) ? (t as TimeOfDay) : 'day');

function WindowView({ kind, landmarkId, terrain, region, tod }: { landmarkId?: string; kind: WorldLandmarkKind; terrain: Terrain; region: string | null; tod: TimeOfDay }) {
  const scene = (WORLD_DESTINATIONS.find((d) => d.scene) ?? WORLD_DESTINATIONS[0]).scene!;
  const palette = useMemo(() => composeTimedPalette(tod, scene), [tod, scene]);
  const route = useMemo(() => realTerrain() ? selfieTerrainRoute(kind, landmarkId) : null, [kind, landmarkId]);
  const [strip, setStrip] = useState<CoastStrip | null>(null);
  useEffect(() => {
    setStrip(null); if (!route) return;
    let stale = false;
    void coastStrip(route.from, route.to).then(s => { if (!stale) setStrip(s); }).catch(() => {});
    return () => { stale = true; };
  }, [route]);
  const clock = useMemo<RouteClock | null>(() => strip ? { at: Date.now(), t: Math.max(0, 0.5 - 20 / strip.routeKm), perMs: 0, km: strip.routeKm, hold: true } : null, [strip]);
  const light = LIGHT_POS[tod];
  const landmarks = useMemo(() => [{ id: route?.id ?? 'selfie', kind, ahead: 20, lateral: route ? 0 : 1.5, ...(strip ? { along: strip.routeKm * 0.5 } : {}) }], [kind, route, strip]);
  return (
    <div className="absolute inset-x-0" style={{ top: '-38%', height: '138%' }}>
      {/* looking down and out: the horizon sits high in a passenger window */}
      <CockpitSky palette={palette} timeOfDay={tod} altitude={0.85} />
      <CockpitWorld surfaceSun={{ x: parseFloat(light.x) / 100, y: parseFloat(light.y) / 100 }} terrain={terrain} region={region} palette={palette} night={tod === 'night'} speed={0.0001} altitude={0.85} cloudCover={5} coastStrip={strip} routeClock={clock} landmarks={landmarks} />
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[42%] w-full" aria-hidden>
        <defs><linearGradient id="selfie-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9eef4" /><stop offset="1" stopColor="#9aa7b6" /></linearGradient></defs>
        <path d="M0 38 L74 50 L80 47 L86 50 L84 53 L0 60 Z" fill="url(#selfie-wing)" />
        <path d="M0 44 L70 51" stroke="#7c8899" strokeWidth="0.5" />
        <path d="M80 47 L83 39 L86 40 L86 50 Z" fill="#c9d3de" />
      </svg>
    </div>
  );
}

export function WindowSelfieCard({ kind, landmarkId, terrain, region, timeOfDay, seed, name, title, caption, expression, mascot }: { landmarkId?: string; kind: WorldLandmarkKind; terrain: string; region: string | null; timeOfDay: string; seed: string | null; name: string; title: string; caption: string; expression?: CrewExpression; mascot?: { name: string; look: MascotLook } | null }) {
  const tod = asTime(timeOfDay);
  return (
    <div className="w-[284px] rounded-sm bg-white p-2 pb-3 text-[#1b2233] shadow-xl">
      <div className="relative h-[300px] overflow-hidden" style={{ background: 'linear-gradient(180deg,#e7e2d8,#cfc8bb)' }}>
        <div className="absolute left-[106px] top-5 h-[220px] w-[160px] rounded-[46%/38%] bg-[#d9dde3] p-[7%] shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)]">
          <div className="relative h-full w-full overflow-hidden rounded-[46%/38%] shadow-[inset_0_0_24px_rgba(0,0,0,0.55)]">
            <WindowView kind={kind} landmarkId={landmarkId} terrain={terrain as Terrain} region={region} tod={tod} />
            <div className="pointer-events-none absolute inset-0 rounded-[46%/38%] bg-[linear-gradient(130deg,rgba(255,255,255,0.18),transparent_40%)]" />
          </div>
        </div>
        <div className="absolute -left-6 bottom-[-14px]"><CrewAvatar seed={seed ?? name} name={name} size={170} expression={expression} /></div>
        {/* the class mascot squeezes into the photo, in front of the window */}
        {mascot && <div className="absolute -right-4 bottom-[-10px]"><MascotFigure look={mascot.look} size={136} title={mascot.name} /></div>}
      </div>
      <p className="mt-2 font-display text-lg leading-tight">{title}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#1b2233]/55">{caption}</p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Check, LoaderCircle, Mountain } from 'lucide-react';
import type { CoastStrip } from '@/lib/live-room/coast-strip';
import { flightSurface } from '@/lib/live-room/flight-surface';
import { realTerrain } from '@/components/live-room/flight/ground-texture';

export type SceneryState = 'loading' | 'ready' | 'basic';
type State = SceneryState;

/**
 * Boarding: whether the route's detailed scenery (real mountains) has downloaded. It reads the same shared load the
 * flight uses (no second download). Taking off earlier is fine: the old scenery shows until the terrain fades in.
 */
/** The route's scenery state for boarding UI (shared load, no second download). */
export function useSceneryState(coastStrip: CoastStrip | null): State | null {
  const [state, setState] = useState<State>('loading');
  useEffect(() => {
    setState('loading');
    if (!coastStrip || !realTerrain()) return;
    let live = true;
    void flightSurface(coastStrip).then((grid) => { if (live) setState(grid ? 'ready' : 'basic'); });
    return () => { live = false; };
  }, [coastStrip]);
  return realTerrain() ? state : null;
}

export function SceneryStatus({ coastStrip }: { coastStrip: CoastStrip | null }) {
  const state = useSceneryState(coastStrip);
  if (!state) return null;
  const { icon, text } = state === 'ready'
    ? { icon: <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden />, text: 'Scenery ready' }
    : state === 'basic'
      ? { icon: <Mountain className="h-3.5 w-3.5" aria-hidden />, text: 'Basic scenery' }
      : { icon: <LoaderCircle className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden />, text: 'Preparing scenery…' };
  return (
    <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-white/60">
      {icon}
      {text}
    </p>
  );
}

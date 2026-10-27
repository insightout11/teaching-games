'use client';

import { useEffect, useState } from 'react';
import { Eye, Plane } from 'lucide-react';
import { PassengerView } from '@/components/live-room/flight/window-selfie';
import type { Terrain } from '@/components/live-room/flight/cockpit-ground';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import type { FlightNow } from '@/lib/live-room/window-view';

const TIMES: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];
/** The window draws for a moment, then rests: a slow living view that spares the phone's battery. */
const DRAW_MS = 2500;
const REST_MS = 25000;

/** Which side of the plane a seat is on: A-C on the left, D-F on the right (no seat yet: the left). */
export function seatSide(seat: string | null): 'left' | 'right' {
  const letter = seat?.match(/[A-F]/i)?.[0]?.toUpperCase();
  return letter && 'DEF'.includes(letter) ? 'right' : 'left';
}

/**
 * The phone when nothing is asked (Oct 2026, owner): the student's own passenger window, on their side of the plane.
 * The real ground and sky below the plane, refreshed slowly; a landmark shows on the phones on its side, and the others
 * are told it is on the other side.
 */
export function PhoneWindow({ flight, seat }: { flight: FlightNow; seat: string | null }) {
  const side = seatSide(seat);
  const lm = flight.landmark;
  const mine = !!lm && lm.side === side;
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (mine) { setPaused(false); return; }
    let t: number;
    const cycle = (drawing: boolean) => { setPaused(!drawing); t = window.setTimeout(() => cycle(!drawing), drawing ? DRAW_MS : REST_MS); };
    cycle(true);
    return () => window.clearTimeout(t);
  }, [mine, flight.terrain, flight.region]);
  const tod = TIMES.includes(flight.timeOfDay as TimeOfDay) ? flight.timeOfDay as TimeOfDay : 'day';
  return (
    <div className="space-y-2">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[300px] rounded-[44%/34%] bg-[#d9dde3] p-[10px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)]">
        <div className="relative h-full w-full overflow-hidden rounded-[44%/34%] shadow-[inset_0_0_28px_rgba(0,0,0,0.55)]">
          <PassengerView kind={lm?.kind ?? 'volcano'} landmarkId={mine ? lm!.id : undefined} terrain={flight.terrain as Terrain} region={flight.region} tod={tod} paused={paused} showLandmark={mine} />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.16),transparent_40%)]" />
        </div>
      </div>
      {lm ? (
        <p className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-center text-sm font-semibold ${mine ? 'animate-pulse bg-amber-300 text-slate-950' : 'bg-white/10 text-white/80'}`}>
          <Eye className="h-4 w-4" /> {mine ? `${lm.name}: it's on your side, look!` : `${lm.name} is on the other side of the plane`}
        </p>
      ) : (
        <p className="text-center text-sm text-white/70">{flight.below ? `Below us: ${flight.below}` : 'Looking out of the window'}</p>
      )}
      <p className="flex items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white/50">
        <Plane className="h-3.5 w-3.5" /> {flight.from} to {flight.to}{flight.minutesLeft != null ? ` · ${flight.minutesLeft} min` : ''} · {side} window
      </p>
    </div>
  );
}

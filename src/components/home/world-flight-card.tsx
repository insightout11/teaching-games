'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Stamp } from 'lucide-react';
import { FLAP_FONT } from '@/components/ui/split-flap';
import type { BoardSummary } from '@/lib/home-board';

// Home's World Flight card: a window onto the city the class is heading for, drawn with the real arrival-scene
// engine (the same art the lesson lands in). Loaded after the page so the board appears first.
const DestinationArrivalScene = dynamic(
  () => import('@/components/world-flight/arrival-scene/destination-arrival-scene').then((m) => m.DestinationArrivalScene),
  { ssr: false },
);

export function WorldFlightCard({ journey, showcase }: { journey: BoardSummary['journey']; showcase: BoardSummary['showcase'] }) {
  const view = journey ?? showcase;
  return (
    <Link
      href="/world-flight"
      className="group relative flex min-h-[280px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.09] bg-[#03101f] hover:border-cyan-300/40"
    >
      <div className="absolute inset-0 transition-transform duration-[4000ms] ease-out group-hover:scale-[1.04]" aria-hidden>
        <DestinationArrivalScene
          destinationId={view.destinationId}
          scene={view.scene}
          phase="touchdown"
          progress={0.34}
          motion="static"
          className="h-full w-full"
        />
      </div>
      {/* Readable text over the art: dark at the top-left and along the bottom. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030a14]/85 via-transparent to-[#030a14]/90" aria-hidden />
      <div className="relative p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>World Flight</p>
        <h2 className="mt-1 font-display text-3xl text-white drop-shadow">
          {journey ? <>Next stop: <em className="text-amber-300">{journey.city}</em></> : <>Fly your class <em className="text-amber-300">around the world</em></>}
        </h2>
      </div>
      <div className="relative flex flex-wrap items-end justify-between gap-3 p-5">
        <div className="min-w-0">
          {journey ? (
            <>
              <p className="text-sm font-semibold text-white">{journey.className} · {journey.city}, {journey.country}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
                <Stamp className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                {journey.stamps} {journey.stamps === 1 ? 'city stamped' : 'cities stamped'} so far
              </p>
            </>
          ) : (
            <p className="max-w-sm text-sm text-white/80">One city per lesson: its streets, its food, its stories. Start in {view.city}.</p>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur group-hover:bg-white/20">
          Open the map <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

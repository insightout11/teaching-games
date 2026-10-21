'use client';

import { useMemo, useState } from 'react';
import { Camera } from 'lucide-react';
import { CockpitSky } from '@/components/live-room/flight/cockpit-sky';
import { CockpitWorld } from '@/components/live-room/flight/cockpit-world';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { WindowSelfieCard } from '@/components/live-room/flight/window-selfie';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { WorldLandmark } from '@/components/live-room/flight/world-landmarks';

/**
 * Window selfie design (Oct 2026, for the owner): on each phone, the student's own souvenir. The side view out of the
 * passenger window (the real scenery, still), a wing in view, and the student's crew avatar in the seat. Scenery and
 * avatar only: never a camera photo of the child.
 */

const LANDMARK: WorldLandmark[] = [{ id: 'pyramids', kind: 'pyramids', ahead: 20, lateral: 1.5 }];

/** The view out of the window: the real sky and scenery renderer, drawn once and held still. */
function WindowView({ tod }: { tod: TimeOfDay }) {
  const dest = WORLD_DESTINATIONS.find((d) => d.id === 'cairo')?.scene ? WORLD_DESTINATIONS.find((d) => d.id === 'cairo')! : WORLD_DESTINATIONS.find((d) => d.scene)!;
  const palette = useMemo(() => composeTimedPalette(tod, dest.scene!), [tod, dest]);
  return (
    <div className="absolute inset-x-0" style={{ top: '-38%', height: '138%' }}>
      {/* looking down and out: the horizon sits high in a passenger window */}
      <CockpitSky palette={palette} timeOfDay={tod} altitude={0.85} />
      <CockpitWorld terrain="desert" region="Africa" palette={palette} night={tod === 'night'} speed={0.0001} altitude={0.85} cloudCover={5} landmarks={LANDMARK} />
      {/* the wing, reaching out from the lower left */}
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[42%] w-full" aria-hidden>
        <defs><linearGradient id="wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9eef4" /><stop offset="1" stopColor="#9aa7b6" /></linearGradient></defs>
        <path d="M0 38 L74 50 L80 47 L86 50 L84 53 L0 60 Z" fill="url(#wing)" />
        <path d="M0 44 L70 51" stroke="#7c8899" strokeWidth="0.5" />
        <path d="M80 47 L83 39 L86 40 L86 50 Z" fill="#c9d3de" />
      </svg>
    </div>
  );
}

/** The cabin window: rounded, with its thick frame and a soft inner shadow. */
function CabinWindow({ tod, className = '' }: { tod: TimeOfDay; className?: string }) {
  return (
    <div className={`relative rounded-[46%/38%] bg-[#d9dde3] p-[7%] shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-[46%/38%] shadow-[inset_0_0_24px_rgba(0,0,0,0.55)]">
        <WindowView tod={tod} />
        <div className="pointer-events-none absolute inset-0 rounded-[46%/38%] bg-[linear-gradient(130deg,rgba(255,255,255,0.18),transparent_40%)]" />
      </div>
    </div>
  );
}

/** A: the avatar in the seat beside the window, selfie angle; caption below like a print. */
function SelfieA({ tod }: { tod: TimeOfDay }) {
  return (
    <div className="w-[300px] rounded-[2rem] bg-[#0b1220] p-3">
      <div className="rounded-sm bg-white p-2 pb-3 text-[#1b2233] shadow-xl">
        <div className="relative h-[300px] overflow-hidden" style={{ background: 'linear-gradient(180deg,#e7e2d8,#cfc8bb)' }}>
          <CabinWindow tod={tod} className="absolute left-[112px] top-5 h-[220px] w-[160px]" />
          <div className="absolute -left-6 bottom-[-14px]"><CrewAvatar seed="mai-demo" name="Mai" size={170} /></div>
        </div>
        <p className="mt-2 font-display text-lg leading-tight">Over the Pyramids of Giza</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#1b2233]/55">Cairo to Istanbul · 21 Oct · seat 14A</p>
      </div>
      <button type="button" className="mx-auto mt-3 flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-sm font-bold text-[#1b2233]"><Camera className="h-4 w-4" /> Take my window selfie</button>
    </div>
  );
}

/** B: the window fills the picture, the avatar small in the corner, like leaning into the window. */
function SelfieB({ tod }: { tod: TimeOfDay }) {
  return (
    <div className="w-[300px] rounded-[2rem] bg-[#0b1220] p-3">
      <div className="relative overflow-hidden rounded-2xl bg-[#d9dde3] p-4">
        <CabinWindow tod={tod} className="mx-auto h-[300px] w-[230px]" />
        <div className="absolute bottom-2 right-2"><CrewAvatar seed="mai-demo" name="Mai" size={110} /></div>
        <span className="absolute left-3 top-3 rounded-full bg-[#1b2233] px-2 py-0.5 font-mono text-[10px] text-white">14A</span>
      </div>
      <p className="mt-2 text-center font-display text-lg text-white">Over the Pyramids of Giza</p>
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Cairo to Istanbul · 21 Oct</p>
    </div>
  );
}

export function WindowSelfieGallery() {
  const [tod, setTod] = useState<TimeOfDay>('day');
  return (
    <div className="min-h-screen space-y-4 bg-[#070b14] p-5 text-white">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-3 font-display text-2xl">Window selfie (phone)</h1>
        {(['day', 'dusk', 'night'] as TimeOfDay[]).map((x) => <button key={x} type="button" onClick={() => setTod(x)} className={`rounded-full border px-3 py-1 text-xs ${tod === x ? 'border-amber-300/70 text-amber-100' : 'border-white/15 text-white/70'}`}>{x}</button>)}
      </div>
      <div className="flex flex-wrap gap-8">
        <div><p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-white/55">A · in my seat, a print</p><SelfieA tod={tod} /></div>
        <div><p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-white/55">B · leaning into the window</p><SelfieB tod={tod} /></div>
        <div><p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-white/55">Built (what phones show)</p><WindowSelfieCard kind="fuji" terrain="farmland" region="Asia" timeOfDay={tod} seed="ken-demo" name="Ken" title="Over Mount Fuji" caption="Tokyo to Shanghai · 21 Oct · seat 3C" /></div>
      </div>
    </div>
  );
}

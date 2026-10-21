'use client';

import { useState } from 'react';
import { WindscreenFlight } from '@/components/live-room/flight/windscreen-flight';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

/** Take-off preview: the real windscreen, leaving Cairo; the climb through the clouds, then the pyramids, slowly. */
export function TakeoffGallery() {
  const cairo = WORLD_DESTINATIONS.find((d) => d.id === 'cairo')!;
  const istanbul = WORLD_DESTINATIONS.find((d) => d.id === 'istanbul') ?? WORLD_DESTINATIONS.find((d) => d.scene && d.id !== 'cairo')!;
  const [run, setRun] = useState(0);
  const [stage, setStage] = useState<'gate' | 'flying'>('gate');
  const [tod, setTod] = useState<TimeOfDay>('day');
  const [cover, setCover] = useState(70);
  return (
    <div className="min-h-screen space-y-3 bg-[#070b14] p-4 text-white">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-3 font-display text-2xl">Take-off from Cairo</h1>
        <button type="button" onClick={() => { setStage('gate'); setRun((n) => n + 1); setTimeout(() => setStage('flying'), 300); }} className="rounded-full bg-amber-300 px-4 py-1.5 text-sm font-semibold text-[#1b2233]">Take off</button>
        {(['day', 'dusk', 'night'] as TimeOfDay[]).map((x) => <button key={x} type="button" onClick={() => setTod(x)} className={`rounded-full border px-3 py-1 text-xs ${tod === x ? 'border-amber-300/70 text-amber-100' : 'border-white/15 text-white/70'}`}>{x}</button>)}
        {[20, 70].map((c) => <button key={c} type="button" onClick={() => setCover(c)} className={`rounded-full border px-3 py-1 text-xs ${cover === c ? 'border-amber-300/70 text-amber-100' : 'border-white/15 text-white/70'}`}>clouds {c}%</button>)}
      </div>
      <div key={run} className="relative aspect-[16/9] overflow-hidden rounded-xl bg-black">
        <WindscreenFlight stage={stage} origin={cairo} destination={istanbul} timeOfDay={tod} terrain="desert" region="Africa" cloudCover={cover} weather={cover > 50 ? 'overcast' : 'clear'}
          scenicLandmark={{ id: 'pyramids', kind: 'pyramids', name: 'the Pyramids of Giza', side: 'right' }} />
      </div>
    </div>
  );
}

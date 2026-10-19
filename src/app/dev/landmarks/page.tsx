'use client';

import { useEffect, useState } from 'react';
import { DRAWN_LANDMARKS, LandmarkView } from '@/components/live-room/flight/landmark-art';

// Dev-only: every drawn landmark (Phase 3.4), plus a right-side window and a cloudy-day camera switch.
export default function LandmarksPreview() {
  // ?only=everest shows just the matching landmark(s), large (read after mount: no hydration mismatch).
  const [only, setOnly] = useState('');
  useEffect(() => { setOnly(new URLSearchParams(window.location.search).get('only')?.toLowerCase() ?? ''); }, []);
  if (process.env.NODE_ENV === 'production') return null;
  return (
    <div className="min-h-screen bg-[#070b14] p-6 text-white">
      <div className={`grid max-w-[1400px] gap-6 ${only ? "" : "lg:grid-cols-2"}`}>
        {DRAWN_LANDMARKS.filter((l) => !only || l.name.toLowerCase().includes(only)).map((l) => (
          <section key={l.name}>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-300">{l.view} view · {l.name}</p>
            <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl"><LandmarkView name={l.name} /></div>
          </section>
        ))}
        <section>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-300">right window · Mount Fuji</p>
          <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl"><LandmarkView name="Mount Fuji" side="right" /></div>
        </section>
        <section>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-300">cloudy day · the Matterhorn</p>
          <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl"><LandmarkView name="the Matterhorn" cloudy /></div>
        </section>
      </div>
    </div>
  );
}

'use client';

import { MatterhornSideView, PyramidsCameraView } from '@/components/live-room/flight/landmark-art';

// Dev-only: the first two landmark drawings for the owner's approval (Phase 3.4).
export default function LandmarksPreview() {
  if (process.env.NODE_ENV === 'production') return null;
  return (
    <div className="min-h-screen space-y-8 bg-[#070b14] p-6 text-white">
      <section>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-300">Side view · the Matterhorn</p>
        <div className="aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-2xl"><MatterhornSideView /></div>
      </section>
      <section>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-amber-300">Camera view · the Pyramids of Giza</p>
        <div className="aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-2xl"><PyramidsCameraView /></div>
      </section>
    </div>
  );
}

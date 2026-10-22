'use client';

import { useEffect, useState } from 'react';

/** How long a pass takes to cross the window (a real pass is a few minutes horizon to horizon). */
export const ISS_PASS_MS = 200_000;

/**
 * The International Space Station passing over the windscreen (Oct 2026): a bright, steady point gliding in an arc
 * across the sky, rising from the side it is on and fading at both ends, as it looks from the ground. No blinking:
 * that is how you tell it from a plane.
 */
export function IssPass({ start, side }: { start: number; side: 'left' | 'right' }) {
  const [t, setT] = useState(() => (Date.now() - start) / ISS_PASS_MS);
  useEffect(() => {
    let raf = 0;
    const tick = () => { setT((Date.now() - start) / ISS_PASS_MS); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start]);
  if (t < 0 || t > 1) return null;
  const x = side === 'left' ? 6 + 88 * t : 94 - 88 * t;
  // low across the sky (above the horizon, below where cards open), as a real pass looks from a plane window
  const y = 50 - 14 * Math.sin(Math.PI * t);
  const fade = Math.min(1, t * 7, (1 - t) * 7);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* a bright point, with a soft ring and a small label so the class can find it (a 5 px dot was lost on Zoom) */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%`, opacity: fade }}>
        <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-100/50" />
        <div className="h-[8px] w-[8px] rounded-full bg-white" style={{ boxShadow: '0 0 8px 3px rgba(255,255,255,0.8), 0 0 22px 8px rgba(200,220,255,0.35)' }} />
        <span className="absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/60 px-1.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-sky-100">ISS</span>
      </div>
    </div>
  );
}

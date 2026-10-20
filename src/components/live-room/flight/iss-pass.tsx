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
  const y = 48 - 36 * Math.sin(Math.PI * t);
  const fade = Math.min(1, t * 7, (1 - t) * 7);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{ left: `${x}%`, top: `${y}%`, opacity: fade * (0.75 + 0.25 * Math.sin(Math.PI * t)), boxShadow: '0 0 6px 2px rgba(255,255,255,0.75), 0 0 16px 6px rgba(200,220,255,0.3)' }}
      />
    </div>
  );
}

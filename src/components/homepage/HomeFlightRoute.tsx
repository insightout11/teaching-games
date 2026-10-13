'use client';

// The home page as one flight: a route down the right-hand margin. The class plane follows the scroll, and each
// city's passport stamp lands as it is passed. It sits behind the content, in the margin beside it, so it only
// appears on screens wide enough to have that margin. Decorative: hidden from assistive technology, and still
// (plane parked at the first city) when the visitor prefers reduced motion.

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';
import { getPlaneAsset } from '@/lib/plane-progression';

const STOPS = ['London', 'Paris', 'Madrid', 'Rome', 'Istanbul', 'Cairo'];
const FIRST = 14; // % down the screen of the first stop
const GAP = 14.5;
const stopAt = (i: number) => FIRST + i * GAP;

export function HomeFlightRoute() {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const compute = () => {
      const doc = document.scrollingElement || document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, (doc.scrollTop || window.scrollY) / max) : 0);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(compute); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    compute();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [reduce]);

  const y = reduce ? stopAt(0) : stopAt(0) - 4 + progress * (stopAt(STOPS.length - 1) - stopAt(0) + 8);
  const plane = getPlaneAsset('scout-monoplane');

  return (
    <div aria-hidden className="pointer-events-none fixed bottom-0 right-3 top-0 z-[3] hidden w-[120px] min-[1500px]:block">
      <div className="absolute bottom-0 left-[59px] top-0 border-l-[3px] border-dashed border-amber-300/35" />
      <div className="absolute left-[59px] top-0 border-l-[3px] border-emerald-300/80" style={{ height: `${y}%` }} />
      {STOPS.map((city, i) => {
        const passed = y >= stopAt(i) - 0.5;
        return (
          <div key={city} className="absolute left-0 flex w-[120px] -translate-y-1/2 flex-col items-center gap-1" style={{ top: `${stopAt(i)}%` }}>
            <span className={`h-4 w-4 rounded-full border-[3px] border-[#070B14] ${passed ? 'bg-emerald-300' : 'bg-[#56688a]'}`} />
            <span
              className={`rounded-lg border-[2.5px] border-[#d4537e] bg-[#070B14] px-2 py-0.5 font-instrument text-sm font-semibold uppercase tracking-wider text-[#f3a9c2] transition-all duration-300 ${passed ? '-rotate-6 scale-100 opacity-100' : '-rotate-6 scale-50 opacity-0'}`}
            >
              {city}
            </span>
          </div>
        );
      })}
      <div className="absolute left-[6px] w-[108px] -translate-y-1/2" style={{ top: `${y}%` }}>
        <Image src={plane.png} alt="" width={216} height={108} className="h-auto w-full rotate-90 drop-shadow-[0_6px_12px_rgba(0,0,0,.65)]" />
      </div>
    </div>
  );
}

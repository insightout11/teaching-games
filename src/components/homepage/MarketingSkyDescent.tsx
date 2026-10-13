'use client';

// Scroll-driven flight descent for the logged-out marketing pages — the same sky system
// the teacher Home uses, so the front door "fits with the rest". As you scroll the page
// you descend: top = high cruise (clouds drift past, parallax altitude), middle warms to
// golden, and the destination airport (skyline + runway + edge lights) rises into view at
// the bottom, right under the Test Flight CTA. Full-bleed (no sidebar offset).
//
// Mirrors src/components/discovery/TeacherHomeClient.tsx's descent math intentionally.

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SkyBackground } from '@/components/ui/sky-background';

const DAY_CLOUDS = [
  { top: '9%', left: '4%', w: 320, o: 0.5, drift: 30 },
  { top: '20%', left: '70%', w: 420, o: 0.6, drift: 70 },
  { top: '56%', left: '-4%', w: 360, o: 0.45, drift: 50 },
  { top: '70%', left: '74%', w: 300, o: 0.5, drift: 40 },
  { top: '84%', left: '36%', w: 460, o: 0.55, drift: 90 },
];

export function MarketingSkyDescent() {
  const reduce = useReducedMotion();
  const [depth, setDepth] = useState(0); // 0 = top of page (cruise) → 1 = bottom (airport)

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const compute = () => {
      const doc = document.scrollingElement || document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const top = doc.scrollTop || window.scrollY;
      setDepth(max > 0 ? Math.min(1, top / max) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    compute();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  // DESCENT narrative (same shape as Teacher Home): ground fades in low, weather warms
  // cruise → golden → night, altitude parallax slides the airport up into view.
  const earthOpacity = reduce ? 0 : Math.max(0, Math.min(1, (depth - 0.3) / 0.22));
  const skyEarthState: 'flight' | 'takeoff' = reduce || depth < 0.32 ? 'flight' : 'takeoff';
  const skyPhase: 'idle' | 'cruising' | 'golden' =
    reduce ? 'cruising' : depth < 0.42 ? 'cruising' : depth < 0.7 ? 'golden' : 'idle';
  const skyAltitude = reduce ? 0.85 : (1 - depth) * 0.85;

  // Veil darkens as we descend so lower sections stay legible while the hero sky stays vivid.
  // (Oct 2026: lighter than before, so the day-to-night sky and its clouds read behind the page.)
  const veilOpacity = 0.16 + depth * 0.5;

  return (
    <>
      <SkyBackground
        weatherState={skyPhase}
        earthState={skyEarthState}
        altitude={skyAltitude}
        altitudeInitial={reduce ? undefined : 3.2}
        parallaxScale={1.6}
        parallaxDuration={0.9}
        showEarth
        earthOpacity={earthOpacity}
        // The moon belongs to the night end of the page, not the morning at the top.
        showMoon={reduce ? false : depth > 0.62}
        moonPosition={{ top: '7%', right: '16%' }}
        hideMoonOnMobile
        showRunwayMarkings
        showSkyline
        intensity="moderate"
      />

      {/* Day to night (Oct 2026): the sky system itself is a night-flight palette, so a morning-blue wash sits over
          it at the top of the page and fades as you descend, and a sunset band passes through two-thirds down.
          What is left at the bottom is the system's own night arrival. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-500"
        style={{ background: 'linear-gradient(180deg, #1c4f92 0%, #3f79b8 55%, #6f9fd0 100%)', opacity: reduce ? 0.35 : Math.max(0, 0.72 - depth * 1.5) }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-500"
        style={{ background: 'linear-gradient(180deg, rgba(70,44,110,0.35) 0%, rgba(196,98,84,0.6) 62%, rgba(244,156,92,0.7) 100%)', opacity: reduce ? 0 : Math.max(0, 1 - Math.abs(depth - 0.58) / 0.24) * 0.9 }}
      />

      {/* Daylight clouds: the sky system's own clouds sit under the morning wash and all but vanish in it, so the
          top of the page gets its own bright ones above the wash. They drift sideways as you scroll (near ones
          faster) and fade out with the daylight. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden transition-opacity duration-500" style={{ opacity: reduce ? 0.6 : Math.max(0, 1 - depth * 2.2) }}>
        {DAY_CLOUDS.map((c, i) => (
          <div key={i} className="absolute" style={{ top: c.top, left: c.left, width: c.w, transform: `translateX(${reduce ? 0 : -depth * c.drift}vw)` }}>
            {/* One soft shape: solid white puffs, blurred and faded together (so the overlaps do not show). */}
            <div className="relative h-[90px] w-full blur-[14px]" style={{ opacity: c.o }}>
              <span className="absolute bottom-0 left-0 h-[46px] w-full rounded-full bg-white" />
              <span className="absolute bottom-[16px] left-[12%] h-[58px] w-[40%] rounded-full bg-white" />
              <span className="absolute bottom-[20px] left-[40%] h-[70px] w-[40%] rounded-full bg-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Warm apron / departure-lounge glow that grows as the airport rises into view */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[1] h-[55vh]"
        initial={false}
        animate={{ opacity: reduce ? 0 : earthOpacity }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="absolute -bottom-[12%] left-[14%] h-[45vh] w-[42%] rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.16),transparent)] blur-3xl" />
        <div className="absolute -bottom-[8%] right-[12%] h-[38vh] w-[36%] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.10),transparent)] blur-3xl" />
      </motion.div>

      {/* Legibility veil — fixed, opacity ramps with scroll depth */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[2]"
        style={{
          background:
            'linear-gradient(180deg, rgba(7,11,20,0.40) 0%, rgba(7,11,20,0.55) 45%, rgba(7,11,20,0.72) 100%)',
        }}
        initial={false}
        animate={{ opacity: veilOpacity }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </>
  );
}

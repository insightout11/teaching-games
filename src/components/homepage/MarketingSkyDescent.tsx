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
  const veilOpacity = 0.42 + depth * 0.4;

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
        showMoon
        moonPosition={{ top: '7%', right: '16%' }}
        hideMoonOnMobile
        showRunwayMarkings
        showSkyline
        intensity="moderate"
      />

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

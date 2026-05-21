'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SkyBackground } from '@/components/ui/sky-background';
import type { WeatherState } from '@/components/ui/sky-background';
import type { EarthState } from '@/lib/flight-plan-helpers';

export type FlightTransitionLeg = 'takeoff' | 'cruise' | 'landing';

interface FlightTransitionOverlayProps {
  from: string | null;
  to: string | null;
  weatherState: WeatherState;
  altitude: number;
  earthState: EarthState;
  leg: FlightTransitionLeg;
  onDismiss: () => void;
}

// Per-leg start/end values. Rotate is a fixed pitch — not animated, just applied.
const LEG_CONFIG: Record<FlightTransitionLeg, {
  yInitial: string;
  yFinal: string;
  rotate: number;
}> = {
  takeoff: { yInitial: '18vh',  yFinal: '-10vh', rotate: -7 },
  cruise:  { yInitial: '0vh',   yFinal: '0vh',   rotate:  0 },
  landing: { yInitial: '-8vh',  yFinal: '16vh',  rotate:  6 },
};

export function FlightTransitionOverlay({
  from,
  to,
  weatherState,
  altitude,
  leg,
  onDismiss,
}: FlightTransitionOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const cfg = LEG_CONFIG[leg];

  useEffect(() => {
    const id = setTimeout(() => onDismiss(), prefersReducedMotion ? 1500 : 3000);
    return () => clearTimeout(id);
  }, [onDismiss, prefersReducedMotion]);

  return (
    <div
      className="fixed inset-0 z-[60] cursor-pointer"
      onClick={onDismiss}
    >
      {/* Full sky — earthState forced to "flight" to avoid runway during side-view */}
      <SkyBackground
        weatherState={weatherState}
        altitude={altitude}
        earthState="flight"
        intensity="moderate"
      />

      {/* Plane travel — constant linear velocity, no easing */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <motion.div
            className="absolute"
            style={{ top: '32%', left: 0, marginTop: '-4rem', rotate: cfg.rotate }}
            initial={{ x: '-20vw', y: cfg.yInitial }}
            animate={{ x: '110vw',  y: cfg.yFinal }}
            transition={{ duration: 2.8, ease: 'linear' }}
          >
            {/* Contrail — sibling of image, not affecting travel path */}
            <div
              className="absolute top-1/2 right-full -translate-y-1/2 pointer-events-none"
              style={{
                width: '200px',
                height: '7px',
                background: 'linear-gradient(to left, rgba(100,220,255,0.5) 0%, transparent 100%)',
                filter: 'blur(4px)',
                borderRadius: '9999px',
              }}
            />

            {/* Child div handles decorative bob on cruise only — parent stays linear */}
            <motion.div
              animate={leg === 'cruise' ? { y: [0, -4, 0, 4, 0] } : undefined}
              transition={leg === 'cruise' ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/flight/plane-biplane-starter-b.webp"
                alt=""
                draggable={false}
                className="h-24 w-auto select-none md:h-28 lg:h-32"
              />
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Text — lower-mid sky */}
      <div
        className="absolute inset-x-0 flex flex-col items-center gap-3 pointer-events-none"
        style={{ zIndex: 20, bottom: '24%' }}
      >
        {from && (
          <motion.p
            className="text-sm font-medium tracking-wide text-white/80"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.5 }}
          >
            Departing · {from}
          </motion.p>
        )}
        {to && (
          <motion.p
            className="text-2xl font-semibold tracking-wide text-white"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 1.0, duration: 0.5 }}
          >
            Next stop · {to}
          </motion.p>
        )}
        <p className="mt-1 text-xs text-white/30">Tap anywhere to skip</p>
      </div>
    </div>
  );
}

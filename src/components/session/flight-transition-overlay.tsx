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
  earthState: EarthState;   // accepted but overridden — see SkyBackground below
  leg: FlightTransitionLeg;
  onDismiss: () => void;
}

// Per-leg keyframe profiles (x/y are framer-motion transforms, not layout)
const LEG_MOTION: Record<FlightTransitionLeg, {
  x: string[];
  y: string[];
  rotate: number[];
}> = {
  takeoff: {
    x: ['-18vw', '45vw', '110vw'],
    y: ['16vh',  '0vh',  '-8vh'],
    rotate: [-6, -9, -4],
  },
  cruise: {
    x: ['-18vw', '46vw', '110vw'],
    y: ['0vh',  '-2vh',  '1vh'],
    rotate: [-2, 1, -1],
  },
  landing: {
    x: ['-18vw', '45vw', '110vw'],
    y: ['-8vh',  '4vh',  '16vh'],
    rotate: [2, 5, 7],
  },
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
  const motion3 = LEG_MOTION[leg];

  useEffect(() => {
    const id = setTimeout(() => onDismiss(), prefersReducedMotion ? 1500 : 3000);
    return () => clearTimeout(id);
  }, [onDismiss, prefersReducedMotion]);

  return (
    <div
      className="fixed inset-0 z-[60] cursor-pointer"
      onClick={onDismiss}
    >
      {/* Full sky — no sidebar offset; earthState forced to "flight" so
          the runway/city layer doesn't fight the side-view plane motion */}
      <SkyBackground
        weatherState={weatherState}
        altitude={altitude}
        earthState="flight"
        intensity="moderate"
      />

      {/* Plane — anchored to upper-sky area; y animation moves it along flight path */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <motion.div
            className="absolute"
            style={{ top: '32%', left: 0, marginTop: '-4rem' }}
            animate={{
              x: motion3.x,
              y: motion3.y,
              rotate: motion3.rotate,
            }}
            transition={{ duration: 2.8, ease: 'easeInOut' }}
          >
            {/* Contrail glow trailing behind */}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/flight/plane-biplane-starter-b.webp"
              alt=""
              draggable={false}
              className="h-24 w-auto select-none md:h-28 lg:h-32"
            />
          </motion.div>
        </div>
      )}

      {/* Text — lower-mid sky, clear of plane and runway */}
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

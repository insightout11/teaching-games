'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SkyBackground } from '@/components/ui/sky-background';
import type { WeatherState } from '@/components/ui/sky-background';
import type { EarthState } from '@/lib/flight-plan-helpers';

interface FlightTransitionOverlayProps {
  from: string | null;
  to: string | null;
  weatherState: WeatherState;
  altitude: number;
  earthState: EarthState;
  onDismiss: () => void;
}

export function FlightTransitionOverlay({
  from,
  to,
  weatherState,
  altitude,
  earthState,
  onDismiss,
}: FlightTransitionOverlayProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const id = setTimeout(() => onDismiss(), prefersReducedMotion ? 1500 : 3000);
    return () => clearTimeout(id);
  }, [onDismiss, prefersReducedMotion]);

  return (
    <div
      className="fixed inset-0 z-[60] cursor-pointer"
      onClick={onDismiss}
    >
      {/* Full sky — no sidebar offset, fills viewport */}
      <SkyBackground
        weatherState={weatherState}
        altitude={altitude}
        earthState={earthState}
        intensity="moderate"
      />

      {/* Plane — flies left to right across the middle third */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 flex items-center pointer-events-none"
          style={{ zIndex: 10, paddingTop: '8vh' }}
        >
          <motion.div
            initial={{ x: -220 }}
            animate={{ x: '110vw' }}
            transition={{ duration: 2.8, ease: 'linear' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/flight/plane-biplane-starter-b.webp"
              alt=""
              draggable={false}
              className="h-20 w-auto select-none"
            />
          </motion.div>
        </div>
      )}

      {/* Text — lower third */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pb-20 pointer-events-none"
        style={{ zIndex: 20 }}
      >
        {from && (
          <motion.p
            className="text-sm font-medium tracking-wide text-white/60"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.5 }}
          >
            Departing · {from}
          </motion.p>
        )}
        {to && (
          <motion.p
            className="text-xl font-semibold tracking-wide text-white"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 1.0, duration: 0.5 }}
          >
            Next stop · {to}
          </motion.p>
        )}
        <p className="mt-3 text-xs text-white/30">Tap anywhere to skip</p>
      </div>
    </div>
  );
}

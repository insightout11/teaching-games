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

      {/* Plane + contrail glow — flies left to right across upper-mid sky */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 flex items-center pointer-events-none"
          style={{ zIndex: 10, paddingTop: '6vh' }}
        >
          <motion.div
            className="relative"
            initial={{ x: -280 }}
            animate={{ x: '110vw' }}
            transition={{ duration: 2.8, ease: 'linear' }}
          >
            {/* Contrail glow behind the plane */}
            <div
              className="absolute top-1/2 right-full -translate-y-1/2 pointer-events-none"
              style={{
                width: '180px',
                height: '6px',
                background: 'linear-gradient(to left, rgba(100,220,255,0.45) 0%, transparent 100%)',
                filter: 'blur(3px)',
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

      {/* Text — lower-mid sky, well above the runway/earth layer */}
      <div
        className="absolute inset-x-0 flex flex-col items-center gap-3 pointer-events-none"
        style={{ zIndex: 20, bottom: '24%' }}
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
            className="text-2xl font-semibold tracking-wide text-white"
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

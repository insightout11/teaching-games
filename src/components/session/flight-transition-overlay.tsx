'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SkyBackground } from '@/components/ui/sky-background';
import type { WeatherState } from '@/components/ui/sky-background';

export type FlightTransitionLeg = 'takeoff' | 'cruise' | 'descent';

interface FlightTransitionOverlayProps {
  from: string | null;
  to: string | null;
  weatherState: WeatherState;
  altitudeFrom: number;
  altitudeTo: number;
  leg: FlightTransitionLeg;
  onDismiss: () => void;
}

// Per-leg: fixed pitch angle + vertical travel range (framer-motion transforms)
const LEG_CONFIG: Record<FlightTransitionLeg, {
  yInitial: string;
  yFinal: string;
  rotate: number;
}> = {
  takeoff: { yInitial: '18vh',  yFinal: '-10vh', rotate: -7 },
  cruise:  { yInitial: '0vh',   yFinal: '0vh',   rotate:  0 },
  descent: { yInitial: '-8vh',  yFinal: '16vh',  rotate:  6 },
};

const TRAVEL_DURATION = 2800; // ms — matches plane motion duration

export function FlightTransitionOverlay({
  from,
  to,
  weatherState,
  altitudeFrom,
  altitudeTo,
  leg,
  onDismiss,
}: FlightTransitionOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const cfg = LEG_CONFIG[leg];

  // Animate altitude over the transition so the sky shifts with the plane
  const [currentAltitude, setCurrentAltitude] = useState(altitudeFrom);
  useEffect(() => {
    if (prefersReducedMotion || altitudeFrom === altitudeTo) {
      setCurrentAltitude(altitudeTo);
      return;
    }
    const start = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / TRAVEL_DURATION, 1);
      setCurrentAltitude(altitudeFrom + (altitudeTo - altitudeFrom) * t);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional: only run on mount; props are stable for overlay lifetime

  // Auto-dismiss timeout — cleared on unmount to prevent double-invoke
  useEffect(() => {
    const id = setTimeout(() => onDismiss(), prefersReducedMotion ? 1500 : 3000);
    return () => clearTimeout(id);
  }, [onDismiss, prefersReducedMotion]);

  return (
    <div
      className="fixed inset-0 z-[60] cursor-pointer"
      onClick={onDismiss}
    >
      {/* Sky — earthState forced to "flight" so runway never appears during side-view */}
      <SkyBackground
        weatherState={weatherState}
        altitude={currentAltitude}
        earthState="flight"
        intensity="moderate"
      />

      {/* Plane — constant linear travel; child div handles cruise bob separately */}
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
            transition={{ duration: TRAVEL_DURATION / 1000, ease: 'linear' }}
          >
            {/* Contrail glow */}
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
            {/* Child div: cruise bob only — does not affect linear travel */}
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

      {/* Route card — flight announcement panel */}
      <div
        className="absolute inset-x-0 flex justify-center pointer-events-none"
        style={{ zIndex: 20, bottom: '20%' }}
      >
        <motion.div
          className="mx-6 w-full max-w-sm rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(6, 14, 30, 0.62)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.25, duration: 0.45 }}
        >
          <div className="px-7 pt-6 pb-5 space-y-4">
            {from && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.35, duration: 0.4 }}
              >
                <p className="text-[9px] font-bold tracking-[0.22em] text-amber-400/70 uppercase mb-1">
                  Now Departing
                </p>
                <p className="text-lg font-semibold text-white leading-snug"
                  style={{ textShadow: '0 1px 10px rgba(0,0,0,0.5)' }}>
                  {from}
                </p>
              </motion.div>
            )}

            {from && to && (
              <div className="flex items-center gap-3 opacity-30">
                <div className="flex-1 h-px bg-white" />
                {/* Minimal inline plane silhouette */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white flex-shrink-0">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
                <div className="flex-1 h-px bg-white" />
              </div>
            )}

            {to && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 1.0, duration: 0.45 }}
              >
                <p className="text-[9px] font-bold tracking-[0.22em] text-cyan-400/70 uppercase mb-1">
                  Next Stop
                </p>
                <p className="text-2xl font-bold text-white leading-snug"
                  style={{ textShadow: '0 2px 14px rgba(0,0,0,0.55)' }}>
                  {to}
                </p>
              </motion.div>
            )}
          </div>

          <div className="px-7 pb-4">
            <p className="text-[9px] tracking-widest text-white/22 text-center uppercase">
              Tap to skip
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
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

const LEG_CONFIG: Record<FlightTransitionLeg, {
  yInitial: string;
  yFinal: string;
  rotate: number;
}> = {
  takeoff: { yInitial: '18vh',  yFinal: '-10vh', rotate: -7 },
  cruise:  { yInitial: '0vh',   yFinal: '0vh',   rotate:  0 },
  descent: { yInitial: '-8vh',  yFinal: '16vh',  rotate:  6 },
};

const TRAVEL_DURATION = 2800;

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

  useEffect(() => {
    const id = setTimeout(() => onDismiss(), prefersReducedMotion ? 1500 : 3000);
    return () => clearTimeout(id);
  }, [onDismiss, prefersReducedMotion]);

  return (
    <div
      className="fixed inset-0 z-[60] cursor-pointer"
      onClick={onDismiss}
    >
      {/* Sky — real earth/cloud layers animate from altitudeFrom → altitudeTo over the
          overlay lifetime. parallaxScale=4 makes the shift 4× larger so the ground
          visibly falls away (takeoff) or rises to meet you (descent). */}
      <SkyBackground
        weatherState={weatherState}
        altitude={altitudeTo}
        altitudeInitial={prefersReducedMotion ? altitudeTo : altitudeFrom}
        earthState="flight"
        intensity="moderate"
        parallaxScale={prefersReducedMotion ? 1 : 4}
        parallaxDuration={TRAVEL_DURATION / 1000}
      />

      {/* Cruise: horizontal cloud-mist drift for forward-motion feel */}
      {!prefersReducedMotion && leg === 'cruise' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 7,
            background: 'radial-gradient(ellipse 70% 30% at 40% 45%, rgba(80,130,220,0.07) 0%, transparent 100%)',
          }}
          animate={{ x: ['-6%', '6%'] }}
          transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
        />
      )}

      {/* Plane — constant linear travel; child handles cruise bob */}
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

      {/* Route card — arrives after the plane passes center (~1.2s) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[38%] pointer-events-none"
        style={{ zIndex: 20, width: 'min(520px, 86vw)' }}
      >
        <motion.div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(4, 12, 26, 0.70)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.11)',
          }}
          initial={{ opacity: 0, scale: 0.93, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={prefersReducedMotion
            ? { duration: 0 }
            : { delay: 1.2, duration: 0.45, ease: 'easeOut' }}
        >
          <div className="px-8 pt-7 pb-6 space-y-5">
            {from && (
              <div>
                <p className="text-[9px] font-bold tracking-[0.24em] text-amber-400/65 uppercase mb-1.5">
                  Now Departing
                </p>
                <p className="text-lg font-semibold text-white/85 leading-snug"
                  style={{ textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}>
                  {from}
                </p>
              </div>
            )}

            {from && to && (
              <div className="flex items-center gap-3" style={{ opacity: 0.28 }}>
                <div className="flex-1 h-px bg-white" />
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-white flex-shrink-0">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
                <div className="flex-1 h-px bg-white" />
              </div>
            )}

            {to && (
              <div>
                <p className="text-[9px] font-bold tracking-[0.24em] text-cyan-400/70 uppercase mb-1.5">
                  Next Stop
                </p>
                <p className="text-2xl font-bold text-white md:text-3xl leading-snug"
                  style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>
                  {to}
                </p>
              </div>
            )}
          </div>

          <div className="px-8 pb-5">
            <p className="text-[9px] tracking-widest text-white/22 text-center uppercase">
              Tap to skip
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

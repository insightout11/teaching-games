'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SkyBackground } from '@/components/ui/sky-background';
import type { WeatherState } from '@/components/ui/sky-background';
import { ClassPlaneSprite } from '@/components/ui/class-plane-sprite';

export type FlightTransitionLeg = 'takeoff' | 'cruise' | 'descent';

interface FlightTransitionOverlayProps {
  from: string | null;
  to: string | null;
  weatherState: WeatherState;
  altitudeFrom: number;
  altitudeTo: number;
  leg: FlightTransitionLeg;
  planeKey?: string | null;
  onDismiss: () => void;
}

// y value that places the plane on the sideways runway tarmac.
// Tarmac centre ≈ 70px from screen bottom (140px runway, tarmac y=24–116); plane base top: 32% - 4rem.
// 66vh lands the plane on the tarmac across common screen heights (768–1080px).
const RUNWAY_Y = '66vh';

const LEG_CONFIG: Record<FlightTransitionLeg, {
  yInitial: string;
  yFinal: string;
  rotate: number;
}> = {
  takeoff: { yInitial: RUNWAY_Y, yFinal: '-12vh', rotate: -10 },
  cruise:  { yInitial: '0vh',    yFinal: '0vh',   rotate:   0 },
  descent: { yInitial: '-10vh',  yFinal: RUNWAY_Y, rotate:   8 },
};

const TRAVEL_DURATION = 2800;

// ─── Sideways runway strip ────────────────────────────────────────────────────
// Horizontal runway visible during takeoff and descent transitions.
// The plane flies left-to-right across this runway, which is the correct
// geometry (left-right plane motion, left-right runway orientation).

function SidewaysRunway({ animate }: { animate: boolean }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none"
      style={{ height: 140, zIndex: 8 }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 140"
        width="100%"
        height="140"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
        aria-hidden
      >
        <defs>
          <filter id="rwy-glow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Upper grass */}
        <rect x="0" y="0" width="1440" height="24" fill="#081408" />
        {/* Tarmac — y=24 to y=116, 92px tall */}
        <rect x="0" y="24" width="1440" height="92" fill="#0C1820" />
        {/* Lower grass */}
        <rect x="0" y="116" width="1440" height="24" fill="#091408" />

        {/* Tarmac edge lines */}
        <line x1="0" y1="24.5" x2="1440" y2="24.5" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
        <line x1="0" y1="115.5" x2="1440" y2="115.5" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />

        {/* Centerline dashes — 12 dashes, 60px wide, 60px gap, y_center=70 */}
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={i * 120} y="67" width="60" height="6" fill="rgba(255,255,255,0.38)" rx="1" />
        ))}

        {/* Aiming point markings — two solid bars flanking the centerline, left and right */}
        {/* Left pair */}
        <rect x="240" y="37" width="60" height="22" fill="rgba(255,255,255,0.28)" rx="0.5" />
        <rect x="240" y="81" width="60" height="22" fill="rgba(255,255,255,0.28)" rx="0.5" />
        {/* Right pair */}
        <rect x="1140" y="37" width="60" height="22" fill="rgba(255,255,255,0.28)" rx="0.5" />
        <rect x="1140" y="81" width="60" height="22" fill="rgba(255,255,255,0.28)" rx="0.5" />

        {/* Edge lights — 10 per row, amber */}
        <g filter="url(#rwy-glow)">
          {Array.from({ length: 10 }, (_, i) => {
            const cx = 32 + (i / 9) * 1376;
            return (
              <g key={i}>
                <circle
                  cx={cx} cy="15" r="4" fill="#FFA226"
                  className={animate ? 'runway-edge-light' : undefined}
                  style={{ animationDelay: `-${(i * 0.19) % 1.9}s` }}
                />
                <circle
                  cx={cx} cy="125" r="4" fill="#FFA226"
                  className={animate ? 'runway-edge-light' : undefined}
                  style={{ animationDelay: `-${((i * 0.19) + 0.09) % 1.9}s` }}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export function FlightTransitionOverlay({
  from,
  to,
  weatherState,
  altitudeFrom,
  altitudeTo,
  leg,
  planeKey,
  onDismiss,
}: FlightTransitionOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const cfg = LEG_CONFIG[leg];
  const showRunway = leg === 'takeoff' || leg === 'descent';

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
        showCityLights={!showRunway}
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

      {/* Sideways runway strip — only for takeoff and descent legs */}
      {showRunway && (
        <SidewaysRunway animate={!prefersReducedMotion} />
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
              <ClassPlaneSprite planeKey={planeKey} size="lg" variant="flying" />
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

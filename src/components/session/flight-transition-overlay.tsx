'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SkyBackground } from '@/components/ui/sky-background';
import type { WeatherState } from '@/components/ui/sky-background';
import { ClassPlaneSprite } from '@/components/ui/class-plane-sprite';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import type { ArrivalPhase, TimeOfDay, WeatherCondition } from '@/components/world-flight/arrival-scene/types';
import { arrivalTimeline, A_TOUCHDOWN_END, DEPARTURE_DURATION_MS } from '@/components/world-flight/arrival-scene/cinematic-motion';
import { WEATHER_PROFILE } from '@/components/world-flight/arrival-scene/weather';
import { TurbulenceBeat, useTurbulence } from '@/components/session/turbulence-beat';
import { FlightCheckScene } from '@/components/session/cockpit-scene';
import type { DestinationScene } from '@/lib/world-flight/types';
import { play, playDescent, playTakeoff } from '@/lib/audio/manager';
import { RUNWAY_TOUCHDOWN_KEYFRAME } from '@/lib/audio/sounds';
import { getEngineClass } from '@/lib/plane-progression';

export type FlightTransitionLeg = 'takeoff' | 'cruise' | 'descent';

/**
 * World Flight arrival — when the descent leg has a destination, the overlay
 * flies the plane INTO the city's own arrival scene (the same scene the results
 * screen settles on) instead of the generic runway. One continuous shot.
 */
export interface FlightArrivalScene {
  destinationId: string;
  scene: DestinationScene;
  cityName: string;
  /** Context-aware time-of-day from the continuous flight clock. */
  timeOfDay?: TimeOfDay;
  /** Live weather for this leg (climate-weighted roll); defaults to clear. */
  weather?: WeatherCondition;
  planeKey?: string | null;
}

interface FlightTransitionOverlayProps {
  from: string | null;
  to: string | null;
  weatherState: WeatherState;
  altitudeFrom: number;
  altitudeTo: number;
  leg: FlightTransitionLeg;
  planeKey?: string | null;
  /** When set on a descent leg, the plane lands inside the destination's scene. */
  arrivalScene?: FlightArrivalScene;
  /** When set on a takeoff leg, the plane departs from the origin city's scene. */
  departureScene?: FlightArrivalScene;
  /** Flight weather for this leg — drives the cloud pass + cruise precipitation. */
  weather?: WeatherCondition;
  /** The destination slot is a micro-event with its own transition beat. */
  isMicroEvent?: boolean;
  /** Stage identity selects turbulence, instrument, or radar treatment. */
  stageId?: string;
  onDismiss: () => void;
}

// Weather-tinted foreground cloud pass: soft banks sweep across the transition,
// one of them IN FRONT of the plane, so it visibly flies through cloud. The tint
// darkens with worse weather. (Caller gates this on reduced-motion.)
const CLOUD_TINT: Record<WeatherCondition, string> = {
  clear: 'rgba(236,244,255,0.85)',
  overcast: 'rgba(120,132,156,0.92)',
  rain: 'rgba(104,116,140,0.93)',
  storm: 'rgba(74,84,106,0.95)',
  snow: 'rgba(228,238,250,0.95)',
  aurora: 'rgba(150,210,200,0.55)',
};

function TransitionClouds({ weather, loop = false }: { weather: WeatherCondition; loop?: boolean }) {
  const tint = CLOUD_TINT[weather];
  const banks = [
    { top: '6%', w: 68, h: 26, dur: 4.2, delay: 0.3, z: 9, op: 0.28 },
    { top: '32%', w: 96, h: 40, dur: 3.3, delay: 0, z: 13, op: 0.5 }, // foreground, over the plane (z10)
    { top: '58%', w: 78, h: 32, dur: 3.9, delay: 0.6, z: 9, op: 0.26 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {banks.map((b, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: b.top,
            left: 0,
            width: `${b.w}vw`,
            height: `${b.h}vh`,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, ${tint} 0%, ${tint} 44%, transparent 72%)`,
            filter: 'blur(28px)',
            opacity: b.op,
            zIndex: b.z,
          }}
          initial={{ x: '122vw' }}
          animate={{ x: '-95vw' }}
          // A single sweep for short legs; held beats (turbulence) loop so clouds
          // keep streaming past instead of clearing to an empty sky. Linear when
          // looping so the offscreen jump back isn't a visible ease/snap.
          transition={loop
            ? { duration: b.dur * 1.6, delay: b.delay, ease: 'linear', repeat: Infinity, repeatType: 'loop' }
            : { duration: b.dur, delay: b.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// Randomized SVG rain — drops are scattered (a memoized random field, NOT a tiled
// CSS gradient, which lines them up in a visible grid). The field is one vertical
// TILE of streaks repeated and translated by exactly one TILE, so it falls in a
// seamless loop. preserveAspectRatio "slice" covers any aspect without distorting
// the near-vertical streaks.
const RAIN_VBW = 1600;
const RAIN_VBH = 900;
const RAIN_TILE = 360;
const RAIN_TILES = [-1, 0, 1, 2, 3];

function TransitionRain({ intensity }: { intensity: number }) {
  const drops = useMemo(() => {
    const k = Math.min(1.3, Math.max(0.4, intensity));
    const count = Math.round(150 * k);
    return Array.from({ length: count }, () => {
      const len = 14 + Math.random() * 24;
      return {
        x: Math.random() * RAIN_VBW,
        y: Math.random() * RAIN_TILE,
        len,
        o: 0.1 + Math.random() * 0.32,
        sw: 0.8 + Math.random() * 0.8,
      };
    });
  }, [intensity]);
  const fall = 0.85 / Math.max(0.5, intensity);
  return (
    <svg viewBox={`0 0 ${RAIN_VBW} ${RAIN_VBH}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <motion.g animate={{ y: [0, RAIN_TILE] }} transition={{ duration: fall, repeat: Infinity, ease: 'linear' }}>
        {RAIN_TILES.map((t) => (
          <g key={t} transform={`translate(0 ${t * RAIN_TILE})`}>
            {drops.map((d, i) => (
              <line
                key={i}
                x1={d.x}
                y1={d.y}
                x2={d.x - d.len * 0.16}
                y2={d.y + d.len}
                stroke={`rgba(205,219,242,${d.o})`}
                strokeWidth={d.sw}
                strokeLinecap="round"
              />
            ))}
          </g>
        ))}
      </motion.g>
    </svg>
  );
}

// Randomized SVG snow — flakes are scattered (a memoized random field, NOT a tiled
// CSS gradient, which lines them up in a visible grid that streams as dotted
// columns). One vertical TILE of flakes is repeated and translated by exactly one
// TILE for a seamless fall; a slow horizontal sway on the whole field, plus small
// per-flake radius/opacity variation, breaks up any residual banding so it reads
// as drifting snow rather than lines.
function TransitionSnow({ intensity }: { intensity: number }) {
  const flakes = useMemo(() => {
    const k = Math.min(1.3, Math.max(0.4, intensity));
    const count = Math.round(90 * k);
    return Array.from({ length: count }, () => ({
      x: Math.random() * RAIN_VBW,
      y: Math.random() * RAIN_TILE,
      r: 1.4 + Math.random() * 2.6,
      o: 0.45 + Math.random() * 0.5,
    }));
  }, [intensity]);
  const fall = 7.5 / Math.max(0.5, intensity);
  return (
    <svg viewBox={`0 0 ${RAIN_VBW} ${RAIN_VBH}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <motion.g animate={{ x: [0, 26, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}>
        <motion.g animate={{ y: [0, RAIN_TILE] }} transition={{ duration: fall, repeat: Infinity, ease: 'linear' }}>
          {RAIN_TILES.map((t) => (
            <g key={t} transform={`translate(0 ${t * RAIN_TILE})`}>
              {flakes.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={`rgba(255,255,255,${d.o})`} />
              ))}
            </g>
          ))}
        </motion.g>
      </motion.g>
    </svg>
  );
}

// Full-screen precipitation + lightning for the sky-only cruise legs (city legs
// render weather inside their own scene). Rain and snow are randomized SVG fields
// above; lightning uses the CSS flash sheet defined in globals.css.
function TransitionPrecip({ weather }: { weather: WeatherCondition }) {
  const p = WEATHER_PROFILE[weather];
  if (p.rain === 0 && p.snow === 0 && !p.lightning && p.dim === 0) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 14 }}>
      {p.dim > 0 && <div className="absolute inset-0" style={{ background: 'rgb(16,24,42)', opacity: p.dim * 0.5 }} />}
      {p.rain > 0 && <TransitionRain intensity={p.rain} />}
      {p.snow > 0 && <TransitionSnow intensity={p.snow} />}
      {p.lightning && <div className="lc-lightning-flash absolute inset-0" />}
    </div>
  );
}

// Altitude-driven cloud deck for cruise legs: a soft "sea of clouds" below the
// plane that sits low at high altitude (you're well above the weather) and rises
// toward the camera as you descend — so peak cruise reads as "above the clouds"
// and a descent leg reads as sinking into them. Tinted by the flight weather.
function CruiseDeck({ altFrom, altTo, weather, reduce }: { altFrom: number; altTo: number; weather: WeatherCondition; reduce: boolean }) {
  const tint = CLOUD_TINT[weather];
  const yFor = (a: number) => `${a * 30}vh`; // higher altitude → deck pushed further down
  // Opacity scales with altitude: a real deck only near peak cruise (above the
  // weather); it fades out at low altitude so the EARTH shows below on climb /
  // descent legs instead of being blocked.
  const oFor = (a: number) => Math.min(0.8, Math.max(0, (a - 0.3) * 1.4));
  const billows = [14, 38, 62, 86];
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 overflow-hidden pointer-events-none"
      style={{ height: '56vh', zIndex: 5 }}
      initial={{ y: yFor(reduce ? altTo : altFrom), opacity: oFor(reduce ? altTo : altFrom) }}
      animate={{ y: yFor(altTo), opacity: oFor(altTo) }}
      transition={{ duration: TRAVEL_DURATION / 1000, ease: 'easeInOut' }}
    >
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: '28vh', background: `linear-gradient(to top, ${tint} 0%, ${tint} 38%, transparent 100%)`, filter: 'blur(12px)', opacity: 0.66 }}
      />
      {billows.map((lx, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${lx}%`,
            bottom: '24vh',
            width: '30vw',
            height: '17vh',
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, ${tint} 0%, ${tint} 48%, transparent 74%)`,
            filter: 'blur(22px)',
            opacity: 0.74,
          }}
        />
      ))}
    </motion.div>
  );
}

// y value that places the plane on the sideways runway tarmac.
// Tarmac centre ≈ 70px from screen bottom (140px runway, tarmac y=24–116).
// Plane anchor: top=32%, marginTop=-4rem. Formula: y = 0.68H - 62 → 60–62vh across 768–1080px.
const RUNWAY_Y = '61vh';
const RUNWAY_Y_BOUNCE = '59vh'; // 2vh above runway — touchdown bounce apex

const TRAVEL_DURATION = 3200; // ms — longer to accommodate roll and deceleration phases

// Per-leg keyframe animation configs.
// takeoff: stationary roll → rotate nose-up → climb
// descent: glide approach → touchdown bounce → decelerate to stop on runway
// cruise:  motion follows the altitude delta — climb (rising), level (peak), or
//          early-descent (falling) — so middle transitions aren't all identical.
function buildPlaneAnim(leg: FlightTransitionLeg, altDelta = 0) {
  if (leg === 'takeoff') {
    return {
      initial: { x: '-22vw', y: RUNWAY_Y, rotate: 0 },
      animate: {
        x: ['-22vw', '12vw', '110vw'] as string[],
        y: [RUNWAY_Y, RUNWAY_Y, '-12vh'] as string[],
        rotate: [0, 0, -11],
      },
      transition: { duration: TRAVEL_DURATION / 1000, times: [0, 0.28, 1.0], ease: 'linear' as const },
    };
  }
  if (leg === 'descent') {
    return {
      initial: { x: '-22vw', y: '-10vh', rotate: 8 },
      animate: {
        x: ['-22vw', '36vw', '40vw', '66vw'] as string[],
        y: ['-10vh', RUNWAY_Y, RUNWAY_Y_BOUNCE, RUNWAY_Y] as string[],
        rotate: [8, 2, 0, 0],
      },
      transition: { duration: TRAVEL_DURATION / 1000, times: [0, 0.52, 0.60, 1.0], ease: 'linear' as const },
    };
  }
  // cruise — pick climb / level / early-descent from the altitude change so the
  // plane visibly gains or loses height (the sky's altitude parallax matches).
  const LEVEL_EPS = 0.05;
  if (altDelta > LEVEL_EPS) {
    // Climbing: drift up across the frame, nose slightly up.
    return {
      initial: { x: '-22vw', y: '13vh', rotate: -3 },
      animate: { x: '110vw', y: '-11vh', rotate: -7 },
      transition: { duration: TRAVEL_DURATION / 1000, ease: 'easeOut' as const },
    };
  }
  if (altDelta < -LEVEL_EPS) {
    // Early descent: drift down across the frame, nose slightly down.
    return {
      initial: { x: '-22vw', y: '-11vh', rotate: 3 },
      animate: { x: '110vw', y: '13vh', rotate: 6 },
      transition: { duration: TRAVEL_DURATION / 1000, ease: 'easeIn' as const },
    };
  }
  // Level cruise (near the peak): flat crossing.
  return {
    initial: { x: '-22vw', y: '0vh', rotate: 0 },
    animate: { x: '110vw', y: '0vh', rotate: 0 },
    transition: { duration: TRAVEL_DURATION / 1000, ease: 'linear' as const },
  };
}

// ─── Sideways runway strip ────────────────────────────────────────────────────
// Horizontal runway visible during takeoff and descent transitions.
// The plane flies left-to-right across this runway, which is the correct
// geometry (left-right plane motion, left-right runway orientation).

function SidewaysRunway({ animate, leg }: { animate: boolean; leg: 'takeoff' | 'descent' }) {
  // Lights sequence in the direction the plane moves:
  // takeoff → left-to-right chase; descent → right-to-left approach
  const topDelay  = (i: number) => leg === 'takeoff' ? `-${(i * 0.19).toFixed(2)}s`       : `-${((9 - i) * 0.19).toFixed(2)}s`;
  const botDelay  = (i: number) => leg === 'takeoff' ? `-${(i * 0.19 + 0.09).toFixed(2)}s` : `-${((9 - i) * 0.19 + 0.09).toFixed(2)}s`;
  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none"
      style={{ height: 140, zIndex: 8 }}
      aria-hidden
    >
      <SkylineHorizon />
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
          <rect key={i} x={i * 120} y="66" width="60" height="8" fill="rgba(255,255,255,0.55)" rx="1" />
        ))}

        {/* Edge lights — 10 per row, amber, sequenced in plane-travel direction */}
        <g filter="url(#rwy-glow)">
          {Array.from({ length: 10 }, (_, i) => {
            const cx = 32 + (i / 9) * 1376;
            return (
              <g key={i}>
                <circle
                  cx={cx} cy="15" r="4" fill="#FFA226"
                  className={animate ? 'runway-edge-light' : undefined}
                  style={{ animationDelay: topDelay(i) }}
                />
                <circle
                  cx={cx} cy="125" r="4" fill="#FFA226"
                  className={animate ? 'runway-edge-light' : undefined}
                  style={{ animationDelay: botDelay(i) }}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// ─── City skyline at horizon ─────────────────────────────────────────────────
// Protrudes 80px above the runway grass top edge (sky zone).
// SVG y=80 = horizon line; taller towers reach near y=0.

type SkyWin = { x: number; y: number; cool?: true };

function winGrid(
  xs: number[], ys: number[],
  skip: (xi: number, y: number) => boolean = () => false,
  cool: (y: number) => boolean = () => false,
): SkyWin[] {
  return ys.flatMap((y) =>
    xs
      .filter((_, xi) => !skip(xi, y))
      .map((x): SkyWin => ({ x, y, ...(cool(y) ? { cool: true } : {}) }))
  );
}

const SKYLINE_WINDOWS: SkyWin[] = [
  // Control tower head
  { x: 161, y: 5 }, { x: 168, y: 5 }, { x: 175, y: 5 },
  { x: 161, y: 11 }, { x: 175, y: 11 },
  // Terminal annex — 3 rows, drop every 3rd window
  ...winGrid([84,90,96,102,108,114,120,126,132,138,144,150], [51,57,63], (xi) => xi % 3 === 2),
  // Tower A (x=608, y=8)
  ...winGrid([611,618,625,632], [12,18,24,30,36,42,48,54,60,66],
    (xi, y) => (y === 36 && xi === 1) || (y === 54 && xi === 3),
    (y) => y < 24),
  // Tower B tallest (x=694, y=4)
  ...winGrid([697,703,709,715], [8,14,20,26,32,38,44,50,56,62,68,74],
    (xi, y) => (y === 32 && xi === 2) || (y === 50 && xi === 0) || (y === 62 && xi === 3),
    (y) => y < 22),
  // Tower C (x=754, y=6)
  ...winGrid([757,763,769], [10,16,22,28,34,40,46,52,58,64,70],
    (xi, y) => (y === 28 && xi === 1) || (y === 46 && xi === 2)),
  // Tall at x=810
  ...winGrid([813,819,825], [16,22,28,34,40,46,52,58,64]),
  // Right tall tower (x=1134)
  ...winGrid([1137,1143,1149], [16,22,28,34,40,46,52,58,64],
    (xi, y) => (y === 34 && xi === 1) || (y === 52 && xi === 0),
    (y) => y < 28),
  // Scattered on medium buildings
  { x:583,y:54 }, { x:583,y:60 }, { x:589,y:57 },
  { x:649,y:22 }, { x:655,y:22 }, { x:649,y:28 }, { x:649,y:34 }, { x:655,y:34 },
  { x:731,y:22 }, { x:731,y:28 }, { x:731,y:34 },
  { x:783,y:26 }, { x:789,y:26 }, { x:783,y:32 },
  { x:841,y:30 }, { x:841,y:36 },
  { x:1099,y:34 }, { x:1105,y:34 }, { x:1099,y:40 },
  { x:1165,y:28 }, { x:1165,y:34 },
  { x:1247,y:22 }, { x:1247,y:28 },
  { x:1271,y:32 }, { x:1277,y:32 }, { x:1271,y:38 },
];

function SkylineHorizon() {
  const f  = 'rgba(8,12,20,0.92)';
  const ww = 'rgba(255,195,60,0.55)';
  const wc = 'rgba(190,225,255,0.42)';
  return (
    <div
      style={{ position: 'absolute', top: -80, left: 0, right: 0, height: 80, pointerEvents: 'none' }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 80"
        width="100%"
        height="80"
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          <filter id="city-bloom" x="-80%" y="-100%" width="260%" height="300%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
          <filter id="win-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* City ambient bloom — warm haze above downtown */}
        <ellipse cx="730" cy="64" rx="260" ry="52" fill="rgba(255,130,20,0.09)" filter="url(#city-bloom)" />

        {/* ── LEFT AIRPORT ── */}
        <rect x="20"  y="62" width="200" height="18" fill={f} />  {/* terminal base */}
        <rect x="80"  y="46" width="80"  height="34" fill={f} />  {/* terminal annex */}
        <rect x="95"  y="42" width="52"  height="4"  fill={f} />  {/* annex setback */}
        <rect x="167" y="4"  width="10"  height="76" fill={f} />  {/* tower neck */}
        <rect x="158" y="2"  width="28"  height="14" fill={f} />  {/* tower head */}
        <circle cx="172" cy="2" r="2.2" fill="#FF5500" opacity="0.92" />
        <rect x="260" y="56" width="100" height="24" fill={f} />
        <rect x="310" y="48" width="40"  height="32" fill={f} />
        <rect x="372" y="62" width="50"  height="18" fill={f} />
        <rect x="430" y="65" width="36"  height="15" fill={f} />
        <rect x="474" y="67" width="28"  height="13" fill={f} />
        <rect x="510" y="65" width="36"  height="15" fill={f} />

        {/* ── CITY CENTRE ── */}
        <rect x="556" y="68" width="44"  height="12" fill={f} />
        <rect x="580" y="50" width="26"  height="30" fill={f} />
        <rect x="608" y="8"  width="34"  height="72" fill={f} />  {/* Tower A */}
        <rect x="614" y="4"  width="22"  height="4"  fill={f} />  {/* A setback */}
        <rect x="646" y="18" width="24"  height="62" fill={f} />
        <rect x="672" y="34" width="18"  height="46" fill={f} />
        <rect x="694" y="4"  width="30"  height="76" fill={f} />  {/* Tower B — tallest */}
        <rect x="701" y="0"  width="16"  height="4"  fill={f} />  {/* B spire base */}
        <rect x="728" y="18" width="22"  height="62" fill={f} />
        <rect x="754" y="6"  width="22"  height="74" fill={f} />  {/* Tower C */}
        <rect x="763" y="2"  width="4"   height="4"  fill={f} />  {/* C antenna stub */}
        <rect x="780" y="22" width="26"  height="58" fill={f} />
        <rect x="810" y="12" width="24"  height="68" fill={f} />
        <rect x="838" y="26" width="30"  height="54" fill={f} />
        <rect x="872" y="40" width="36"  height="40" fill={f} />
        <rect x="912" y="50" width="44"  height="30" fill={f} />
        <rect x="960" y="62" width="52"  height="18" fill={f} />

        {/* ── RIGHT CLUSTER ── */}
        <rect x="1020" y="64" width="44"  height="16" fill={f} />
        <rect x="1058" y="52" width="66"  height="28" fill={f} />
        <rect x="1096" y="30" width="34"  height="50" fill={f} />
        <rect x="1134" y="12" width="24"  height="68" fill={f} />  {/* tall */}
        <rect x="1140" y="8"  width="12"  height="4"  fill={f} />  {/* setback */}
        <rect x="1162" y="24" width="28"  height="56" fill={f} />
        <rect x="1194" y="44" width="56"  height="36" fill={f} />
        <rect x="1244" y="18" width="20"  height="62" fill={f} />
        <rect x="1268" y="28" width="46"  height="52" fill={f} />
        <rect x="1318" y="44" width="62"  height="36" fill={f} />
        <rect x="1386" y="56" width="54"  height="24" fill={f} />

        {/* ── WINDOW LIGHTS ── */}
        <g filter="url(#win-glow)">
          {SKYLINE_WINDOWS.map(({ x, y, cool }, i) => (
            <rect key={i} x={x} y={y} width="3" height="3" fill={cool ? wc : ww} />
          ))}
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
  arrivalScene,
  departureScene,
  weather = 'clear',
  isMicroEvent = false,
  stageId,
  onDismiss,
}: FlightTransitionOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  // City transition: fly the plane INTO the destination scene on descent, or OUT
  // of the origin scene on takeoff. Both composite the shared SkyBackground (same
  // animated clouds + altitude parallax as every other leg) behind the city.
  const cityLeg =
    leg === 'descent' && arrivalScene
      ? { scene: arrivalScene, mode: 'arrival' as const, label: 'Now Arriving' }
      : leg === 'takeoff' && departureScene
        ? { scene: departureScene, mode: 'departure' as const, label: 'Now Departing' }
        : null;
  const isCityTransition = !!cityLeg;
  const showRunway = (leg === 'takeoff' || leg === 'descent') && !isCityTransition;
  const planeAnim = buildPlaneAnim(leg, altitudeTo - altitudeFrom);

  // Cruise micro-events each get a transition matching their classroom purpose.
  const isCruiseMicroEvent = !!isMicroEvent && leg === 'cruise' && !isCityTransition;
  const turbulence = isCruiseMicroEvent && stageId === 'opinion-pulse';
  const checkVariant =
    isCruiseMicroEvent && stageId === 'accuracy-check'
      ? 'instrument'
      : isCruiseMicroEvent && stageId === 'navigation-check'
        ? 'radar'
        : null;
  const frameJitter = useTurbulence(turbulence && !prefersReducedMotion ? 0.35 : 0);

  // The tracking-camera takeoff (rolling down the real city's runway) wants a
  // longer beat than the standard transition so the speed build is felt. The
  // cinematic arrival also gets time for the touchdown impact and hero reveal.
  const isTakeoffCity = cityLeg?.mode === 'departure';
  const isArrivalCity = cityLeg?.mode === 'arrival';
  const travelMs = isTakeoffCity ? DEPARTURE_DURATION_MS : isArrivalCity ? 5200 : TRAVEL_DURATION;

  // Engine audio rides the leg. Takeoff picks its sound from the plane's propulsion
  // family, so upgrading the aircraft changes how departures sound (§2a). Touchdown
  // is scheduled onto the descent bounce keyframe; with reduced motion there is no
  // bounce to hit, so it fires immediately.
  // Read through a ref, NOT a dependency: useReducedMotion resolves null -> boolean
  // after mount, and depending on it re-runs this effect, firing the cue a second
  // time a few ms behind the first — two engines phasing against each other.
  const reduceRef = useRef(prefersReducedMotion);
  reduceRef.current = prefersReducedMotion;
  useEffect(() => {
    const engineClass = getEngineClass(planeKey);
    if (leg === 'takeoff') return playTakeoff(engineClass);
    if (leg === 'cruise') {
      // Micro-events replace the plain cruise swell with their own beat. The
      // instrument check stays silent on purpose — see the note in sounds.ts.
      if (turbulence) return play('turbulence');
      if (checkVariant === 'radar') return play('radar');
      return play('cruise');
    }
    if (leg === 'descent') {
      // Two different descents run two different animations, and the hit has to
      // follow whichever is on screen. A city arrival (the path real sessions
      // always take, since session-view falls back to the home-base scene) runs
      // arrivalTimeline over travelMs, where contact is A_APPROACH_END. A bare
      // runway descent uses the plane variant's own 0.60 bounce keyframe, which
      // is pinned to TRAVEL_DURATION. Using one fixed number for both is why the
      // chirp drifted.
      // A_APPROACH_END is where the flare ENDS, but the aircraft is not visibly
      // down there: PlaneLayer blends yOffset from its flying value to the runway
      // calibration across the whole touchdown phase, so it keeps sinking until
      // A_TOUCHDOWN_END. Firing on the earlier mark put the chirp ~1s ahead of
      // the wheels.
      const contactMs = isArrivalCity
        ? A_TOUCHDOWN_END * travelMs
        : RUNWAY_TOUCHDOWN_KEYFRAME * TRAVEL_DURATION;
      // The approach bed carries the same engine as this plane's takeoff, so a
      // piston aircraft doesn't land sounding like a jet. It ducks out just
      // before contact, leaving the chirp exposed.
      const stopBed = playDescent(engineClass);
      const stopHit = play('touchdown', { delayMs: reduceRef.current ? 0 : contactMs });
      return () => { stopBed(); stopHit(); };
    }
    return undefined;
  }, [leg, planeKey, isArrivalCity, travelMs, turbulence, checkVariant]);

  // Drives the city scene's phase/progress across the overlay lifetime.
  const [transitionT, setTransitionT] = useState(prefersReducedMotion ? 1 : 0);
  useEffect(() => {
    if (!isCityTransition || prefersReducedMotion) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / travelMs);
      setTransitionT(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isCityTransition, prefersReducedMotion, travelMs]);
  // Departure ignores phase (single climb-out path); arrival walks the landing phases.
  const af = cityLeg?.mode === 'departure'
    ? { phase: 'approach' as ArrivalPhase, progress: transitionT }
    : arrivalTimeline(transitionT);

  useEffect(() => {
    const id = setTimeout(() => onDismiss(), prefersReducedMotion ? 1500 : isTakeoffCity ? 5200 : isArrivalCity ? 5500 : 3500);
    return () => clearTimeout(id);
  }, [onDismiss, prefersReducedMotion, isTakeoffCity, isArrivalCity]);

  return (
    <div
      className="fixed inset-0 z-[60] cursor-pointer"
      onClick={onDismiss}
    >
      {isCityTransition ? (
        /* City transition — the SAME full-bleed SkyBackground (animated clouds +
           altitude parallax) every other leg uses, composited BEHIND the city's
           own scene (its sky made transparent, filled to width). The plane lands
           into / departs from the real city, sharing the results-screen frame, so
           there is no generic-runway → city teleport and it matches the rest. */
        <>
          <SkyBackground
            weatherState={weatherState}
            altitude={altitudeTo}
            altitudeInitial={prefersReducedMotion ? altitudeTo : altitudeFrom}
            earthState="flight"
            showEarth={false}
            showMoon={cityLeg!.scene.timeOfDay === 'night'}
            intensity="moderate"
            parallaxScale={prefersReducedMotion ? 1 : 4}
            parallaxDuration={travelMs / 1000}
          />
          <div className="absolute inset-0" style={{ zIndex: 6 }}>
            <DestinationArrivalScene
              destinationId={cityLeg!.scene.destinationId}
              scene={cityLeg!.scene.scene}
              phase={af.phase}
              progress={af.progress}
              mode={cityLeg!.mode}
              transparentSky
              fit="slice"
              timeOfDay={cityLeg!.scene.timeOfDay}
              weather={cityLeg!.scene.weather}
              planeKey={cityLeg!.scene.planeKey ?? planeKey}
              motion={prefersReducedMotion ? 'static' : 'animated'}
              className="absolute inset-0"
            />
          </div>
        </>
      ) : turbulence ? (
        /* Micro-event turbulence beat — the whole frame trembles while the front
           plane buffets; the cloud pass + precipitation still play on top. */
        <motion.div className="absolute inset-0" style={{ x: frameJitter.x, y: frameJitter.y }}>
          <SkyBackground
            weatherState={weatherState}
            altitude={altitudeTo}
            altitudeInitial={prefersReducedMotion ? altitudeTo : altitudeFrom}
            earthState="flight"
            showEarth={false}
            intensity="moderate"
            parallaxScale={1}
          />
          <TurbulenceBeat planeKey={planeKey} intensity={1} reduce={!!prefersReducedMotion} />
        </motion.div>
      ) : checkVariant ? (
        <div className="absolute inset-0 bg-slate-950">
          <SkyBackground
            weatherState={weatherState}
            altitude={altitudeTo}
            altitudeInitial={prefersReducedMotion ? altitudeTo : altitudeFrom}
            earthState="flight"
            showEarth={false}
            intensity="moderate"
            parallaxScale={1}
          />
          <FlightCheckScene variant={checkVariant} weather={weather} />
        </div>
      ) : (
      <>
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

      {/* Cruise cloud deck — a sea of clouds below the plane, rising/falling with
          altitude so high cruise reads as "above the weather" and descent as
          sinking into it. */}
      {leg === 'cruise' && (
        <CruiseDeck altFrom={altitudeFrom} altTo={altitudeTo} weather={weather} reduce={!!prefersReducedMotion} />
      )}

      {/* Sideways runway strip — only for takeoff and descent legs */}
      {showRunway && (
        <>
          {/* Horizon atmosphere — dark-green gradient just above the grass top */}
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              bottom: 140,
              height: 80,
              zIndex: 7,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(14,24,10,0.22) 55%, rgba(22,38,14,0.48) 100%)',
            }}
          />
          <SidewaysRunway animate={!prefersReducedMotion} leg={leg as 'takeoff' | 'descent'} />
        </>
      )}

      {/* Plane — multi-phase keyframe animation per leg */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <motion.div
            className="absolute"
            style={{ top: '32%', left: 0, marginTop: '-4rem' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initial={planeAnim.initial as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            animate={planeAnim.animate as any}
            transition={planeAnim.transition}
          >
            {/* Contrail — actually gated to airborne flight now: on takeoff it stays
                off through the ground roll and fades in after rotation; on descent it
                fades out into the landing roll; on cruise it's steady. */}
            <motion.div
              className="absolute top-1/2 right-full -translate-y-1/2 pointer-events-none"
              style={{
                width: '200px',
                height: '7px',
                background: 'linear-gradient(to left, rgba(200,230,255,0.45) 0%, transparent 100%)',
                filter: 'blur(4px)',
                borderRadius: '9999px',
              }}
              initial={{ opacity: leg === 'takeoff' ? 0 : 1 }}
              animate={leg === 'takeoff' ? { opacity: [0, 0, 1] } : leg === 'descent' ? { opacity: [1, 1, 0] } : { opacity: 1 }}
              transition={
                leg === 'takeoff'
                  ? { duration: TRAVEL_DURATION / 1000, times: [0, 0.28, 0.44], ease: 'linear' }
                  : leg === 'descent'
                    ? { duration: TRAVEL_DURATION / 1000, times: [0, 0.5, 0.66], ease: 'linear' }
                    : { duration: 0 }
              }
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
      </>
      )}

      {/* Weather-aware atmosphere: a foreground cloud pass on every leg (the plane
          flies through it) + full-screen precipitation/lightning on the sky-only
          cruise legs (city legs carry weather inside their own scene). */}
      {!prefersReducedMotion && <TransitionClouds weather={weather} loop={turbulence} />}
      {!isCityTransition && !prefersReducedMotion && <TransitionPrecip weather={weather} />}

      {/* Waypoint label — restrained top-left corner so the cinematic moment stays
          visible (replaces the old centered card that covered the whole scene). */}
      <motion.div
        className="absolute top-6 left-6 pointer-events-none"
        style={{ zIndex: 20, maxWidth: 'min(440px, 72vw)' }}
        initial={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.35, duration: 0.5, ease: 'easeOut' }}
      >
        <div
          className="rounded-xl px-4 py-2.5"
          style={{
            background: 'rgba(4, 12, 26, 0.62)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.11)',
          }}
        >
          {isCityTransition ? (
            <>
              <p className="text-[9px] font-bold tracking-[0.24em] uppercase text-cyan-400/75 mb-0.5">
                {cityLeg!.label}
              </p>
              <p className="text-lg font-bold text-white leading-tight" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.6)' }}>
                {cityLeg!.scene.cityName}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              {from && <span className="text-sm font-semibold text-white/70">{from}</span>}
              {from && to && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-white/45 flex-shrink-0 rotate-90">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              )}
              {to && (
                <span className="text-base font-bold text-white" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.6)' }}>
                  {to}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Skip hint — unobtrusive bottom corner */}
      <div className="absolute bottom-4 right-5 pointer-events-none" style={{ zIndex: 20 }}>
        <p className="text-[9px] tracking-widest text-white/25 uppercase">Tap to skip</p>
      </div>
    </div>
  );
}

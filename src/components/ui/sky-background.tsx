'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { EarthState } from '@/lib/flight-plan-helpers';

export type WeatherState = 'idle' | 'climbing' | 'cruising' | 'golden' | 'landing';

interface SkyBackgroundProps {
  weatherState?: WeatherState;
  currentSlotIndex?: number;
  altitude?: number;      // 0.0 (ground) → 1.0 (cruise peak)
  earthState?: EarthState;
  intensity?: 'subtle' | 'moderate';
  className?: string;
}

// ─── Weather config ─────────────────────────────────────────────────────────

const WEATHER: Record<WeatherState, {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  horizonGlow: string;
  cloudFill: string;
  opacityFar: number;
  opacityMid: number;
  opacityNear: number;
}> = {
  idle: {
    skyTop:    '#02060E',
    skyMid:    '#07142A',
    skyBottom: '#0D2242',
    horizonGlow: 'rgba(65,140,245,0.16)',
    cloudFill: 'rgb(200,220,255)',
    opacityFar: 0.38,
    opacityMid: 0.54,
    opacityNear: 0.70,
  },
  climbing: {
    skyTop:    '#030912',
    skyMid:    '#091428',
    skyBottom: '#102242',
    horizonGlow: 'rgba(85,158,255,0.20)',
    cloudFill: 'rgb(215,232,255)',
    opacityFar: 0.42,
    opacityMid: 0.58,
    opacityNear: 0.75,
  },
  cruising: {
    skyTop:    '#010508',
    skyMid:    '#040C1C',
    skyBottom: '#08142A',
    horizonGlow: 'rgba(70,145,255,0.12)',
    cloudFill: 'rgb(228,240,255)',
    opacityFar: 0.46,
    opacityMid: 0.62,
    opacityNear: 0.80,
  },
  golden: {
    skyTop:    '#060412',
    skyMid:    '#110A1E',
    skyBottom: '#1E0E24',
    horizonGlow: 'rgba(245,130,32,0.28)',
    cloudFill: 'rgb(255,228,195)',
    opacityFar: 0.44,
    opacityMid: 0.60,
    opacityNear: 0.76,
  },
  landing: {
    skyTop:    '#040308',
    skyMid:    '#0C0812',
    skyBottom: '#1A0C1A',
    horizonGlow: 'rgba(255,138,22,0.38)',
    cloudFill: 'rgb(255,218,155)',
    opacityFar: 0.48,
    opacityMid: 0.65,
    opacityNear: 0.82,
  },
};

// ─── Star field ──────────────────────────────────────────────────────────────

const STARS: Array<{ x: number; y: number; r: number; op: number }> = [
  { x: 48,   y: 22, r: 1.3, op: 0.90 },
  { x: 136,  y: 9,  r: 1.1, op: 0.80 },
  { x: 312,  y: 18, r: 1.4, op: 0.92 },
  { x: 498,  y: 7,  r: 1.2, op: 0.85 },
  { x: 672,  y: 25, r: 1.3, op: 0.88 },
  { x: 864,  y: 12, r: 1.1, op: 0.82 },
  { x: 1008, y: 6,  r: 1.4, op: 0.90 },
  { x: 1200, y: 20, r: 1.2, op: 0.86 },
  { x: 1390, y: 10, r: 1.3, op: 0.88 },
  { x: 88,   y: 40, r: 0.9, op: 0.68 },
  { x: 175,  y: 28, r: 1.0, op: 0.72 },
  { x: 230,  y: 50, r: 0.9, op: 0.65 },
  { x: 380,  y: 35, r: 1.0, op: 0.70 },
  { x: 425,  y: 14, r: 0.9, op: 0.68 },
  { x: 560,  y: 46, r: 1.0, op: 0.72 },
  { x: 618,  y: 31, r: 0.9, op: 0.66 },
  { x: 736,  y: 52, r: 1.0, op: 0.70 },
  { x: 795,  y: 16, r: 0.9, op: 0.74 },
  { x: 924,  y: 42, r: 1.0, op: 0.68 },
  { x: 978,  y: 27, r: 0.9, op: 0.72 },
  { x: 1060, y: 50, r: 1.0, op: 0.66 },
  { x: 1128, y: 33, r: 0.9, op: 0.70 },
  { x: 1260, y: 44, r: 1.0, op: 0.68 },
  { x: 1320, y: 22, r: 0.9, op: 0.74 },
  { x: 62,   y: 54, r: 0.6, op: 0.45 },
  { x: 158,  y: 44, r: 0.7, op: 0.42 },
  { x: 265,  y: 60, r: 0.6, op: 0.40 },
  { x: 348,  y: 48, r: 0.7, op: 0.44 },
  { x: 444,  y: 56, r: 0.6, op: 0.40 },
  { x: 530,  y: 36, r: 0.7, op: 0.46 },
  { x: 648,  y: 58, r: 0.6, op: 0.42 },
  { x: 718,  y: 38, r: 0.7, op: 0.44 },
  { x: 830,  y: 55, r: 0.6, op: 0.40 },
  { x: 902,  y: 30, r: 0.7, op: 0.46 },
  { x: 1042, y: 60, r: 0.6, op: 0.42 },
  { x: 1148, y: 50, r: 0.7, op: 0.44 },
  { x: 1218, y: 58, r: 0.6, op: 0.40 },
  { x: 1345, y: 36, r: 0.7, op: 0.46 },
  { x: 1418, y: 52, r: 0.6, op: 0.42 },
  { x: 194,  y: 62, r: 0.5, op: 0.35 },
];

function StarField() {
  return (
    <svg
      viewBox="0 0 1440 72"
      width="100%"
      height="72"
      preserveAspectRatio="none"
      style={{ display: 'block' }}
      aria-hidden
    >
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.op} />
      ))}
    </svg>
  );
}

// ─── Cloud shapes ────────────────────────────────────────────────────────────

type CloudCircle = { cx: number; cy: number; r: number };

function CloudShape({
  circles,
  blur,
  fill,
  filterId,
}: {
  circles: CloudCircle[];
  blur: number;
  fill: string;
  filterId: string;
}) {
  const viewW = Math.ceil(circles.reduce((m, c) => Math.max(m, c.cx + c.r), 0)) + 30;
  const viewH = Math.ceil(circles.reduce((m, c) => Math.max(m, c.cy + c.r), 0)) + 30;
  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      width={viewW}
      height={viewH}
      style={{ overflow: 'visible', display: 'block' }}
      aria-hidden
    >
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        {circles.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={fill} />
        ))}
      </g>
    </svg>
  );
}

// ─── Cloud layout — seamless loop ────────────────────────────────────────────

const FAR_CLOUDS = [
  { id: 'fc1',  xVw: 5,   yPx: 14,  blur: 9,
    circles: [{ cx:60,cy:32,r:28 },{ cx:95,cy:26,r:22 },{ cx:125,cy:30,r:18 },{ cx:45,cy:36,r:20 },{ cx:150,cy:34,r:16 }] },
  { id: 'fc2',  xVw: 38,  yPx: 8,   blur: 8,
    circles: [{ cx:40,cy:22,r:20 },{ cx:68,cy:16,r:24 },{ cx:98,cy:20,r:18 },{ cx:120,cy:24,r:14 }] },
  { id: 'fc3',  xVw: 68,  yPx: 42,  blur: 10,
    circles: [{ cx:50,cy:30,r:26 },{ cx:82,cy:22,r:20 },{ cx:110,cy:28,r:16 },{ cx:30,cy:34,r:18 },{ cx:135,cy:32,r:13 }] },
  { id: 'fc4',  xVw: 88,  yPx: 20,  blur: 8,
    circles: [{ cx:35,cy:20,r:18 },{ cx:60,cy:14,r:22 },{ cx:88,cy:18,r:16 }] },
  { id: 'fc1b', xVw: 105, yPx: 14,  blur: 9,
    circles: [{ cx:60,cy:32,r:28 },{ cx:95,cy:26,r:22 },{ cx:125,cy:30,r:18 },{ cx:45,cy:36,r:20 },{ cx:150,cy:34,r:16 }] },
  { id: 'fc2b', xVw: 138, yPx: 8,   blur: 8,
    circles: [{ cx:40,cy:22,r:20 },{ cx:68,cy:16,r:24 },{ cx:98,cy:20,r:18 },{ cx:120,cy:24,r:14 }] },
  { id: 'fc3b', xVw: 168, yPx: 42,  blur: 10,
    circles: [{ cx:50,cy:30,r:26 },{ cx:82,cy:22,r:20 },{ cx:110,cy:28,r:16 },{ cx:30,cy:34,r:18 },{ cx:135,cy:32,r:13 }] },
  { id: 'fc4b', xVw: 188, yPx: 20,  blur: 8,
    circles: [{ cx:35,cy:20,r:18 },{ cx:60,cy:14,r:22 },{ cx:88,cy:18,r:16 }] },
];

const MID_CLOUDS = [
  { id: 'mc1',  xVw: 2,   yPx: 68,  blur: 13,
    circles: [{ cx:80,cy:60,r:50 },{ cx:130,cy:45,r:58 },{ cx:185,cy:55,r:46 },{ cx:50,cy:68,r:40 },{ cx:220,cy:62,r:36 }] },
  { id: 'mc2',  xVw: 35,  yPx: 150, blur: 12,
    circles: [{ cx:65,cy:50,r:44 },{ cx:115,cy:38,r:52 },{ cx:162,cy:46,r:40 },{ cx:40,cy:58,r:34 },{ cx:190,cy:52,r:32 }] },
  { id: 'mc3',  xVw: 62,  yPx: 88,  blur: 14,
    circles: [{ cx:90,cy:65,r:55 },{ cx:148,cy:50,r:62 },{ cx:205,cy:60,r:48 },{ cx:55,cy:74,r:42 }] },
  { id: 'mc4',  xVw: 82,  yPx: 195, blur: 11,
    circles: [{ cx:55,cy:44,r:38 },{ cx:98,cy:32,r:46 },{ cx:145,cy:40,r:36 },{ cx:34,cy:52,r:28 }] },
  { id: 'mc1b', xVw: 102, yPx: 68,  blur: 13,
    circles: [{ cx:80,cy:60,r:50 },{ cx:130,cy:45,r:58 },{ cx:185,cy:55,r:46 },{ cx:50,cy:68,r:40 },{ cx:220,cy:62,r:36 }] },
  { id: 'mc2b', xVw: 135, yPx: 150, blur: 12,
    circles: [{ cx:65,cy:50,r:44 },{ cx:115,cy:38,r:52 },{ cx:162,cy:46,r:40 },{ cx:40,cy:58,r:34 },{ cx:190,cy:52,r:32 }] },
  { id: 'mc3b', xVw: 162, yPx: 88,  blur: 14,
    circles: [{ cx:90,cy:65,r:55 },{ cx:148,cy:50,r:62 },{ cx:205,cy:60,r:48 },{ cx:55,cy:74,r:42 }] },
  { id: 'mc4b', xVw: 182, yPx: 195, blur: 11,
    circles: [{ cx:55,cy:44,r:38 },{ cx:98,cy:32,r:46 },{ cx:145,cy:40,r:36 },{ cx:34,cy:52,r:28 }] },
];

const NEAR_CLOUDS = [
  { id: 'nc1',  xVw: 8,   yPx: 125, blur: 18,
    circles: [{ cx:110,cy:85,r:72 },{ cx:185,cy:65,r:82 },{ cx:260,cy:78,r:64 },{ cx:70,cy:96,r:55 },{ cx:310,cy:88,r:52 }] },
  { id: 'nc2',  xVw: 42,  yPx: 285, blur: 16,
    circles: [{ cx:95,cy:70,r:65 },{ cx:165,cy:52,r:76 },{ cx:238,cy:64,r:58 },{ cx:58,cy:80,r:48 }] },
  { id: 'nc3',  xVw: 74,  yPx: 180, blur: 20,
    circles: [{ cx:120,cy:90,r:78 },{ cx:200,cy:70,r:88 },{ cx:282,cy:82,r:68 },{ cx:75,cy:102,r:60 }] },
  { id: 'nc1b', xVw: 108, yPx: 125, blur: 18,
    circles: [{ cx:110,cy:85,r:72 },{ cx:185,cy:65,r:82 },{ cx:260,cy:78,r:64 },{ cx:70,cy:96,r:55 },{ cx:310,cy:88,r:52 }] },
  { id: 'nc2b', xVw: 142, yPx: 285, blur: 16,
    circles: [{ cx:95,cy:70,r:65 },{ cx:165,cy:52,r:76 },{ cx:238,cy:64,r:58 },{ cx:58,cy:80,r:48 }] },
  { id: 'nc3b', xVw: 174, yPx: 180, blur: 20,
    circles: [{ cx:120,cy:90,r:78 },{ cx:200,cy:70,r:88 },{ cx:282,cy:82,r:68 },{ cx:75,cy:102,r:60 }] },
];

// ─── Earth layer ─────────────────────────────────────────────────────────────

function EarthLayer({ earthState }: { earthState: EarthState }) {
  const isLanding = earthState === 'landing';
  const isTakeoff = earthState === 'takeoff';

  const terrainColor = isLanding ? '#14090A' : isTakeoff ? '#0A1810' : '#081018';
  const hazeColor    = isLanding ? 'rgba(210,100,18,0.28)' : isTakeoff ? 'rgba(35,115,50,0.16)' : 'rgba(25,75,120,0.10)';

  return (
    <svg
      viewBox="0 0 1440 220"
      width="100%"
      height="220"
      preserveAspectRatio="xMidYMax slice"
      style={{ display: 'block' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="earth-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={hazeColor}    stopOpacity="0.15" />
          <stop offset="30%"  stopColor={terrainColor} stopOpacity="0.45" />
          <stop offset="70%"  stopColor={terrainColor} stopOpacity="0.85" />
          <stop offset="100%" stopColor={terrainColor} stopOpacity="1.0" />
        </linearGradient>

        {/* Gradient fills for takeoff ground bands */}
        <linearGradient id="grass-top-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1e4226" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#0e2014" stopOpacity="0.80" />
        </linearGradient>
        <linearGradient id="tarmac-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#243040" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#131c28" stopOpacity="0.88" />
        </linearGradient>
        <linearGradient id="grass-bot-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#172e1a" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#0a1810" stopOpacity="0.85" />
        </linearGradient>

        {/* Subtle horizontal texture for grass */}
        <filter id="grass-tex" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.45" numOctaves="2" seed="9" result="n" />
          <feColorMatrix in="n" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0.05  0 0 0 0 0  0 0 0 0.11 0"
            result="g" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="g" /></feMerge>
        </filter>
        {/* Subtle surface texture for tarmac */}
        <filter id="tarmac-tex" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.85" numOctaves="2" seed="3" result="n" />
          <feColorMatrix in="n" type="matrix"
            values="0 0 0 0 0.02  0 0 0 0 0.02  0 0 0 0 0.06  0 0 0 0.07 0"
            result="g" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="g" /></feMerge>
        </filter>

        <filter id="bloom-soft" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
        </filter>
      </defs>

      <rect x="0" y="0" width="1440" height="220" fill="url(#earth-grad)" />

      {/* Takeoff: gradient + textured ground bands — passenger side-window view */}
      {isTakeoff && (
        <g>
          <rect x="0" y="100" width="1440" height="42" fill="url(#grass-top-g)" filter="url(#grass-tex)" />
          <rect x="0" y="142" width="1440" height="38" fill="url(#tarmac-g)"    filter="url(#tarmac-tex)" />
          <rect x="0" y="180" width="1440" height="40" fill="url(#grass-bot-g)" filter="url(#grass-tex)" />
        </g>
      )}

      {/* Landing: warm atmospheric city glow from below */}
      {isLanding && (
        <g>
          <ellipse cx="720"  cy="218" rx="720" ry="55"  fill="#f08010" opacity="0.18" filter="url(#bloom-soft)" />
          <ellipse cx="265"  cy="198" rx="140" ry="40"  fill="#f5a028" opacity="0.36" filter="url(#bloom-soft)" />
          <ellipse cx="670"  cy="190" rx="162" ry="48"  fill="#f5b030" opacity="0.42" filter="url(#bloom-soft)" />
          <ellipse cx="1085" cy="196" rx="148" ry="42"  fill="#f5a028" opacity="0.38" filter="url(#bloom-soft)" />
          <ellipse cx="440"  cy="208" rx="92"  ry="26"  fill="#f0a020" opacity="0.26" filter="url(#bloom-soft)" />
          <ellipse cx="870"  cy="205" rx="98"  ry="28"  fill="#f0a820" opacity="0.28" filter="url(#bloom-soft)" />
          <ellipse cx="148"  cy="212" rx="65"  ry="18"  fill="#f09018" opacity="0.20" filter="url(#bloom-soft)" />
          <ellipse cx="1298" cy="210" rx="70"  ry="20"  fill="#f09018" opacity="0.22" filter="url(#bloom-soft)" />
        </g>
      )}
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SkyBackground({
  weatherState = 'idle',
  currentSlotIndex,
  altitude = 0,
  earthState = 'flight',
  intensity = 'moderate',
  className,
}: SkyBackgroundProps) {
  const config = WEATHER[weatherState];
  const mult = intensity === 'subtle' ? 0.75 : 1;

  const prevSlotRef = useRef(currentSlotIndex);
  const [transitioning, setTransitioning] = useState(false);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (currentSlotIndex === undefined) return;
    if (prevSlotRef.current !== undefined && prevSlotRef.current !== currentSlotIndex) {
      setTransitioning(true);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      burstTimerRef.current = setTimeout(() => setTransitioning(false), 4000);
    }
    prevSlotRef.current = currentSlotIndex;
    return () => {
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, [currentSlotIndex]);

  const burstDurations: React.CSSProperties = transitioning
    ? { '--cloud-duration-far': '26s', '--cloud-duration-mid': '17s', '--cloud-duration-near': '11s' } as React.CSSProperties
    : {};

  const opFar  = config.opacityFar  * mult * (transitioning ? 1.6 : 1);
  const opMid  = config.opacityMid  * mult * (transitioning ? 1.6 : 1);
  const opNear = config.opacityNear * mult * (transitioning ? 1.5 : 1);
  const opDur  = transitioning ? 1.2 : 3.0;

  // Stars: subtle at ground, brighter at altitude
  const starOpacity = (0.22 + Math.min(0.55, altitude * 0.80)) * mult;

  // Cumulus fade as you climb above them
  const cumulusAltFactor = Math.max(0.08, 1 - altitude * 0.88);
  const opFarAlt  = opFar  * cumulusAltFactor;
  const opMidAlt  = opMid  * cumulusAltFactor;
  const opNearAlt = opNear * cumulusAltFactor;

  // Cumulus shift down as altitude rises
  const farShift  = altitude * 70;
  const midShift  = altitude * 130;
  const nearShift = altitude * 200;

  // Earth slides below viewport as altitude rises
  const earthShift = altitude * 80;

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none select-none ${className ?? ''}`}
      style={{ zIndex: 0, ...burstDurations }}
      aria-hidden
    >
      {/* Sky gradient — 3-stop for visible depth */}
      <motion.div
        className="absolute inset-0"
        animate={{ background: `linear-gradient(180deg, ${config.skyTop} 0%, ${config.skyMid} 50%, ${config.skyBottom} 100%)` }}
        transition={{ duration: 3, ease: 'easeInOut' }}
        style={{ zIndex: 0 }}
      />

      {/* Horizon atmosphere glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '42%', zIndex: 1 }}
        animate={{ background: `radial-gradient(ellipse 100% 60% at 50% 100%, ${config.horizonGlow} 0%, transparent 100%)` }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      />

      {/* Stars */}
      <motion.div
        className="absolute top-0 left-0 right-0"
        style={{ zIndex: 2 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: starOpacity }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      >
        <StarField />
      </motion.div>

      {/* Earth layer */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        style={{ zIndex: 3 }}
        animate={{ y: earthShift }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      >
        <EarthLayer earthState={earthState} />
      </motion.div>

      {/* Far layer */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 4 }}
        animate={{ y: farShift }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      >
        <div className="cloud-layer-far absolute top-0 left-0" style={{ width: '200vw' }}>
          {FAR_CLOUDS.map((cloud) => (
            <motion.div
              key={cloud.id}
              className="absolute"
              style={{ left: `${cloud.xVw}vw`, top: cloud.yPx }}
              animate={{ opacity: opFarAlt }}
              transition={{ duration: opDur, ease: 'easeInOut' }}
            >
              <CloudShape circles={cloud.circles} blur={cloud.blur} fill={config.cloudFill} filterId={`sky-${cloud.id}`} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Mid layer */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 5 }}
        animate={{ y: midShift }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      >
        <div className="cloud-layer-mid absolute top-0 left-0" style={{ width: '200vw' }}>
          {MID_CLOUDS.map((cloud) => (
            <motion.div
              key={cloud.id}
              className="absolute"
              style={{ left: `${cloud.xVw}vw`, top: cloud.yPx }}
              animate={{ opacity: opMidAlt }}
              transition={{ duration: opDur, ease: 'easeInOut' }}
            >
              <CloudShape circles={cloud.circles} blur={cloud.blur} fill={config.cloudFill} filterId={`sky-${cloud.id}`} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Near layer */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 6 }}
        animate={{ y: nearShift }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      >
        <div className="cloud-layer-near absolute top-0 left-0" style={{ width: '200vw' }}>
          {NEAR_CLOUDS.map((cloud) => (
            <motion.div
              key={cloud.id}
              className="absolute"
              style={{ left: `${cloud.xVw}vw`, top: cloud.yPx }}
              animate={{ opacity: opNearAlt }}
              transition={{ duration: opDur, ease: 'easeInOut' }}
            >
              <CloudShape circles={cloud.circles} blur={cloud.blur} fill={config.cloudFill} filterId={`sky-${cloud.id}`} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

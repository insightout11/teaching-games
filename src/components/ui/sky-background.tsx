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
  skyBottom: string;
  horizonGlow: string;
  cloudFill: string;
  opacityFar: number;
  opacityMid: number;
  opacityNear: number;
}> = {
  idle: {
    skyTop: '#070B14',
    skyBottom: '#0A1223',
    horizonGlow: 'rgba(77,163,255,0.08)',
    cloudFill: 'rgb(180,210,255)',
    opacityFar: 0.22,
    opacityMid: 0.32,
    opacityNear: 0.50,
  },
  climbing: {
    skyTop: '#08101C',
    skyBottom: '#0C1632',
    horizonGlow: 'rgba(77,163,255,0.10)',
    cloudFill: 'rgb(200,225,255)',
    opacityFar: 0.25,
    opacityMid: 0.36,
    opacityNear: 0.55,
  },
  cruising: {
    skyTop: '#060A16',
    skyBottom: '#08122A',
    horizonGlow: 'rgba(100,175,255,0.12)',
    cloudFill: 'rgb(215,235,255)',
    opacityFar: 0.28,
    opacityMid: 0.40,
    opacityNear: 0.60,
  },
  golden: {
    skyTop: '#080A14',
    skyBottom: '#12101E',
    horizonGlow: 'rgba(200,140,60,0.16)',
    cloudFill: 'rgb(240,225,195)',
    opacityFar: 0.28,
    opacityMid: 0.40,
    opacityNear: 0.58,
  },
  landing: {
    skyTop: '#0A0812',
    skyBottom: '#160E16',
    horizonGlow: 'rgba(220,140,50,0.22)',
    cloudFill: 'rgb(255,220,160)',
    opacityFar: 0.32,
    opacityMid: 0.45,
    opacityNear: 0.65,
  },
};

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
// Containers are 200vw wide. Each cloud has a duplicate at xVw + 100 so the
// second copy enters from the right as the first exits left.
// Animation: translateX(0) → translateX(-100vw), seamless restart.
//
// yPx values are distributed across three vertical bands:
//   Far  →  top 10–55px   (distant cirrus near horizon)
//   Mid  →  55–200px      (mid-altitude cumulus)
//   Near →  120–360px     (foreground clouds across the screen)

const FAR_CLOUDS = [
  { id: 'fc1',  xVw: 5,   yPx: 14,  blur: 9,
    circles: [{ cx:60,cy:32,r:28 },{ cx:95,cy:26,r:22 },{ cx:125,cy:30,r:18 },{ cx:45,cy:36,r:20 },{ cx:150,cy:34,r:16 }] },
  { id: 'fc2',  xVw: 38,  yPx: 8,   blur: 8,
    circles: [{ cx:40,cy:22,r:20 },{ cx:68,cy:16,r:24 },{ cx:98,cy:20,r:18 },{ cx:120,cy:24,r:14 }] },
  { id: 'fc3',  xVw: 68,  yPx: 42,  blur: 10,
    circles: [{ cx:50,cy:30,r:26 },{ cx:82,cy:22,r:20 },{ cx:110,cy:28,r:16 },{ cx:30,cy:34,r:18 },{ cx:135,cy:32,r:13 }] },
  { id: 'fc4',  xVw: 88,  yPx: 20,  blur: 8,
    circles: [{ cx:35,cy:20,r:18 },{ cx:60,cy:14,r:22 },{ cx:88,cy:18,r:16 }] },
  // Seamless copies (+100vw)
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
  // Seamless copies
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
  // Seamless copies
  { id: 'nc1b', xVw: 108, yPx: 125, blur: 18,
    circles: [{ cx:110,cy:85,r:72 },{ cx:185,cy:65,r:82 },{ cx:260,cy:78,r:64 },{ cx:70,cy:96,r:55 },{ cx:310,cy:88,r:52 }] },
  { id: 'nc2b', xVw: 142, yPx: 285, blur: 16,
    circles: [{ cx:95,cy:70,r:65 },{ cx:165,cy:52,r:76 },{ cx:238,cy:64,r:58 },{ cx:58,cy:80,r:48 }] },
  { id: 'nc3b', xVw: 174, yPx: 180, blur: 20,
    circles: [{ cx:120,cy:90,r:78 },{ cx:200,cy:70,r:88 },{ cx:282,cy:82,r:68 },{ cx:75,cy:102,r:60 }] },
];

// ─── Cirrus cloud shapes ─────────────────────────────────────────────────────
// Thin wispy streaks visible only at high altitude.
// Paths are elongated ellipses with very low blur for a filament look.

const CIRRUS_CLOUDS = [
  { id: 'ci1', xVw: 3,   yPx: 18, w: 260, h: 10, blur: 3, rx: 50 },
  { id: 'ci2', xVw: 28,  yPx: 8,  w: 340, h: 7,  blur: 2, rx: 50 },
  { id: 'ci3', xVw: 55,  yPx: 30, w: 210, h: 12, blur: 4, rx: 50 },
  { id: 'ci4', xVw: 72,  yPx: 14, w: 290, h: 8,  blur: 3, rx: 50 },
  { id: 'ci5', xVw: 15,  yPx: 42, w: 180, h: 9,  blur: 3, rx: 50 },
  { id: 'ci6', xVw: 85,  yPx: 24, w: 240, h: 11, blur: 4, rx: 50 },
  // Seamless copies (+100vw)
  { id: 'ci1b', xVw: 103, yPx: 18, w: 260, h: 10, blur: 3, rx: 50 },
  { id: 'ci2b', xVw: 128, yPx: 8,  w: 340, h: 7,  blur: 2, rx: 50 },
  { id: 'ci3b', xVw: 155, yPx: 30, w: 210, h: 12, blur: 4, rx: 50 },
  { id: 'ci4b', xVw: 172, yPx: 14, w: 290, h: 8,  blur: 3, rx: 50 },
  { id: 'ci5b', xVw: 115, yPx: 42, w: 180, h: 9,  blur: 3, rx: 50 },
  { id: 'ci6b', xVw: 185, yPx: 24, w: 240, h: 11, blur: 4, rx: 50 },
];

// ─── Earth layer ─────────────────────────────────────────────────────────────
// Pure gradient-based atmosphere — no blob shapes.
// The SVG is 1440×180: a horizon gradient band that fades from transparent
// at the top to a terrain color at the bottom. Specific features (runway,
// city lights) are small detail elements near the bottom edge.

function EarthLayer({ earthState }: { earthState: EarthState }) {
  const isLanding = earthState === 'landing';
  const isTakeoff = earthState === 'takeoff';

  // Terrain color at the bottom of the gradient
  const terrainColor = isLanding ? '#1a100a' : isTakeoff ? '#0e1a10' : '#0a1018';
  // Atmosphere haze color at the horizon
  const hazeColor = isLanding ? 'rgba(160,90,20,0.22)' : isTakeoff ? 'rgba(40,120,60,0.12)' : 'rgba(30,80,120,0.10)';

  return (
    <svg
      viewBox="0 0 1440 180"
      width="100%"
      height="180"
      preserveAspectRatio="xMidYMax slice"
      style={{ display: 'block' }}
      aria-hidden
    >
      <defs>
        {/* Vertical gradient: transparent at horizon → terrain color at bottom */}
        <linearGradient id="earth-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hazeColor} stopOpacity="0" />
          <stop offset="40%" stopColor={terrainColor} stopOpacity="0.55" />
          <stop offset="100%" stopColor={terrainColor} stopOpacity="0.95" />
        </linearGradient>
        {/* Soft cluster bloom for city lights */}
        <filter id="bloom" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bloom-soft" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
        </filter>
      </defs>

      {/* Horizon atmosphere fill */}
      <rect x="0" y="0" width="1440" height="180" fill="url(#earth-grad)" />

      {/* Takeoff: runway perspective lines + edge lights */}
      {isTakeoff && (
        <g opacity="0.75">
          {/* Converging runway lines (perspective) */}
          <line x1="680" y1="100" x2="560" y2="178" stroke="#c8d080" strokeWidth="1.5" opacity="0.5" />
          <line x1="760" y1="100" x2="880" y2="178" stroke="#c8d080" strokeWidth="1.5" opacity="0.5" />
          {/* Center dashes */}
          <rect x="717" y="108" width="6" height="10" rx="2" fill="#e8d870" opacity="0.7" />
          <rect x="716" y="126" width="8" height="12" rx="2" fill="#e8d870" opacity="0.6" />
          <rect x="714" y="148" width="12" height="14" rx="2" fill="#e8d870" opacity="0.5" />
          {/* Edge marker lights — left */}
          <circle cx="565" cy="175" r="2" fill="#d0e8ff" opacity="0.9" />
          <circle cx="592" cy="162" r="1.5" fill="#d0e8ff" opacity="0.7" />
          <circle cx="617" cy="148" r="1.5" fill="#d0e8ff" opacity="0.5" />
          <circle cx="644" cy="132" r="1" fill="#d0e8ff" opacity="0.35" />
          {/* Edge marker lights — right */}
          <circle cx="875" cy="175" r="2" fill="#d0e8ff" opacity="0.9" />
          <circle cx="848" cy="162" r="1.5" fill="#d0e8ff" opacity="0.7" />
          <circle cx="823" cy="148" r="1.5" fill="#d0e8ff" opacity="0.5" />
          <circle cx="796" cy="132" r="1" fill="#d0e8ff" opacity="0.35" />
        </g>
      )}

      {/* Landing: city light grid — tiny dots with cluster blooms */}
      {isLanding && (
        <g>
          {/* Soft area blooms behind clusters */}
          <ellipse cx="260" cy="165" rx="40" ry="14" fill="#f5a020" opacity="0.07" filter="url(#bloom-soft)" />
          <ellipse cx="660" cy="155" rx="55" ry="18" fill="#f5c030" opacity="0.09" filter="url(#bloom-soft)" />
          <ellipse cx="1090" cy="162" rx="45" ry="14" fill="#f5a820" opacity="0.08" filter="url(#bloom-soft)" />
          <ellipse cx="430" cy="170" rx="30" ry="10" fill="#f0b020" opacity="0.06" filter="url(#bloom-soft)" />
          <ellipse cx="880" cy="168" rx="35" ry="11" fill="#f5b020" opacity="0.06" filter="url(#bloom-soft)" />
          {/* Point lights — cluster A (left) */}
          <g filter="url(#bloom)">
            <circle cx="228" cy="168" r="1.5" fill="#ffe090" opacity="0.9" />
            <circle cx="238" cy="164" r="1" fill="#ffd070" opacity="0.8" />
            <circle cx="248" cy="170" r="1.5" fill="#ffcc60" opacity="0.85" />
            <circle cx="258" cy="162" r="1" fill="#ffe080" opacity="0.75" />
            <circle cx="268" cy="167" r="1.5" fill="#ffd060" opacity="0.9" />
            <circle cx="278" cy="163" r="1" fill="#ffe090" opacity="0.7" />
            <circle cx="286" cy="170" r="1" fill="#ffcc60" opacity="0.65" />
            <circle cx="295" cy="165" r="1.5" fill="#ffd070" opacity="0.8" />
          </g>
          {/* Point lights — cluster B (center) */}
          <g filter="url(#bloom)">
            <circle cx="612" cy="160" r="1.5" fill="#ffe090" opacity="0.9" />
            <circle cx="624" cy="165" r="1" fill="#ffd060" opacity="0.8" />
            <circle cx="636" cy="158" r="1.5" fill="#ffcc60" opacity="0.85" />
            <circle cx="648" cy="163" r="1" fill="#ffe080" opacity="0.8" />
            <circle cx="660" cy="157" r="2" fill="#ffd070" opacity="0.9" />
            <circle cx="672" cy="162" r="1" fill="#ffe090" opacity="0.75" />
            <circle cx="684" cy="158" r="1.5" fill="#ffcc60" opacity="0.85" />
            <circle cx="695" cy="165" r="1" fill="#ffd060" opacity="0.7" />
            <circle cx="706" cy="160" r="1.5" fill="#ffe080" opacity="0.8" />
          </g>
          {/* Point lights — cluster C (right) */}
          <g filter="url(#bloom)">
            <circle cx="1052" cy="165" r="1.5" fill="#ffe090" opacity="0.85" />
            <circle cx="1064" cy="160" r="1" fill="#ffd070" opacity="0.8" />
            <circle cx="1076" cy="166" r="1.5" fill="#ffcc60" opacity="0.9" />
            <circle cx="1088" cy="161" r="1" fill="#ffe080" opacity="0.75" />
            <circle cx="1100" cy="165" r="1.5" fill="#ffd060" opacity="0.85" />
            <circle cx="1112" cy="160" r="1" fill="#ffe090" opacity="0.7" />
            <circle cx="1122" cy="167" r="1" fill="#ffcc60" opacity="0.65" />
          </g>
          {/* Scattered individual lights */}
          <g filter="url(#bloom)">
            <circle cx="410" cy="172" r="1" fill="#ffd060" opacity="0.7" />
            <circle cx="422" cy="168" r="1.5" fill="#ffe080" opacity="0.65" />
            <circle cx="436" cy="173" r="1" fill="#ffc840" opacity="0.6" />
            <circle cx="848" cy="170" r="1" fill="#ffd070" opacity="0.65" />
            <circle cx="862" cy="166" r="1.5" fill="#ffe090" opacity="0.7" />
            <circle cx="878" cy="171" r="1" fill="#ffc840" opacity="0.6" />
            <circle cx="1248" cy="170" r="1" fill="#ffd060" opacity="0.6" />
            <circle cx="1262" cy="167" r="1.5" fill="#ffe080" opacity="0.65" />
            <circle cx="145" cy="174" r="1" fill="#ffd060" opacity="0.5" />
            <circle cx="158" cy="170" r="1" fill="#ffe070" opacity="0.45" />
          </g>
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
  const mult = intensity === 'subtle' ? 0.45 : 1;

  // Transition burst: fires when the slot index advances.
  // Burst lasts 4 s (matching the 4 s plane animation), then fades over 3 s.
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

  const opFar  = config.opacityFar  * mult * (transitioning ? 2.0 : 1);
  const opMid  = config.opacityMid  * mult * (transitioning ? 2.0 : 1);
  const opNear = config.opacityNear * mult * (transitioning ? 2.0 : 1);
  // Burst fades in over 1.2 s so it feels deliberate; weather crossfades over 3 s
  const opDur  = transitioning ? 1.2 : 3.0;

  // Altitude-driven values
  // Cirrus: invisible below altitude 0.5, fully visible at 1.0
  const cirrusOpacity = Math.max(0, altitude - 0.5) * 2 * (intensity === 'subtle' ? 0.7 : 1);
  // Cumulus opacity drops as you climb above them; boost at ground level
  const cumulusAltFactor = 1 - altitude * 0.75;
  const opFarAlt  = opFar  * cumulusAltFactor;
  const opMidAlt  = opMid  * cumulusAltFactor;
  const opNearAlt = opNear * cumulusAltFactor;
  // Cumulus layers shift down as altitude rises (clouds are below you)
  const farShift  = altitude * 70;
  const midShift  = altitude * 130;
  const nearShift = altitude * 200;
  // Earth: at altitude=0 translateY=0 (fully visible); at altitude=1 translate down 70% of SVG height
  const earthShift = altitude * 70;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className ?? ''}`}
      style={{ zIndex: 0, ...burstDurations }}
      aria-hidden
    >
      {/* Sky gradient */}
      <motion.div
        className="absolute inset-0"
        animate={{ background: `linear-gradient(180deg, ${config.skyTop} 0%, ${config.skyBottom} 100%)` }}
        transition={{ duration: 3, ease: 'easeInOut' }}
        style={{ zIndex: 0 }}
      />

      {/* Horizon warmth glow — sits along the bottom edge */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '40%', zIndex: 1 }}
        animate={{ background: `radial-gradient(ellipse 100% 60% at 50% 100%, ${config.horizonGlow} 0%, transparent 100%)` }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      />

      {/* Earth layer — anchored to bottom, shifts down as altitude rises */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        style={{ zIndex: 2 }}
        animate={{ y: earthShift }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      >
        <EarthLayer earthState={earthState} />
      </motion.div>

      {/* Cirrus layer — wispy streaks only visible at high altitude */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        animate={{ opacity: cirrusOpacity }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      >
        <div className="cloud-layer-cirrus absolute top-0 left-0" style={{ width: '200vw' }}>
          {CIRRUS_CLOUDS.map((c) => (
            <div
              key={c.id}
              className="absolute"
              style={{ left: `${c.xVw}vw`, top: c.yPx }}
            >
              <svg
                width={c.w}
                height={c.h + 16}
                viewBox={`0 0 ${c.w} ${c.h + 16}`}
                style={{ display: 'block', overflow: 'visible' }}
                aria-hidden
              >
                <defs>
                  <filter id={`cf-${c.id}`} x="-20%" y="-100%" width="140%" height="300%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation={c.blur} />
                  </filter>
                </defs>
                <rect
                  x="0" y={c.h / 2} width={c.w} height={c.h}
                  rx={c.rx} ry={c.h / 2}
                  fill="rgb(230,242,255)"
                  opacity="0.85"
                  filter={`url(#cf-${c.id})`}
                />
              </svg>
            </div>
          ))}
        </div>
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

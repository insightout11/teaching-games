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
// Stroked bezier paths that look like real high-altitude cirrus:
// irregular, wispy, varying thickness. Each formation has multiple strands
// at different blur/opacity levels to create natural feathering.
// strands: [ { d, sw (strokeWidth), blur, op (opacity) } ]

type CirrusStrand = { d: string; sw: number; blur: number; op: number };
type CirrusFormation = { id: string; xVw: number; yPx: number; w: number; h: number; strands: CirrusStrand[] };

function CirrusShape({ cloud }: { cloud: CirrusFormation }) {
  return (
    <svg
      width={cloud.w} height={cloud.h}
      viewBox={`0 0 ${cloud.w} ${cloud.h}`}
      style={{ overflow: 'visible', display: 'block' }}
      aria-hidden
    >
      {cloud.strands.map((s, i) => (
        <g key={i} style={{ filter: `blur(${s.blur}px)` }}>
          <path d={s.d} stroke="rgb(235,245,255)" strokeWidth={s.sw} fill="none" opacity={s.op} />
        </g>
      ))}
    </svg>
  );
}

// Horsetail — long sweeping strand with fanning tails on the right (1400×90px)
const HORSETAIL: CirrusStrand[] = [
  { d: 'M 0,45 C 350,28 820,64 1400,36',                              sw: 40, blur: 18, op: 0.09 },
  { d: 'M 15,43 C 350,26 820,62 1385,33',                             sw: 12, blur: 6,  op: 0.55 },
  { d: 'M 42,33 C 360,15 830,52 1360,23',                             sw: 5,  blur: 3,  op: 0.38 },
  { d: 'M 950,38 C 1090,22 1230,10 1388,5',                           sw: 5,  blur: 3,  op: 0.34 },
  { d: 'M 965,48 C 1100,35 1235,26 1380,22',                          sw: 3,  blur: 3,  op: 0.26 },
  { d: 'M 920,44 C 1055,31 1185,22 1315,18',                          sw: 3,  blur: 2,  op: 0.20 },
];

// Parallel streaks — evenly-spaced thin lines spanning full width (1100×65px)
const PARALLEL: CirrusStrand[] = [
  { d: 'M 0,25 C 250,14 560,40 1100,18',                              sw: 28, blur: 14, op: 0.08 },
  { d: 'M 0,22 C 250,11 560,36 1100,14',                              sw: 8,  blur: 4,  op: 0.48 },
  { d: 'M 0,36 C 250,25 560,51 1100,28',                              sw: 7,  blur: 4,  op: 0.42 },
  { d: 'M 0,48 C 250,38 560,63 1100,41',                              sw: 5,  blur: 4,  op: 0.36 },
  { d: 'M 15,12 C 265,1  572,26 1085,4',                              sw: 3,  blur: 3,  op: 0.28 },
  { d: 'M 28,58 C 272,48 574,73 1082,51',                             sw: 3,  blur: 3,  op: 0.22 },
];

// Hooked — main strand that curves sharply upward at one end (900×95px)
const HOOKED: CirrusStrand[] = [
  { d: 'M 0,65 C 220,50 460,34 600,30 C 680,27 760,17 900,7',        sw: 30, blur: 14, op: 0.09 },
  { d: 'M 0,65 C 220,50 460,34 600,30 C 680,27 760,17 900,7',        sw: 10, blur: 6,  op: 0.52 },
  { d: 'M 0,78 C 220,63 460,47 596,43 C 676,40 756,30 892,20',       sw: 5,  blur: 3,  op: 0.36 },
  { d: 'M 625,22 C 700,9  768,3  855,0',                              sw: 5,  blur: 3,  op: 0.30 },
  { d: 'M 608,32 C 682,17 750,9  822,5',                              sw: 3,  blur: 3,  op: 0.22 },
];

// Fan — strands radiating outward from a single origin (820×90px)
const FAN: CirrusStrand[] = [
  { d: 'M 60,62 C 210,42 440,22 820,5',                               sw: 32, blur: 16, op: 0.08 },
  { d: 'M 60,62 C 210,40 440,20 820,4',                               sw: 8,  blur: 5,  op: 0.46 },
  { d: 'M 60,62 C 210,50 440,36 820,26',                              sw: 7,  blur: 5,  op: 0.42 },
  { d: 'M 60,62 C 210,62 440,58 815,54',                              sw: 7,  blur: 5,  op: 0.38 },
  { d: 'M 60,62 C 210,29 395,12 748,0',                               sw: 5,  blur: 3,  op: 0.30 },
  { d: 'M 60,62 C 210,70 440,70 800,68',                              sw: 4,  blur: 3,  op: 0.24 },
];

// Wisps — shorter diffuse formations (640×65px)
const WISPS: CirrusStrand[] = [
  { d: 'M 0,32 C 170,20 350,44 640,28',                               sw: 32, blur: 18, op: 0.10 },
  { d: 'M 0,30 C 170,18 350,42 640,26',                               sw: 12, blur: 8,  op: 0.42 },
  { d: 'M 22,46 C 188,34 368,56 625,40',                              sw: 8,  blur: 8,  op: 0.34 },
  { d: 'M 48,16 C 208,6  388,24 628,12',                              sw: 5,  blur: 5,  op: 0.28 },
];

// 5 formations per 100vw cycle — formations are now wide enough that 5 covers the loop
const CIRRUS_FORMATIONS: CirrusFormation[] = [
  { id: 'ci1',  xVw: 0,   yPx: 8,  w: 1400, h: 90, strands: HORSETAIL },
  { id: 'ci2',  xVw: 20,  yPx: 38, w: 1100, h: 65, strands: PARALLEL  },
  { id: 'ci3',  xVw: 42,  yPx: 14, w: 900,  h: 95, strands: HOOKED    },
  { id: 'ci4',  xVw: 60,  yPx: 52, w: 820,  h: 90, strands: FAN       },
  { id: 'ci5',  xVw: 78,  yPx: 26, w: 640,  h: 65, strands: WISPS     },
  // Seamless copies (+100vw)
  { id: 'ci1b', xVw: 100, yPx: 8,  w: 1400, h: 90, strands: HORSETAIL },
  { id: 'ci2b', xVw: 120, yPx: 38, w: 1100, h: 65, strands: PARALLEL  },
  { id: 'ci3b', xVw: 142, yPx: 14, w: 900,  h: 95, strands: HOOKED    },
  { id: 'ci4b', xVw: 160, yPx: 52, w: 820,  h: 90, strands: FAN       },
  { id: 'ci5b', xVw: 178, yPx: 26, w: 640,  h: 65, strands: WISPS     },
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

      {/* Takeoff: tarmac strip + grass bands — passenger side-window view looking down */}
      {isTakeoff && (
        <g>
          {/* Upper grass band */}
          <rect x="0" y="88" width="1440" height="32" fill="#1e3820" opacity="0.50" />
          {/* Grey tarmac strip — the runway surface below */}
          <rect x="0" y="120" width="1440" height="30" fill="#28303c" opacity="0.60" />
          {/* Lower grass band */}
          <rect x="0" y="150" width="1440" height="30" fill="#1a3018" opacity="0.40" />
        </g>
      )}

      {/* Landing: pure atmospheric city glow — no dots, just warm area light */}
      {isLanding && (
        <g>
          {/* Large diffuse region glow — the overall lit-up city atmosphere */}
          <ellipse cx="720" cy="175" rx="680" ry="35" fill="#f09010" opacity="0.09" filter="url(#bloom-soft)" />
          {/* Major cluster glows */}
          <ellipse cx="265" cy="162" rx="110" ry="22" fill="#f5a828" opacity="0.16" filter="url(#bloom-soft)" />
          <ellipse cx="670" cy="155" rx="130" ry="28" fill="#f5b530" opacity="0.18" filter="url(#bloom-soft)" />
          <ellipse cx="1085" cy="160" rx="115" ry="23" fill="#f5a828" opacity="0.16" filter="url(#bloom-soft)" />
          {/* Secondary glows between clusters */}
          <ellipse cx="440" cy="168" rx="70" ry="16" fill="#f0a020" opacity="0.10" filter="url(#bloom-soft)" />
          <ellipse cx="870" cy="166" rx="75" ry="17" fill="#f0a820" opacity="0.11" filter="url(#bloom-soft)" />
          <ellipse cx="145" cy="170" rx="55" ry="13" fill="#f09018" opacity="0.08" filter="url(#bloom-soft)" />
          <ellipse cx="1290" cy="168" rx="60" ry="14" fill="#f09018" opacity="0.08" filter="url(#bloom-soft)" />
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
      className={`fixed inset-0 overflow-hidden pointer-events-none select-none ${className ?? ''}`}
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
          {CIRRUS_FORMATIONS.map((c) => (
            <div
              key={c.id}
              className="absolute"
              style={{ left: `${c.xVw}vw`, top: c.yPx }}
            >
              <CirrusShape cloud={c} />
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

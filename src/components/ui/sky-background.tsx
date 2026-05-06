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

// Horsetail — long sweep with fanning tails on the right
const HORSETAIL: CirrusStrand[] = [
  { d: 'M 0,28 C 200,18 440,38 650,22',              sw: 22, blur: 10, op: 0.09 }, // diffuse base
  { d: 'M 10,26 C 200,16 440,36 645,20',             sw: 7,  blur: 4,  op: 0.55 }, // main strand
  { d: 'M 25,20 C 210,10 445,30 630,14',             sw: 3,  blur: 2,  op: 0.38 }, // thin parallel
  { d: 'M 450,24 C 510,14 572,7  640,4',             sw: 3,  blur: 2,  op: 0.34 }, // tail 1
  { d: 'M 460,30 C 515,22 572,16 638,14',            sw: 2,  blur: 2,  op: 0.26 }, // tail 2
  { d: 'M 435,28 C 490,20 548,14 606,12',            sw: 2,  blur: 2,  op: 0.20 }, // tail 3
];

// Parallel streaks — evenly-spaced thin lines
const PARALLEL: CirrusStrand[] = [
  { d: 'M 0,15 C 120,9  270,22 500,11',              sw: 16, blur: 9,  op: 0.08 }, // diffuse
  { d: 'M 0,13 C 120,7  270,20 500,9',               sw: 5,  blur: 3,  op: 0.48 },
  { d: 'M 0,22 C 120,16 270,29 500,18',              sw: 4,  blur: 3,  op: 0.42 },
  { d: 'M 0,29 C 120,23 270,36 500,25',              sw: 3,  blur: 3,  op: 0.36 },
  { d: 'M 10,7  C 130,1  275,14 490,3',              sw: 2,  blur: 2,  op: 0.28 },
  { d: 'M 20,36 C 135,30 278,43 490,32',             sw: 2,  blur: 2,  op: 0.22 },
];

// Hooked cirrus — curves upward at one end
const HOOKED: CirrusStrand[] = [
  { d: 'M 0,40 C 100,30 220,20 290,18 C 330,16 370,10 410,4',  sw: 18, blur: 9,  op: 0.09 },
  { d: 'M 0,40 C 100,30 220,20 290,18 C 330,16 370,10 410,4',  sw: 6,  blur: 4,  op: 0.52 },
  { d: 'M 0,48 C 100,38 220,28 288,26 C 328,24 368,18 405,12', sw: 3,  blur: 2,  op: 0.36 },
  { d: 'M 300,14 C 330,6  358,2  390,0',                        sw: 3,  blur: 2,  op: 0.30 },
  { d: 'M 285,20 C 315,11 344,6  375,4',                        sw: 2,  blur: 2,  op: 0.22 },
];

// Fan — strands radiating from a single point
const FAN: CirrusStrand[] = [
  { d: 'M 30,38 C 100,25 200,14 380,4',              sw: 20, blur: 10, op: 0.08 },
  { d: 'M 30,38 C 100,24 200,13 380,3',              sw: 5,  blur: 3,  op: 0.46 },
  { d: 'M 30,38 C 100,31 200,22 380,16',             sw: 4,  blur: 3,  op: 0.42 },
  { d: 'M 30,38 C 100,38 200,35 375,32',             sw: 4,  blur: 3,  op: 0.38 },
  { d: 'M 30,38 C 100,18 185,8  345,0',              sw: 3,  blur: 2,  op: 0.30 },
  { d: 'M 30,38 C 100,42 200,42 370,40',             sw: 2,  blur: 2,  op: 0.24 },
];

// Diffuse wisps — short, soft, scattered
const WISPS: CirrusStrand[] = [
  { d: 'M 0,20 C 80,12 165,24 280,16',              sw: 20, blur: 12, op: 0.10 },
  { d: 'M 0,18 C 80,10 165,22 280,14',              sw: 8,  blur: 5,  op: 0.42 },
  { d: 'M 15,28 C 90,20 172,32 268,24',             sw: 5,  blur: 5,  op: 0.34 },
  { d: 'M 30,10 C 100,4  175,14 265,8',             sw: 3,  blur: 3,  op: 0.28 },
];

const CIRRUS_FORMATIONS: CirrusFormation[] = [
  { id: 'ci1',  xVw: 2,   yPx: 12, w: 650, h: 55, strands: HORSETAIL },
  { id: 'ci2',  xVw: 30,  yPx: 38, w: 500, h: 45, strands: PARALLEL  },
  { id: 'ci3',  xVw: 56,  yPx: 18, w: 410, h: 60, strands: HOOKED    },
  { id: 'ci4',  xVw: 70,  yPx: 44, w: 380, h: 55, strands: FAN       },
  { id: 'ci5',  xVw: 14,  yPx: 55, w: 280, h: 40, strands: WISPS     },
  { id: 'ci6',  xVw: 82,  yPx: 28, w: 500, h: 45, strands: PARALLEL  },
  // Seamless copies (+100vw)
  { id: 'ci1b', xVw: 102, yPx: 12, w: 650, h: 55, strands: HORSETAIL },
  { id: 'ci2b', xVw: 130, yPx: 38, w: 500, h: 45, strands: PARALLEL  },
  { id: 'ci3b', xVw: 156, yPx: 18, w: 410, h: 60, strands: HOOKED    },
  { id: 'ci4b', xVw: 170, yPx: 44, w: 380, h: 55, strands: FAN       },
  { id: 'ci5b', xVw: 114, yPx: 55, w: 280, h: 40, strands: WISPS     },
  { id: 'ci6b', xVw: 182, yPx: 28, w: 500, h: 45, strands: PARALLEL  },
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

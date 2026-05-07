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
  horizonInner: string;
  horizonGlow: string;
  cloudFill: string;
  opacityFar: number;
  opacityMid: number;
  opacityNear: number;
}> = {
  idle: {
    skyTop:       '#02060E',
    skyMid:       '#07142A',
    skyBottom:    '#0D2242',
    horizonInner: 'rgba(140,190,255,0.22)',
    horizonGlow:  'rgba(65,140,245,0.16)',
    cloudFill: 'rgb(200,220,255)',
    opacityFar: 0.38,
    opacityMid: 0.54,
    opacityNear: 0.70,
  },
  climbing: {
    skyTop:       '#0A0418',
    skyMid:       '#2C0C35',
    skyBottom:    '#7A2206',
    horizonInner: 'rgba(255,140,30,0.78)',
    horizonGlow:  'rgba(180,60,8,0.58)',
    cloudFill: 'rgb(255,220,175)',
    opacityFar: 0.42,
    opacityMid: 0.58,
    opacityNear: 0.75,
  },
  cruising: {
    skyTop:       '#010306',
    skyMid:       '#020818',
    skyBottom:    '#040E28',
    horizonInner: 'rgba(20,60,140,0.18)',
    horizonGlow:  'rgba(10,40,110,0.10)',
    cloudFill: 'rgb(200,220,255)',
    opacityFar: 0.46,
    opacityMid: 0.62,
    opacityNear: 0.80,
  },
  golden: {
    skyTop:       '#020310',
    skyMid:       '#080420',
    skyBottom:    '#1A0830',
    horizonInner: 'rgba(210,70,150,0.48)',
    horizonGlow:  'rgba(140,25,90,0.32)',
    cloudFill: 'rgb(240,210,255)',
    opacityFar: 0.44,
    opacityMid: 0.60,
    opacityNear: 0.76,
  },
  landing: {
    skyTop:       '#050818',
    skyMid:       '#120620',
    skyBottom:    '#240A10',
    horizonInner: 'rgba(255,155,40,0.72)',
    horizonGlow:  'rgba(220,70,15,0.52)',
    cloudFill: 'rgb(255,225,190)',
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
      {STARS.map((s, i) => {
        const twinkles = i % 3 !== 1;
        const dur  = 2.6 + (i % 11) * 0.52;
        const delay = -((i * 0.71) % 7);
        return (
          <circle
            key={i}
            cx={s.x} cy={s.y} r={s.r}
            fill="white"
            style={{
              '--s-op': s.op,
              opacity: s.op,
              ...(twinkles ? { animation: `star-twinkle ${dur}s ${delay}s infinite ease-in-out` } : {}),
            } as React.CSSProperties}
          />
        );
      })}
    </svg>
  );
}

// ─── Moon layer ──────────────────────────────────────────────────────────────

function MoonLayer() {
  return (
    <svg viewBox="0 0 240 240" width="240" height="240" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(180,210,255,0.20)" />
          <stop offset="40%"  stopColor="rgba(130,170,255,0.07)" />
          <stop offset="100%" stopColor="rgba(80,130,255,0)" />
        </radialGradient>
        <radialGradient id="moon-disk" cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#F2F6FF" />
          <stop offset="55%"  stopColor="#D4E2FF" />
          <stop offset="100%" stopColor="#B0C4EE" />
        </radialGradient>
      </defs>
      {/* Soft halo */}
      <circle cx="120" cy="120" r="110" fill="url(#moon-glow)" />
      {/* Moon disk */}
      <circle cx="120" cy="120" r="30" fill="url(#moon-disk)" opacity="0.94" />
      {/* Crescent shadow — matches cruising sky */}
      <circle cx="130" cy="116" r="25" fill="#010610" opacity="0.90" />
      {/* Crater marks on lit face */}
      <circle cx="106" cy="114" r="3.8" fill="#A8BCDE" opacity="0.22" />
      <circle cx="112" cy="127" r="2.4" fill="#A8BCDE" opacity="0.18" />
      <circle cx="98"  cy="124" r="1.8" fill="#A8BCDE" opacity="0.16" />
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

// ─── Runway perspective geometry ─────────────────────────────────────────────

const CENTERLINE_DASHES = [
  { y: 206, h: 22, w: 12 },
  { y: 189, h: 18, w: 10 },
  { y: 174, h: 14, w:  8 },
  { y: 161, h: 11, w:  6 },
  { y: 150, h:  9, w:  5 },
  { y: 141, h:  7, w:  4 },
  { y: 133, h:  5, w:  3 },
  { y: 127, h:  4, w:  2 },
];

const PERSP_LIGHTS = Array.from({ length: 8 }, (_, i) => {
  const t = i / 7;
  const r = 2.8 - t * 1.8;
  return {
    lx: 120 + t * (560 - 120),
    rx: 1320 + t * (880 - 1320),
    y:  220 + t * (114 - 220),
    r,
  };
});

// ─── City lights ─────────────────────────────────────────────────────────────

const CITY_LIGHT_COLORS = ['#ffb83a', '#ffc850', '#ff9020', '#ffe070'];

// Elevated positions (y=116-131) — visible at flight altitude where earthShift pushes ground down
// City lights — elevated (for flight states at altitude≈0.75, visible above earthShift)
const CITY_LIGHTS_SKY: Array<{ x: number; y: number; r: number }> = [
  // Left cluster
  { x: 198, y: 128, r: 2.5 }, { x: 208, y: 120, r: 2.0 }, { x: 215, y: 130, r: 3.2 },
  { x: 224, y: 118, r: 1.8 }, { x: 232, y: 126, r: 2.5 }, { x: 240, y: 122, r: 2.8 },
  { x: 248, y: 131, r: 2.0 }, { x: 256, y: 116, r: 1.8 }, { x: 263, y: 125, r: 3.0 },
  { x: 271, y: 122, r: 2.0 }, { x: 278, y: 128, r: 2.5 }, { x: 285, y: 119, r: 1.8 },
  { x: 293, y: 126, r: 2.8 }, { x: 300, y: 123, r: 2.0 }, { x: 308, y: 129, r: 2.5 },
  // Center cluster
  { x: 612, y: 123, r: 2.5 }, { x: 621, y: 128, r: 3.0 }, { x: 630, y: 120, r: 2.0 },
  { x: 639, y: 126, r: 2.5 }, { x: 647, y: 122, r: 1.8 }, { x: 655, y: 131, r: 3.5 },
  { x: 663, y: 119, r: 2.0 }, { x: 671, y: 125, r: 2.5 }, { x: 679, y: 121, r: 2.8 },
  { x: 687, y: 128, r: 2.0 }, { x: 695, y: 120, r: 1.8 }, { x: 703, y: 126, r: 3.0 },
  { x: 711, y: 123, r: 2.0 }, { x: 719, y: 131, r: 2.5 }, { x: 727, y: 119, r: 1.8 },
  { x: 735, y: 125, r: 2.8 }, { x: 743, y: 122, r: 2.0 }, { x: 751, y: 128, r: 2.5 },
  { x: 758, y: 120, r: 1.8 },
  // Right cluster
  { x: 1057, y: 125, r: 2.5 }, { x: 1066, y: 122, r: 2.0 }, { x: 1073, y: 129, r: 3.0 },
  { x: 1081, y: 120, r: 1.8 }, { x: 1089, y: 126, r: 2.5 }, { x: 1097, y: 123, r: 2.8 },
  { x: 1104, y: 130, r: 2.0 }, { x: 1112, y: 118, r: 1.8 }, { x: 1119, y: 125, r: 3.2 },
  { x: 1127, y: 122, r: 2.0 }, { x: 1134, y: 128, r: 2.5 }, { x: 1141, y: 120, r: 1.8 },
  { x: 1149, y: 126, r: 2.8 }, { x: 1156, y: 123, r: 2.0 },
  // Scattered
  { x: 148, y: 128, r: 2.0 }, { x: 161, y: 123, r: 1.8 }, { x: 174, y: 130, r: 2.5 },
  { x: 356, y: 126, r: 2.0 }, { x: 368, y: 122, r: 1.8 }, { x: 380, y: 129, r: 2.5 },
  { x: 442, y: 125, r: 2.0 }, { x: 455, y: 128, r: 1.8 },
  { x: 516, y: 123, r: 2.0 }, { x: 529, y: 129, r: 2.5 }, { x: 541, y: 122, r: 1.8 },
  { x: 850, y: 126, r: 2.0 }, { x: 862, y: 123, r: 1.8 }, { x: 874, y: 129, r: 2.5 },
  { x: 922, y: 125, r: 2.0 }, { x: 934, y: 122, r: 1.8 },
  { x: 997, y: 128, r: 2.0 }, { x: 1010, y: 123, r: 2.5 },
  { x: 1202, y: 125, r: 2.0 }, { x: 1215, y: 122, r: 1.8 }, { x: 1228, y: 129, r: 2.5 },
  { x: 1282, y: 126, r: 2.0 }, { x: 1295, y: 123, r: 1.8 },
  { x: 1352, y: 128, r: 2.0 }, { x: 1365, y: 123, r: 2.5 },
  { x: 1412, y: 126, r: 2.0 }, { x: 1425, y: 122, r: 1.8 },
];

// ─── Earth layer ─────────────────────────────────────────────────────────────

function EarthLayer({ earthState, weatherState }: { earthState: EarthState; weatherState: WeatherState }) {
  const isLanding  = earthState === 'landing';
  const isTakeoff  = earthState === 'takeoff';
  const isFlight   = earthState === 'flight';
  const isOcean    = isFlight && weatherState === 'cruising';
  const isCityDepart   = isFlight && weatherState === 'climbing';
  const isCityApproach = isFlight && (weatherState === 'golden' || weatherState === 'landing');

  const terrainColor = isOcean ? '#010A18' : isTakeoff || isLanding ? '#0A1810' : '#081018';
  const hazeColor    = isOcean    ? 'rgba(10,40,100,0.20)'
    : isTakeoff || isLanding ? 'rgba(35,115,50,0.16)'
    : 'rgba(25,75,120,0.10)';

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
        <linearGradient id="ocean-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#020C22" stopOpacity="0.70" />
          <stop offset="100%" stopColor="#010810" stopOpacity="1.0" />
        </linearGradient>

        <filter id="grass-tex" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.45" numOctaves="2" seed="9" result="n" />
          <feColorMatrix in="n" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0.05  0 0 0 0 0  0 0 0 0.11 0"
            result="g" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="g" /></feMerge>
        </filter>
        <filter id="tarmac-tex" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.85" numOctaves="2" seed="3" result="n" />
          <feColorMatrix in="n" type="matrix"
            values="0 0 0 0 0.02  0 0 0 0 0.02  0 0 0 0 0.06  0 0 0 0.07 0"
            result="g" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="g" /></feMerge>
        </filter>
        <filter id="ocean-shimmer" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.003 0.12" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix"
            values="0 0 0 0 0.01  0 0 0 0 0.04  0 0 0 0 0.12  0 0 0 0.10 0"
            result="g" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="g" /></feMerge>
        </filter>

        <filter id="bloom-soft" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
        </filter>
        <filter id="dot-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="dot-glow-cool" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Base terrain / ocean — curved top edge for ocean state */}
      {isOcean ? (
        <path
          d="M 0 80 Q 720 58 1440 80 L 1440 220 L 0 220 Z"
          fill="url(#ocean-grad)"
          filter="url(#ocean-shimmer)"
        />
      ) : (
        <rect x="0" y="0" width="1440" height="220" fill="url(#earth-grad)" />
      )}

      {/* ── Shared runway markings (takeoff + landing) ── */}
      {(isTakeoff || isLanding) && (
        <g>
          {/* Far grass strip */}
          <rect x="0" y="100" width="1440" height="14" fill="url(#grass-top-g)" filter="url(#grass-tex)" />
          {/* Wide tarmac */}
          <rect x="0" y="114" width="1440" height="106" fill="url(#tarmac-g)" filter="url(#tarmac-tex)" />
          {/* Converging runway boundary lines */}
          <line x1="120" y1="220" x2="560" y2="114" stroke="white" strokeWidth="1.5" opacity="0.28" />
          <line x1="1320" y1="220" x2="880" y2="114" stroke="white" strokeWidth="1.5" opacity="0.28" />
          {/* Perspective centerline dashes — shrink near→far */}
          {CENTERLINE_DASHES.map((d, i) => (
            <rect key={i} x={720 - d.w / 2} y={d.y} width={d.w} height={d.h} fill="white" opacity="0.42" rx="0.5" />
          ))}
          {/* Far threshold marks — tiny at horizon end */}
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={560 + i * 40 + 10} y={114} width={6} height={3} fill="white" opacity="0.28" rx="0.5" />
          ))}
          {/* Perspective edge lights — shrink along converging lines */}
          <g filter={isTakeoff ? 'url(#dot-glow)' : 'url(#dot-glow-cool)'}>
            {PERSP_LIGHTS.map((p, i) => (
              <g key={i}>
                <circle cx={p.lx} cy={p.y} r={p.r} fill={isTakeoff ? '#FFE8A0' : '#C8DCFF'} />
                <circle cx={p.rx} cy={p.y} r={p.r} fill={isTakeoff ? '#FFE8A0' : '#C8DCFF'} />
              </g>
            ))}
          </g>
          {/* Control tower — left horizon */}
          <g fill="#06090F" opacity="0.68">
            <rect x="148" y="98"  width="12" height="16" />
            <rect x="142" y="94"  width="24" height="9"  />
            <rect x="144" y="96"  width="20" height="4"  fill="#1a2840" opacity="0.5" />
          </g>
          <circle cx="154" cy="92" r="2.4" fill="#FF6020" opacity="0.88" filter="url(#dot-glow)" />
          {/* Terminal building — right (landing only) */}
          {isLanding && (
            <g fill="#06090F" opacity="0.55">
              <rect x="1230" y="104" width="120" height="10" />
              <rect x="1260" y="94"  width="30"  height="20" />
              <rect x="1282" y="98"  width="18"  height="16" />
            </g>
          )}
        </g>
      )}

      {/* ── Flight + city departing (climbing, slot 1) — elevated city dots ── */}
      {isCityDepart && (
        <g opacity="0.52">
          <ellipse cx="253"  cy="135" rx="68" ry="14" fill="#f5a030" opacity="0.07" filter="url(#bloom-soft)" />
          <ellipse cx="685"  cy="135" rx="82" ry="16" fill="#f5a030" opacity="0.08" filter="url(#bloom-soft)" />
          <ellipse cx="1107" cy="135" rx="68" ry="14" fill="#f5a030" opacity="0.07" filter="url(#bloom-soft)" />
          <g filter="url(#dot-glow)">
            {CITY_LIGHTS_SKY.map((dot, i) => (
              <circle key={i} cx={dot.x} cy={dot.y} r={dot.r}
                fill={CITY_LIGHT_COLORS[i % CITY_LIGHT_COLORS.length]} />
            ))}
          </g>
        </g>
      )}

      {/* ── Flight + city approaching (golden/pre-dawn) — elevated city dots ── */}
      {isCityApproach && (
        <g>
          <ellipse cx="253"  cy="135" rx="68" ry="14" fill="#f5a030" opacity="0.09" filter="url(#bloom-soft)" />
          <ellipse cx="685"  cy="135" rx="82" ry="16" fill="#f5a030" opacity="0.10" filter="url(#bloom-soft)" />
          <ellipse cx="1107" cy="135" rx="68" ry="14" fill="#f5a030" opacity="0.09" filter="url(#bloom-soft)" />
          <g filter="url(#dot-glow)">
            {CITY_LIGHTS_SKY.map((dot, i) => (
              <circle key={i} cx={dot.x} cy={dot.y} r={dot.r}
                fill={CITY_LIGHT_COLORS[i % CITY_LIGHT_COLORS.length]} />
            ))}
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

  // Stars: hidden during bright sunset/dawn, brightest at peak altitude
  const isBrightSky = weatherState === 'climbing' || weatherState === 'landing';
  const starOpacity = isBrightSky
    ? Math.max(0, (0.22 + Math.min(0.55, altitude * 0.80)) * mult - 0.55)
    : (0.22 + Math.min(0.55, altitude * 0.80)) * mult;

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

  // City drifts right as plane banks away during climbout (takeoff → cruising)
  const earthX = (earthState === 'flight' && weatherState === 'climbing') ? altitude * 50 : 0;

  // Sun disk baked into horizon gradient — only for ground states (takeoff=left, landing=right)
  const showSun   = earthState === 'takeoff' || earthState === 'landing';
  const sunX      = earthState === 'landing' ? '82%' : '18%';
  const sunCore   = earthState === 'landing' ? 'rgba(255,255,200,0.97)' : 'rgba(255,250,180,0.97)';
  const sunInner  = earthState === 'landing' ? 'rgba(255,190,50,0.88)'  : 'rgba(255,110,18,0.84)';
  const sunOuter  = earthState === 'landing' ? 'rgba(230,90,10,0.48)'   : 'rgba(195,40,0,0.46)';
  const sunGradient = showSun
    ? `radial-gradient(ellipse 5% 16% at ${sunX} 100%, ${sunCore} 0%, transparent 100%), radial-gradient(ellipse 18% 32% at ${sunX} 100%, ${sunInner} 0%, transparent 100%), radial-gradient(ellipse 38% 56% at ${sunX} 100%, ${sunOuter} 0%, transparent 100%), `
    : '';

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

      {/* Horizon atmosphere glow + directional sun disk for takeoff/landing */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '52%', zIndex: 1 }}
        animate={{ background: `${sunGradient}radial-gradient(ellipse 80% 30% at 50% 100%, ${config.horizonInner} 0%, transparent 100%), radial-gradient(ellipse 140% 62% at 50% 100%, ${config.horizonGlow} 0%, transparent 100%)` }}
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

      {/* Moon — cruising/midnight only */}
      <motion.div
        className="absolute"
        style={{ top: '4%', right: '14%', zIndex: 2 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: weatherState === 'cruising' ? 1 : 0 }}
        transition={{ duration: 5, ease: 'easeInOut' }}
      >
        <MoonLayer />
      </motion.div>

      {/* Earth layer */}
      <motion.div
        className="absolute bottom-0 right-0"
        style={{ zIndex: 3, left: '-64px' }}
        animate={{ y: earthShift, x: earthX }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      >
        <EarthLayer earthState={earthState} weatherState={weatherState} />
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

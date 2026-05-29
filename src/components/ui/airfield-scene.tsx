'use client';

import { motion } from 'framer-motion';
import { getPlaneAsset } from '@/lib/plane-progression';

// Single consolidated lobby airfield: ground + hangar + parked plane + control
// tower + windsock + distant planes, ALL in one coordinate system so they stay
// locked together and scale as a unit at every screen size.
//
// viewBox 0 0 1600 900 (16:9), preserveAspectRatio="xMidYMax meet" — the whole
// scene is always fully visible, pinned to the bottom; the transparent area
// above reveals the SkyBackground sky. Ground rects bleed well past the viewBox
// (overflow visible) so the tarmac fills the bottom corners on any aspect.
//
// Layout in scene units (ground line GRASS_Y = 648):
//   Hangar  — left,  g transform translate(20,298) scale(0.5)   [art 1200×700]
//   Plane   — parked in the hangar mouth (centre x≈343, floor 648)
//   Tower   — right, g transform translate(1293,222) scale(0.52) [art 480×820]
//   Distant planes — small, near the grass line between hangar and tower

const GRASS_Y = 790;

// ── Hangar art (local coords, base at y=700) ─────────────────────────────────
const H_FRONT_OUTER =
  'M105,700 L105,380 C105,200 355,70 645,70 C935,70 1185,200 1185,380 L1185,700 Z';
const H_OPENING =
  'M160,700 L160,400 C160,235 395,120 645,120 C895,120 1130,235 1130,400 L1130,700 Z';
const H_BACK_ARCH =
  'M15,645 L15,325 C15,145 265,15 555,15 C845,15 1095,145 1095,325 L1095,645 Z';
const H_LEFT_WALL = '105,700 15,645 15,325 105,380';
const H_BACK_WALL =
  'M285,670 L285,430 C285,310 445,230 645,230 C845,230 1005,310 1005,430 L1005,670 Z';
const H_INT_FLOOR = '160,700 1130,700 1005,670 285,670';
const H_INT_WALL_L = '160,700 285,670 285,430 160,400';
const H_INT_WALL_R = '1130,700 1005,670 1005,430 1130,400';
const H_LIGHTS = [485, 645, 805] as const;

function Hangar() {
  return (
    <g transform={`translate(20,${GRASS_Y - 350}) scale(0.5)`}>
      {/* depth: roof behind + receding side wall */}
      <path d={H_BACK_ARCH} fill="#1a222d" />
      <polygon points={H_LEFT_WALL} fill="#111720" />
      <polygon points={H_LEFT_WALL} fill="rgba(0,0,0,0.22)" />
      {/* front face */}
      <path d={H_FRONT_OUTER} fill="url(#af-metal)" />
      <path d="M105,380 C105,200 355,70 645,70 C935,70 1185,200 1185,380"
        fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2.5" />
      {/* opening + interior */}
      <path d={H_OPENING} fill="#0a0805" />
      <polygon points={H_INT_WALL_L} fill="rgba(28,16,6,0.96)" />
      <polygon points={H_INT_WALL_R} fill="rgba(20,11,4,0.96)" />
      <polygon points={H_INT_FLOOR} fill="rgba(34,19,7,0.97)" />
      <path d={H_BACK_WALL} fill="url(#af-backwall)" />
      <ellipse cx="645" cy="470" rx="250" ry="170"
        fill="rgba(210,120,30,0.22)" filter="url(#af-soft)" />
      {H_LIGHTS.map((lx) => (
        <g key={lx}>
          <rect x={lx - 1.5} y={258} width="3" height="20" fill="rgba(150,130,90,0.5)" />
          <ellipse cx={lx} cy={288} rx="13" ry="5" fill="rgba(255,210,110,0.85)" filter="url(#af-bulb)" />
          <circle cx={lx} cy={288} r="28" fill="rgba(255,180,60,0.18)" filter="url(#af-bulb)" />
        </g>
      ))}
      {/* rim */}
      <path d={H_OPENING} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="3" />
      <path d={H_OPENING} fill="none" stroke="rgba(225,135,35,0.30)" strokeWidth="9" filter="url(#af-soft)" />
      <path d="M395,118 C495,96 795,96 895,118" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
    </g>
  );
}

// ── Tower + windsock art (local coords, base at y=820) ───────────────────────
function TowerAndWindsock() {
  return (
    <g transform={`translate(1293,${GRASS_Y - 426}) scale(0.52)`}>
      {/* WINDSOCK (streams left, downwind) */}
      <rect x="170" y="814" width="20" height="8" rx="2" fill="#1b222b" />
      <rect x="177" y="505" width="6" height="315" fill="url(#af-metal)" />
      <circle cx="180" cy="515" r="5" fill="none" stroke="#2a333f" strokeWidth="3" />
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}
        animate={{ rotate: [0, 3, 0, -3.5, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <polygon points="180,500 143,503 143,532 180,534" fill="#e07b1e" />
        <polygon points="143,503 108,507 108,529 143,532" fill="rgba(244,238,230,0.92)" />
        <polygon points="108,507 81,511 81,526 108,529" fill="#e07b1e" />
        <polygon points="81,511 60,518 81,526" fill="rgba(244,238,230,0.92)" />
      </motion.g>

      {/* TOWER */}
      <polygon points="298,820 382,820 372,793 308,793" fill="#161c25" />
      <polygon points="305,820 375,820 356,250 324,250" fill="url(#af-metal)" />
      <polygon points="305,820 312,820 326,250 324,250" fill="rgba(255,255,255,0.05)" />
      {([{ y: 380, l: 320, r: 360 }, { y: 500, l: 316, r: 364 }, { y: 620, l: 312, r: 368 }, { y: 720, l: 308, r: 372 }] as const).map(
        ({ y, l, r }) => <rect key={y} x={l} y={y} width={r - l} height="2" fill="rgba(0,0,0,0.3)" />
      )}
      <rect x="334" y="290" width="12" height="24" rx="1.5" fill="rgba(120,200,225,0.5)" />
      <rect x="334" y="340" width="12" height="24" rx="1.5" fill="rgba(120,200,225,0.4)" />

      {/* sweeping searchlight (behind the cab) */}
      <motion.polygon
        points="340,205 298,52 382,52"
        fill="url(#af-beam)"
        filter="url(#af-soft)"
        style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
        animate={{ rotate: [-30, 30, -30], opacity: [0.1, 0.32, 0.1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* cab */}
      <polygon points="322,250 310,200 318,150 362,150 370,200 358,250" fill="url(#af-metal)" />
      <ellipse cx="340" cy="200" rx="48" ry="44" fill="rgba(110,205,230,0.22)" filter="url(#af-soft)" />
      <polygon points="325,243 318,200 324,158 356,158 362,200 355,243" fill="url(#af-glass)" />
      {([332, 340, 348] as const).map((x) => (
        <rect key={x} x={x - 1} y="158" width="2" height="85" fill="rgba(15,30,40,0.55)" />
      ))}
      <rect x="322" y="199" width="36" height="2" fill="rgba(15,30,40,0.55)" />
      <rect x="308" y="138" width="64" height="12" rx="2" fill="#222b36" />
      <rect x="303" y="131" width="74" height="7" rx="2" fill="#2c3744" />
      <rect x="338.5" y="90" width="3" height="48" fill="#2a333f" />
      <circle cx="340" cy="90" r="3" fill="#3a4655" />
      <motion.g animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}>
        <circle cx="340" cy="82" r="12" fill="rgba(255,70,50,0.45)" filter="url(#af-bulb)" />
        <circle cx="340" cy="82" r="3.5" fill="#ff5038" />
      </motion.g>
    </g>
  );
}

// ── Distant parked-plane silhouette ──────────────────────────────────────────
function MiniPlane({ x, s, nav }: { x: number; s: number; nav: string }) {
  return (
    <g transform={`translate(${x},${GRASS_Y - 4}) scale(${s})`}>
      <ellipse cx="-2" cy="3" rx="32" ry="3.5" fill="rgba(0,0,0,0.35)" />
      <path d="M-32,-9 Q-36,-9 -32,-12 L18,-14 Q31,-13 31,-9 Q31,-5 18,-5 L-28,-5 Q-36,-5 -32,-9 Z" fill="rgba(17,23,31,0.95)" />
      <path d="M15,-14 L27,-28 L31,-13 Z" fill="rgba(17,23,31,0.95)" />
      <path d="M21,-14 L35,-19 L31,-12 Z" fill="rgba(17,23,31,0.95)" />
      <path d="M-8,-8 L8,-8 L-2,5 L-20,5 Z" fill="rgba(10,14,20,0.96)" />
      <line x1="-32" y1="-9" x2="-38" y2="-9" stroke="rgba(17,23,31,0.95)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="-37" cy="-9" r="1.8" fill={nav} />
    </g>
  );
}

export function AirfieldScene({ planeKey, className }: { planeKey?: string | null; className?: string }) {
  const planeWebp = getPlaneAsset(planeKey).webp;
  // Plane parked in the hangar mouth (mouth centre ≈ 20 + 645*0.5 = 342.5, floor = GRASS_Y)
  const PW = 340, PH = 170;
  const PX = 342.5 - PW / 2;
  const PY = GRASS_Y - PH;

  return (
    <svg
      viewBox="0 0 1600 900"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMax meet"
      className={`pointer-events-none select-none ${className ?? ''}`}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="af-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4655" />
          <stop offset="0.55" stopColor="#28323e" />
          <stop offset="1" stopColor="#1b222b" />
        </linearGradient>
        <radialGradient id="af-backwall" cx="0.5" cy="0.62" r="0.75">
          <stop offset="0" stopColor="rgba(150,92,30,0.95)" />
          <stop offset="0.5" stopColor="rgba(78,44,14,0.95)" />
          <stop offset="1" stopColor="rgba(30,17,6,0.98)" />
        </radialGradient>
        <linearGradient id="af-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(120,210,230,0.80)" />
          <stop offset="1" stopColor="rgba(45,120,150,0.80)" />
        </linearGradient>
        <radialGradient id="af-beam" cx="0.5" cy="1" r="1">
          <stop offset="0" stopColor="rgba(150,225,245,0.55)" />
          <stop offset="1" stopColor="rgba(150,225,245,0)" />
        </radialGradient>
        <linearGradient id="af-tarmac" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#243040" />
          <stop offset="1" stopColor="#10171f" />
        </linearGradient>
        <linearGradient id="af-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e4226" />
          <stop offset="1" stopColor="#0e2014" />
        </linearGradient>
        <filter id="af-soft" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
        <filter id="af-bulb" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* GROUND — bleeds past the viewBox so it fills the bottom corners */}
      <rect x="-800" y={GRASS_Y - 16} width="3200" height="16" fill="url(#af-grass)" />
      <rect x="-800" y={GRASS_Y} width="3200" height={900 - GRASS_Y + 200} fill="url(#af-tarmac)" />
      <rect x="-800" y={GRASS_Y} width="3200" height="2" fill="rgba(255,255,255,0.05)" />

      {/* Distant parked planes (mid-distance, near the grass) */}
      <MiniPlane x={760} s={0.72} nav="rgba(255,170,60,0.8)" />
      <MiniPlane x={985} s={0.62} nav="rgba(120,220,140,0.75)" />
      <MiniPlane x={1180} s={0.68} nav="rgba(255,90,70,0.8)" />

      <TowerAndWindsock />
      <Hangar />

      {/* Plane parked in the hangar mouth */}
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <image href={planeWebp} x={PX} y={PY} width={PW} height={PH} preserveAspectRatio="xMidYMax meet" />
      </motion.g>
    </svg>
  );
}

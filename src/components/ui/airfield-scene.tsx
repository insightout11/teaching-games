'use client';

import { motion } from 'framer-motion';
import { getPlaneAsset } from '@/lib/plane-progression';

// Single consolidated lobby airfield: ground + hangar + parked plane (with
// blinking nav lights) + control tower + windsock + taxiway edge lights + a
// dusk moon and twinkling stars, ALL in one coordinate system so they stay
// locked together and scale as a unit at every screen size.
//
// viewBox 0 0 1600 900 (16:9), preserveAspectRatio="xMidYMax meet" — the whole
// scene is always fully visible, pinned to the bottom; the transparent area
// above reveals the SkyBackground sky. Ground rects bleed well past the viewBox
// (overflow visible) so the tarmac fills the bottom corners on any aspect.
//
// Depth staging — near/far perspective on a mostly-grass airfield:
//   FORE_Y (≈884, near) — hangar + hero plane + windsock on the foreground apron.
//   GRASS_Y (≈720, far/horizon) — control tower at the back of the grass field.
// Most of the ground is a grass field (GRASS_Y→APRON_Y); only the foreground
// (APRON_Y→bottom) is tarmac, so it reads as an airfield, not a runway.

const GRASS_Y = 720; // far horizon line — the control tower sits here
const APRON_Y = 856; // grass field → foreground tarmac apron transition
const FORE_Y = 884;  // foreground apron line — hangar + hero plane + windsock sit here

// A few brighter twinkling stars in the upper sky (over the SkyBackground dusk)
const STARS = [
  { x: 120, y: 70, r: 1.7, o: 0.9 }, { x: 250, y: 120, r: 1.2, o: 0.7 },
  { x: 340, y: 60, r: 1.4, o: 0.85 }, { x: 470, y: 110, r: 1.1, o: 0.65 },
  { x: 560, y: 50, r: 1.5, o: 0.8 }, { x: 720, y: 90, r: 1.2, o: 0.7 },
  { x: 880, y: 55, r: 1.3, o: 0.75 }, { x: 1010, y: 120, r: 1.1, o: 0.6 },
  { x: 1140, y: 70, r: 1.5, o: 0.82 }, { x: 1280, y: 105, r: 1.2, o: 0.7 },
  { x: 1420, y: 60, r: 1.4, o: 0.8 }, { x: 1520, y: 130, r: 1.1, o: 0.6 },
] as const;

// Blinking navigation/beacon light: soft glow + bright core, fading in/out
function NavLight({ cx, cy, r, core, glow, dur, delay = 0 }: {
  cx: number; cy: number; r: number; core: string; glow: string; dur: number; delay?: number;
}) {
  return (
    <motion.g
      animate={{ opacity: [1, 0.12, 1] }}
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <circle cx={cx} cy={cy} r={r * 3.2} fill={glow} filter="url(#af-bulb)" />
      <circle cx={cx} cy={cy} r={r} fill={core} />
    </motion.g>
  );
}

// Blue taxiway edge lights receding from the hangar apron into the field
function TaxiwayLights() {
  const dots = [
    { x: 585, y: 872, r: 3.6 }, { x: 648, y: 838, r: 3.1 }, { x: 702, y: 808, r: 2.6 },
    { x: 747, y: 783, r: 2.2 }, { x: 784, y: 763, r: 1.9 }, { x: 814, y: 747, r: 1.6 },
  ];
  return (
    <g>
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r={d.r * 2.6} fill="rgba(80,150,255,0.16)" filter="url(#af-bulb)" />
          <circle cx={d.x} cy={d.y} r={d.r} fill="rgba(150,200,255,0.9)" />
        </g>
      ))}
    </g>
  );
}

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
    <g transform={`translate(30,${FORE_Y - 308}) scale(0.44)`}>
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
      {H_LIGHTS.map((lx, i) => (
        <g key={lx}>
          <rect x={lx - 1.5} y={258} width="3" height="20" fill="rgba(150,130,90,0.5)" />
          {/* subtle independent flicker per pendant */}
          <motion.g
            animate={{ opacity: [1, 0.8, 0.95, 0.84, 1] }}
            transition={{ duration: 3.4 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          >
            <ellipse cx={lx} cy={288} rx="13" ry="5" fill="rgba(255,210,110,0.85)" filter="url(#af-bulb)" />
            <circle cx={lx} cy={288} r="28" fill="rgba(255,180,60,0.18)" filter="url(#af-bulb)" />
          </motion.g>
        </g>
      ))}
      {/* rim */}
      <path d={H_OPENING} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="3" />
      <path d={H_OPENING} fill="none" stroke="rgba(225,135,35,0.30)" strokeWidth="9" filter="url(#af-soft)" />
      <path d="M395,118 C495,96 795,96 895,118" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
    </g>
  );
}

// ── Control tower (far, at the back of the field) ────────────────────────────
function Tower() {
  return (
    <g transform={`translate(1380,${GRASS_Y - 410}) scale(0.5)`}>
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

// ── Windsock — foreground, on the tarmac apron at the hangar's line ──────────
function Windsock() {
  // pole base at FORE_Y, on the right of the apron
  const px = 1330, top = FORE_Y - 150;
  return (
    <g>
      <rect x={px - 10} y={FORE_Y - 6} width="20" height="8" rx="2" fill="#1b222b" />
      <rect x={px - 3} y={top} width="6" height={FORE_Y - top} fill="url(#af-metal)" />
      <circle cx={px} cy={top + 10} r="5" fill="none" stroke="#2a333f" strokeWidth="3" />
      {/* sock streams left (downwind), fluttering from the pole */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}
        animate={{ rotate: [0, 3, 0, -3.5, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <polygon points={`${px},${top + 4} ${px - 40},${top + 7} ${px - 40},${top + 39} ${px},${top + 41}`} fill="#e07b1e" />
        <polygon points={`${px - 40},${top + 7} ${px - 77},${top + 11} ${px - 77},${top + 35} ${px - 40},${top + 39}`} fill="rgba(244,238,230,0.92)" />
        <polygon points={`${px - 77},${top + 11} ${px - 107},${top + 15} ${px - 107},${top + 31} ${px - 77},${top + 35}`} fill="#e07b1e" />
        <polygon points={`${px - 107},${top + 15} ${px - 130},${top + 23} ${px - 107},${top + 31}`} fill="rgba(244,238,230,0.92)" />
      </motion.g>
    </g>
  );
}

export function AirfieldScene({ planeKey, className }: { planeKey?: string | null; className?: string }) {
  const planeWebp = getPlaneAsset(planeKey).webp;
  // Plane parked in the hangar mouth (mouth centre ≈ 30 + 645*0.44 = 313.8, floor = FORE_Y)
  const PW = 280, PH = 140;
  const PX = 313.8 - PW / 2;
  const PY = FORE_Y - PH;

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

      {/* SKY EXTRAS — pale dusk moon + a few twinkling stars (over SkyBackground) */}
      <g>
        <circle cx="200" cy="110" r="58" fill="rgba(255,232,205,0.10)" filter="url(#af-soft)" />
        <circle cx="200" cy="110" r="23" fill="rgba(255,240,222,0.82)" />
        <circle cx="208" cy="103" r="4" fill="rgba(220,205,185,0.35)" />
        <circle cx="194" cy="118" r="2.6" fill="rgba(220,205,185,0.3)" />
      </g>
      {STARS.map((s, i) => (
        <motion.circle
          key={i}
          cx={s.x} cy={s.y} r={s.r} fill="rgba(255,255,255,0.95)"
          animate={{ opacity: [s.o, s.o * 0.28, s.o] }}
          transition={{ duration: 2.6 + (i % 5) * 0.7, repeat: Infinity, ease: 'easeInOut', delay: (i * 0.5) % 3 }}
        />
      ))}

      {/* GROUND — bleeds past the viewBox so it fills the bottom corners.
          Mostly grass field, with a small tarmac apron in the foreground. */}
      <rect x="-800" y={GRASS_Y} width="3200" height={APRON_Y - GRASS_Y} fill="url(#af-grass)" />
      <rect x="-800" y={APRON_Y} width="3200" height={900 - APRON_Y + 200} fill="url(#af-tarmac)" />
      <rect x="-800" y={APRON_Y} width="3200" height="2" fill="rgba(255,255,255,0.06)" />

      <TaxiwayLights />
      <Tower />
      <Windsock />
      <Hangar />

      {/* Plane parked in the hangar mouth — bobs gently; nav lights blink with it */}
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <image href={planeWebp} x={PX} y={PY} width={PW} height={PH} preserveAspectRatio="xMidYMax meet" />
        {/* red anti-collision beacon (top), green starboard, red port */}
        <NavLight cx={310} cy={786} r={2.4} core="#ff5038" glow="rgba(255,70,50,0.5)" dur={1.2} />
        <NavLight cx={400} cy={812} r={2.4} core="#46e07a" glow="rgba(70,224,122,0.5)" dur={2.4} delay={0.3} />
        <NavLight cx={236} cy={812} r={2.4} core="#ff5038" glow="rgba(255,70,50,0.5)" dur={2.4} delay={1.4} />
      </motion.g>
    </svg>
  );
}

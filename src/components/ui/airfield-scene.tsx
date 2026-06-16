'use client';

import { motion } from 'framer-motion';
import { getPlaneViewAsset } from '@/lib/plane-progression';

// Single consolidated lobby airfield: ground + hangar + parked plane + control
// tower + windsock + twinkling stars, ALL in one coordinate system so they stay
// locked together and scale as a unit at every screen size. (The moon comes
// from SkyBackground via showMoon, for consistency with the cruising phase.)
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

// Twinkling stars in the upper sky (over the SkyBackground dusk)
const STARS = [
  { x: 90, y: 55, r: 1.7, o: 0.9 }, { x: 175, y: 110, r: 1.1, o: 0.65 },
  { x: 250, y: 160, r: 1.3, o: 0.7 }, { x: 330, y: 70, r: 1.5, o: 0.85 },
  { x: 410, y: 130, r: 1.0, o: 0.6 }, { x: 480, y: 200, r: 1.2, o: 0.62 },
  { x: 560, y: 55, r: 1.5, o: 0.82 }, { x: 640, y: 120, r: 1.1, o: 0.66 },
  { x: 720, y: 185, r: 1.3, o: 0.7 }, { x: 800, y: 75, r: 1.2, o: 0.72 },
  { x: 880, y: 145, r: 1.4, o: 0.78 }, { x: 960, y: 60, r: 1.0, o: 0.6 },
  { x: 1040, y: 200, r: 1.2, o: 0.64 }, { x: 1120, y: 95, r: 1.5, o: 0.82 },
  { x: 1200, y: 160, r: 1.1, o: 0.66 }, { x: 1280, y: 65, r: 1.3, o: 0.74 },
  { x: 1360, y: 130, r: 1.2, o: 0.68 }, { x: 1440, y: 80, r: 1.5, o: 0.8 },
  { x: 1510, y: 175, r: 1.0, o: 0.6 }, { x: 1560, y: 45, r: 1.3, o: 0.72 },
  { x: 60, y: 200, r: 1.1, o: 0.6 }, { x: 300, y: 250, r: 1.0, o: 0.55 },
  { x: 1080, y: 260, r: 1.1, o: 0.58 }, { x: 1330, y: 230, r: 1.0, o: 0.56 },
] as const;

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
  // Planted halfway up the grass field (not on the horizon) so it reads as a
  // foreground structure and stays clear of the city skyline behind it.
  return (
    <g transform={`translate(1380,${(GRASS_Y + APRON_Y) / 2 - 410}) scale(0.5)`}>
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

// LessonCaptain brandmark "L" (recoloured white for the sock band), matching the
// windsock used in the World Flight runway scenes.
const WS_L_MARK =
  'M219.446 106.025C181.592 152.266 185.378 164.679 185.378 200.255V219.212L185.431 247.015V393.448H313.45H425.749C425.749 483.255 396.728 484.274 259.254 487.058L92.0049 487.058L92.0538 247.015L92 219.212L92.0049 200.255C92.2726 143.132 123.314 101.932 187.012 71.6172C235.218 43.9858 337.128 31.308 345.625 43.9858C345.625 43.9858 257.3 59.7832 219.446 106.025ZM145 200.255V219.212V434.056H298.939C387.895 434.056 397.477 422.127 396.831 424.571C390.991 446.694 342.471 446.694 313.45 446.694H132.382V219.212V200.255C132.382 161.672 144.189 138.51 172.024 114.208C199.858 90.4074 207.987 87.7665 209.983 90.2271C183.485 114.208 145 133.828 145 200.255Z';

// ── Windsock — LessonCaptain blue + white carrying the "L" mark, foreground
//    apron (matches the runway-scene windsock). Volumetric fabric with a gravity
//    droop + top sheen; streams left and flutters from the swivel mount. ───────
function Windsock() {
  const poleX = 1330;
  const baseY = FORE_Y;        // planted on the foreground apron
  const topY = baseY - 150;
  // Billowing tapered cone streaming left from the mount (x = 0), gravity droop.
  const xs = [0, -30, -58, -84, -110, -152];
  const hs = [24, 20, 16, 12, 8, 3];
  const sag = (x: number) => 9 * Math.pow(Math.abs(x) / 152, 1.4);
  const yT = xs.map((x, i) => +(sag(x) - hs[i]).toFixed(2));
  const yB = xs.map((x, i) => +(sag(x) + hs[i]).toFixed(2));
  const fills = ['url(#af-ws-blue)', 'url(#af-ws-white)', 'url(#af-ws-blue)', 'url(#af-ws-white)', 'url(#af-ws-blue)'];
  const bands = fills.map((fill, i) => (
    <path key={i} d={`M ${xs[i]} ${yT[i]} L ${xs[i + 1]} ${yT[i + 1]} L ${xs[i + 1]} ${yB[i + 1]} L ${xs[i]} ${yB[i]} Z`} fill={fill} />
  ));
  const topEdge = `M ${xs[0]} ${yT[0]} ` + xs.slice(1).map((x, i) => `L ${x} ${yT[i + 1]}`).join(' ');
  const seams = xs.slice(1, -1).map((x, i) => (
    <line key={i} x1={x} y1={yT[i + 1]} x2={x} y2={yB[i + 1]} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />
  ));

  const sock = (
    <g>
      {/* dark interior at the mouth opening */}
      <ellipse cx={-2} cy={0} rx={5} ry={24} fill="#1d3650" />
      {bands}
      {seams}
      {/* sheen along the top edge */}
      <path d={topEdge} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round" />
      {/* metal mouth ring */}
      <ellipse cx={0} cy={0} rx={4} ry={24} fill="none" stroke="#262b33" strokeWidth={3} />
      <ellipse cx={-0.6} cy={0} rx={4} ry={24} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
      {/* LessonCaptain "L" on the mouth band */}
      <g transform="translate(-15,0) scale(0.06) translate(-259,-259)">
        <path d={WS_L_MARK} fill="#F2F6FC" />
      </g>
    </g>
  );

  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="af-ws-pole" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#646d7a" />
          <stop offset="0.45" stopColor="#3a4048" />
          <stop offset="1" stopColor="#22262d" />
        </linearGradient>
        <linearGradient id="af-ws-blue" gradientUnits="userSpaceOnUse" x1="0" y1="-24" x2="0" y2="24">
          <stop offset="0" stopColor="#8ec9ff" />
          <stop offset="0.5" stopColor="#4DA3FF" />
          <stop offset="1" stopColor="#2b76c2" />
        </linearGradient>
        <linearGradient id="af-ws-white" gradientUnits="userSpaceOnUse" x1="0" y1="-24" x2="0" y2="24">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#eef4fb" />
          <stop offset="1" stopColor="#c6d4e6" />
        </linearGradient>
      </defs>
      {/* ground shadow */}
      <ellipse cx={poleX} cy={baseY + 7} rx={28} ry={5} fill="rgba(0,0,0,0.18)" />
      {/* concrete footing */}
      <polygon points={`${poleX - 12},${baseY + 6} ${poleX + 12},${baseY + 6} ${poleX + 8},${baseY - 6} ${poleX - 8},${baseY - 6}`} fill="#454b54" />
      <rect x={poleX - 9} y={baseY - 8} width={18} height={4} fill="#2f343b" />
      {/* tapered metal pole */}
      <polygon points={`${poleX - 3.5},${baseY - 6} ${poleX + 3.5},${baseY - 6} ${poleX + 2.5},${topY} ${poleX - 2.5},${topY}`} fill="url(#af-ws-pole)" />
      {/* swivel mount */}
      <circle cx={poleX} cy={topY} r={5.5} fill="#2f343b" />
      <circle cx={poleX} cy={topY} r={2.4} fill="#5a626e" />
      {/* sock — flutters organically, pivoting at the mount */}
      <g transform={`translate(${poleX} ${topY})`}>
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}
          animate={{ rotate: [-3.5, 5.5, 1, 7, -1.5, -3.5] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {sock}
        </motion.g>
      </g>
    </g>
  );
}

// The airfield contents (defs + stars + ground + tower + windsock + hangar +
// parked plane), as raw SVG children in the 0 0 1600 900 coordinate system —
// WITHOUT the <svg> wrapper. Extracted so the themed lobby scene can draw a
// destination city band BEHIND this same foreground inside one shared SVG, while
// the generic AirfieldScene wrapper below stays visually byte-identical.
export function AirfieldForeground({ planeKey }: { planeKey?: string | null }) {
  // Front-facing plane parked nose-out in the hangar mouth (faces the open door).
  const planeWebp = getPlaneViewAsset(planeKey, 'front-3q');
  // mouth centre ≈ 30 + 645*0.44 = 313.8, floor = FORE_Y — sized to sit inside
  // the hangar with clear margin while keeping wide passenger aircraft legible.
  const PW = 320, PH = 180;
  const PX = 313.8 - PW / 2;
  const PY = FORE_Y - PH;

  return (
    <>
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

      {/* Twinkling stars (the moon is provided by SkyBackground for consistency) */}
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

      <Tower />
      <Windsock />
      <Hangar />

      {/* Plane parked in the hangar mouth — bobs gently */}
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <image href={planeWebp} x={PX} y={PY} width={PW} height={PH} preserveAspectRatio="xMidYMax meet" />
      </motion.g>
    </>
  );
}

export function AirfieldScene({ planeKey, className }: { planeKey?: string | null; className?: string }) {
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
      <AirfieldForeground planeKey={planeKey} />
    </svg>
  );
}

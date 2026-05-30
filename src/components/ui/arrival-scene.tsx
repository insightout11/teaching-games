'use client';

import { motion } from 'framer-motion';
import { getPlaneAsset } from '@/lib/plane-progression';

// Arrival airport — the matching bookend to the Launch Lobby (departure).
// Forward-facing perspective RUNWAY receding toward the horizon at SUNRISE,
// with a small distant city skyline at the vanishing line (so it reads as a
// new destination without bespoke per-topic art). The plane has landed and is
// taxiing off in the foreground. Sits on the locked landing/sunrise sky.
//
// Same architecture as airfield-scene: one viewBox (1600x900, xMidYMax meet),
// ground bleeds past the viewBox; the wrapper clips it.

const HORIZON = 470;        // sky / ground meet; runway vanishing line
const VP_X = 800;           // vanishing point x (centre)
// Runway trapezoid (1-point perspective)
const RW_NEAR_L = 470, RW_NEAR_R = 1130, RW_NEAR_Y = 900;
const RW_FAR_L = 773, RW_FAR_R = 827, RW_FAR_Y = 486;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Distant low city skyline sitting on the horizon
function makeSkyline(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const b: { x: number; w: number; h: number }[] = [];
  let x = -60;
  while (x < 1660) {
    const w = 28 + Math.floor(rnd() * 52);
    const h = 30 + Math.floor(rnd() * 120);
    b.push({ x, w, h });
    x += w + 4 + Math.floor(rnd() * 18);
  }
  return b;
}

function Skyline({ seed }: { seed: number }) {
  const buildings = makeSkyline(seed);
  return (
    <g>
      {buildings.map((b, i) => {
        const top = HORIZON - b.h;
        const tall = b.h > 110;
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h} fill="#171f2c" opacity="0.92" />
            <rect x={b.x} y={top} width={b.w} height="1.5" fill="rgba(255,180,120,0.10)" />
            {/* a couple of lit windows */}
            {b.h > 60 && (i % 2 === 0) && (
              <>
                <rect x={b.x + 5} y={top + 10} width="4" height="6" fill="rgba(255,200,120,0.4)" />
                <rect x={b.x + b.w - 9} y={top + 22} width="4" height="6" fill="rgba(150,200,235,0.35)" />
              </>
            )}
            {tall && (
              <motion.circle
                cx={b.x + b.w / 2} cy={top - 3} r="2.5" fill="#ff5038"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.6 + (i % 3) * 0.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

// ARRIVALS board on posts (destination name optional)
function ArrivalsBoard({ destination }: { destination?: string }) {
  const bx = 1230, by = 560, bw = 250, bh = 80;
  return (
    <g>
      <rect x={bx + 20} y={by + bh} width="6" height={760 - (by + bh)} fill="#161c25" />
      <rect x={bx + bw - 26} y={by + bh} width="6" height={760 - (by + bh)} fill="#161c25" />
      <rect x={bx} y={by} width={bw} height={bh} rx="6" fill="#0b1018" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
      <rect x={bx} y={by} width={bw} height="20" rx="6" fill="#10202c" />
      <text x={bx + 12} y={by + 14} fill="#46c8e6" fontFamily="monospace" fontSize="11" fontWeight="bold" letterSpacing="2">✈ ARRIVALS</text>
      <text x={bx + bw - 12} y={by + 14} fill="rgba(255,255,255,0.35)" fontFamily="monospace" fontSize="10" textAnchor="end">LC-1038</text>
      <text x={bx + bw / 2} y={by + 50} fill="#ffd27a" fontFamily="monospace" fontSize="19" fontWeight="bold" textAnchor="middle" letterSpacing="1">
        {destination ? destination.toUpperCase() : 'WELCOME'}
      </text>
      <text x={bx + bw / 2} y={by + 69} fill="#46e07a" fontFamily="monospace" fontSize="10" textAnchor="middle" letterSpacing="2">● LANDED · ON TIME</text>
    </g>
  );
}

export function ArrivalScene({ planeKey, destination, seed = 1, className }: {
  planeKey?: string | null; destination?: string; seed?: number; className?: string;
}) {
  const planeWebp = getPlaneAsset(planeKey).webp;

  // Perspective edge lights down both runway sides (near→far, shrinking)
  const ts = [0, 0.16, 0.31, 0.44, 0.55, 0.65, 0.74, 0.82];
  const edge = ts.map((t) => ({
    lx: lerp(RW_NEAR_L, RW_FAR_L, t),
    rx: lerp(RW_NEAR_R, RW_FAR_R, t),
    y: lerp(RW_NEAR_Y, RW_FAR_Y, t),
    r: lerp(4.5, 1, t),
  }));

  // Perspective centreline dashes
  const cts = [0.02, 0.14, 0.27, 0.4, 0.52, 0.63, 0.73];
  const center = cts.map((t) => ({
    y: lerp(RW_NEAR_Y - 30, RW_FAR_Y, t),
    h: lerp(34, 4, t),
    w: lerp(11, 2, t),
  }));

  // Landed plane taxiing off in the lower-left foreground
  const PW = 300, PH = 150, PCX = 430;
  const PX = PCX - PW / 2, PY = 900 - PH;

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
        <linearGradient id="ar-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2620" />
          <stop offset="0.18" stopColor="#1d2a22" />
          <stop offset="1" stopColor="#0c140e" />
        </linearGradient>
        <linearGradient id="ar-runway" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3340" />
          <stop offset="1" stopColor="#0e141c" />
        </linearGradient>
        <filter id="ar-bulb" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Distant city skyline at the horizon (sunrise) */}
      <Skyline seed={seed} />

      {/* GROUND — grassy airfield, bleeds past the viewBox to fill corners */}
      <rect x="-800" y={HORIZON} width="3200" height={900 - HORIZON + 200} fill="url(#ar-ground)" />

      {/* RUNWAY — forward-facing 1-point perspective */}
      <polygon
        points={`${RW_NEAR_L},${RW_NEAR_Y} ${RW_NEAR_R},${RW_NEAR_Y} ${RW_FAR_R},${RW_FAR_Y} ${RW_FAR_L},${RW_FAR_Y}`}
        fill="url(#ar-runway)"
      />
      {/* threshold "piano keys" at the near end */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={RW_NEAR_L + 40 + i * 86} y={RW_NEAR_Y - 34} width="34" height="30" fill="rgba(255,255,255,0.16)" />
      ))}
      {/* centreline dashes */}
      {center.map((d, i) => (
        <rect key={i} x={VP_X - d.w / 2} y={d.y - d.h} width={d.w} height={d.h} rx="1" fill="rgba(255,255,255,0.5)" />
      ))}
      {/* edge lights */}
      <g filter="url(#ar-bulb)">
        {edge.map((p, i) => (
          <g key={i}>
            <circle cx={p.lx} cy={p.y} r={p.r} fill="#bfe0ff" />
            <circle cx={p.rx} cy={p.y} r={p.r} fill="#bfe0ff" />
          </g>
        ))}
      </g>

      <ArrivalsBoard destination={destination} />

      {/* Landed plane taxiing off — bobs gently */}
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <image href={planeWebp} x={PX} y={PY} width={PW} height={PH} preserveAspectRatio="xMidYMax meet" />
      </motion.g>
    </svg>
  );
}

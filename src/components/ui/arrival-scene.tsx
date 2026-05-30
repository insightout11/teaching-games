'use client';

import { motion } from 'framer-motion';
import { getPlaneAsset } from '@/lib/plane-progression';

// Arrival airfield — the matching bookend to the Launch Lobby (departure).
// The overnight flight has landed at SUNRISE at a *new destination*: a generic
// city skyline on the horizon (so it reads as "somewhere new" without bespoke
// per-topic art), big-city tarmac, the plane landed in the foreground, and an
// ARRIVALS board. Sits on the locked landing/sunrise SkyBackground.
//
// Same architecture as airfield-scene: one viewBox (1600x900, xMidYMax meet),
// depth-staged near/far, ground bleeds past the viewBox; wrapper clips it.

const HORIZON_Y = 560; // skyline base / where the distant city meets the ground
const APRON_Y = 600;   // start of the foreground tarmac apron
const FORE_Y = 884;    // foreground line — landed plane sits here

// Deterministic skyline so a given session always looks the same, but different
// seeds feel like different cities.
function makeSkyline(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const buildings: { x: number; w: number; h: number }[] = [];
  let x = -60;
  while (x < 1660) {
    const w = 34 + Math.floor(rnd() * 64);
    const h = 70 + Math.floor(rnd() * 230);
    buildings.push({ x, w, h });
    x += w + 4 + Math.floor(rnd() * 20);
  }
  return buildings;
}

function Skyline({ seed }: { seed: number }) {
  const buildings = makeSkyline(seed);
  return (
    <g>
      {buildings.map((b, i) => {
        const top = HORIZON_Y - b.h;
        const tall = b.h > 220;
        // sparse lit windows
        const winCols = Math.max(1, Math.floor(b.w / 16));
        const winRows = Math.max(1, Math.floor(b.h / 26));
        const windows = [];
        for (let r = 0; r < winRows; r++) {
          for (let c = 0; c < winCols; c++) {
            if ((i + r * 3 + c * 5) % 4 !== 0) continue; // ~1/4 lit
            windows.push(
              <rect
                key={`${r}-${c}`}
                x={b.x + 6 + c * 16}
                y={top + 10 + r * 26}
                width="6" height="9" rx="1"
                fill={(i + c) % 2 ? 'rgba(255,200,120,0.45)' : 'rgba(150,200,235,0.4)'}
              />
            );
          }
        }
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h} fill="#1a2230" />
            <rect x={b.x} y={top} width={b.w} height="2" fill="rgba(255,180,120,0.12)" />
            {windows}
            {tall && (
              <motion.circle
                cx={b.x + b.w / 2} cy={top - 4} r="3"
                fill="#ff5038"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.6 + (i % 3) * 0.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </g>
        );
      })}
      {/* atmospheric haze over the base of the skyline */}
      <rect x="-200" y={HORIZON_Y - 60} width="2000" height="60" fill="url(#ar-haze)" />
    </g>
  );
}

// ARRIVALS board on posts (destination name optional)
function ArrivalsBoard({ destination }: { destination?: string }) {
  const bx = 1150, by = 632, bw = 300, bh = 96;
  return (
    <g>
      {/* posts */}
      <rect x={bx + 24} y={by + bh} width="7" height={FORE_Y - (by + bh)} fill="#1b222b" />
      <rect x={bx + bw - 31} y={by + bh} width="7" height={FORE_Y - (by + bh)} fill="#1b222b" />
      {/* board */}
      <rect x={bx} y={by} width={bw} height={bh} rx="6" fill="#0b1018" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
      <rect x={bx} y={by} width={bw} height="22" rx="6" fill="#10202c" />
      <text x={bx + 14} y={by + 16} fill="#46c8e6" fontFamily="monospace" fontSize="12" fontWeight="bold" letterSpacing="2">✈ ARRIVALS</text>
      <text x={bx + bw - 14} y={by + 16} fill="rgba(255,255,255,0.35)" fontFamily="monospace" fontSize="11" textAnchor="end">LC-1038</text>
      <text x={bx + bw / 2} y={by + 58} fill="#ffd27a" fontFamily="monospace" fontSize="22" fontWeight="bold" textAnchor="middle" letterSpacing="1">
        {destination ? destination.toUpperCase() : 'WELCOME'}
      </text>
      <text x={bx + bw / 2} y={by + 80} fill="#46e07a" fontFamily="monospace" fontSize="11" textAnchor="middle" letterSpacing="2">● LANDED · ON TIME</text>
    </g>
  );
}

export function ArrivalScene({ planeKey, destination, seed = 1, className }: {
  planeKey?: string | null; destination?: string; seed?: number; className?: string;
}) {
  const planeWebp = getPlaneAsset(planeKey).webp;
  // Landed plane in the foreground, left of centre (clear of the summary card)
  const PW = 300, PH = 150;
  const PCX = 360;
  const PX = PCX - PW / 2;
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
        <linearGradient id="ar-tarmac" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a26" />
          <stop offset="0.25" stopColor="#222a36" />
          <stop offset="1" stopColor="#0f151d" />
        </linearGradient>
        <linearGradient id="ar-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,150,90,0)" />
          <stop offset="1" stopColor="rgba(255,150,90,0.22)" />
        </linearGradient>
        <radialGradient id="ar-sheen" cx="0.5" cy="0" r="0.9">
          <stop offset="0" stopColor="rgba(255,160,90,0.20)" />
          <stop offset="1" stopColor="rgba(255,160,90,0)" />
        </radialGradient>
        <filter id="ar-bulb" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Distant city skyline at sunrise */}
      <Skyline seed={seed} />

      {/* GROUND — big-city tarmac apron (bleeds past viewBox to fill corners) */}
      <rect x="-800" y={APRON_Y} width="3200" height={900 - APRON_Y + 200} fill="url(#ar-tarmac)" />
      {/* warm sunrise sheen reflecting on the tarmac near the horizon */}
      <rect x="-800" y={APRON_Y} width="3200" height="200" fill="url(#ar-sheen)" />
      <rect x="-800" y={APRON_Y} width="3200" height="2" fill="rgba(255,190,130,0.10)" />

      <ArrivalsBoard destination={destination} />

      {/* Landed plane in the foreground — bobs gently */}
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <image href={planeWebp} x={PX} y={PY} width={PW} height={PH} preserveAspectRatio="xMidYMax meet" />
      </motion.g>
    </svg>
  );
}

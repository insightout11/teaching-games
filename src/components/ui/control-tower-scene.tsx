'use client';

import { motion } from 'framer-motion';

// Air-traffic control tower + windsock, drawn as a bounded scene to balance
// the hangar on the opposite side of the lobby. Fills its parent wrapper
// (which sizes + positions it on the runway); viewBox 0 0 480 820 with the
// bases flush at the bottom (y=820) so both sit on the same ground line.
//
//   Tower (right, ~x340) — tall, slender tapered shaft, overhanging glass
//     cab (cool teal glow to contrast the hangar's warm amber), roof,
//     antenna mast + pulsing red beacon
//   Windsock (left, ~x180) — shorter pole; striped sock streams LEFT
//     (downwind — the clouds drift left), fluttering from its mount

export function ControlTowerScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 820"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMax meet"
      className={`pointer-events-none select-none ${className ?? ''}`}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="cts-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4655" />
          <stop offset="0.55" stopColor="#28323e" />
          <stop offset="1" stopColor="#1b222b" />
        </linearGradient>
        <linearGradient id="cts-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(120,210,230,0.80)" />
          <stop offset="1" stopColor="rgba(45,120,150,0.80)" />
        </linearGradient>
        <radialGradient id="cts-beam" cx="0.5" cy="1" r="1">
          <stop offset="0" stopColor="rgba(150,225,245,0.55)" />
          <stop offset="1" stopColor="rgba(150,225,245,0)" />
        </radialGradient>
        <filter id="cts-soft" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="cts-bulb" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── WINDSOCK (streams LEFT, downwind) ─────────────────────────────── */}
      <rect x="170" y="814" width="20" height="8" rx="2" fill="#1b222b" />
      <rect x="177" y="505" width="6" height="315" fill="url(#cts-metal)" />
      <circle cx="180" cy="515" r="5" fill="none" stroke="#2a333f" strokeWidth="3" />
      {/* Fluttering sock — origin at the pole (right center) */}
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

      {/* ── CONTROL TOWER ─────────────────────────────────────────────────── */}
      {/* Base plinth */}
      <polygon points="298,820 382,820 372,793 308,793" fill="#161c25" />
      {/* Slender tapered shaft */}
      <polygon points="305,820 375,820 356,250 324,250" fill="url(#cts-metal)" />
      {/* Shaft edge highlight */}
      <polygon points="305,820 312,820 326,250 324,250" fill="rgba(255,255,255,0.05)" />
      {/* Shaft floor seams */}
      {([{ y: 380, l: 320, r: 360 }, { y: 500, l: 316, r: 364 }, { y: 620, l: 312, r: 368 }, { y: 720, l: 308, r: 372 }] as const).map(
        ({ y, l, r }) => (
          <rect key={y} x={l} y={y} width={r - l} height="2" fill="rgba(0,0,0,0.3)" />
        )
      )}
      {/* Lit shaft windows */}
      <rect x="334" y="290" width="12" height="24" rx="1.5" fill="rgba(120,200,225,0.5)" />
      <rect x="334" y="340" width="12" height="24" rx="1.5" fill="rgba(120,200,225,0.4)" />

      {/* Sweeping beacon searchlight from the cab (behind the cab structure) */}
      <motion.g
        style={{ transformBox: 'view-box', transformOrigin: '340px 205px' }}
        animate={{ rotate: [-30, 30, -30] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.polygon
          points="340,205 298,52 382,52"
          fill="url(#cts-beam)"
          filter="url(#cts-soft)"
          animate={{ opacity: [0.1, 0.32, 0.1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.g>

      {/* Cab (overhanging control room) */}
      <polygon points="322,250 310,200 318,150 362,150 370,200 358,250" fill="url(#cts-metal)" />
      {/* Glass glow halo */}
      <ellipse cx="340" cy="200" rx="48" ry="44" fill="rgba(110,205,230,0.22)" filter="url(#cts-soft)" />
      {/* Lit glass */}
      <polygon points="325,243 318,200 324,158 356,158 362,200 355,243" fill="url(#cts-glass)" />
      {/* Mullions */}
      {([332, 340, 348] as const).map((x) => (
        <rect key={x} x={x - 1} y="158" width="2" height="85" fill="rgba(15,30,40,0.55)" />
      ))}
      <rect x="322" y="199" width="36" height="2" fill="rgba(15,30,40,0.55)" />

      {/* Roof slab + lip */}
      <rect x="308" y="138" width="64" height="12" rx="2" fill="#222b36" />
      <rect x="303" y="131" width="74" height="7" rx="2" fill="#2c3744" />

      {/* Antenna mast */}
      <rect x="338.5" y="90" width="3" height="48" fill="#2a333f" />
      <circle cx="340" cy="90" r="3" fill="#3a4655" />
      {/* Pulsing red beacon */}
      <motion.g
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="340" cy="82" r="12" fill="rgba(255,70,50,0.45)" filter="url(#cts-bulb)" />
        <circle cx="340" cy="82" r="3.5" fill="#ff5038" />
      </motion.g>
    </svg>
  );
}

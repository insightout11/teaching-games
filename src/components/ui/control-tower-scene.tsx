'use client';

import { motion } from 'framer-motion';

// Air-traffic control tower + windsock, drawn as a bounded scene to balance
// the hangar on the opposite side of the lobby. Fills its parent wrapper
// (which sizes + positions it on the runway); viewBox 0 0 460 700 with the
// bases flush at the bottom (y=700) so both sit on the same ground line.
//
//   Windsock (left, ~x110) — striped sock fluttering on a pole
//   Tower    (right, ~x330) — tapered shaft, overhanging glass cab (cool
//                             teal glow to contrast the hangar's warm amber),
//                             roof, antenna mast + pulsing red beacon

export function ControlTowerScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 460 700"
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
          <stop offset="0" stopColor="rgba(120,210,230,0.78)" />
          <stop offset="1" stopColor="rgba(45,120,150,0.78)" />
        </linearGradient>
        <filter id="cts-soft" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="cts-bulb" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── WINDSOCK ──────────────────────────────────────────────────────── */}
      {/* Pole */}
      <rect x="107" y="306" width="6" height="394" fill="url(#cts-metal)" />
      <rect x="100" y="694" width="20" height="8" rx="2" fill="#1b222b" />
      {/* Mount ring */}
      <circle cx="113" cy="316" r="5" fill="none" stroke="#2a333f" strokeWidth="3" />
      {/* Fluttering sock — origin at the pole attachment (left center) */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'left center' }}
        animate={{ rotate: [0, 3.5, 0, -2, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <polygon points="113,301 150,304 150,331 113,332" fill="#e07b1e" />
        <polygon points="150,304 184,308 184,329 150,331" fill="rgba(244,238,230,0.92)" />
        <polygon points="184,308 213,313 213,327 184,329" fill="#e07b1e" />
        <polygon points="213,313 238,319 213,327" fill="rgba(244,238,230,0.92)" />
      </motion.g>

      {/* ── CONTROL TOWER ─────────────────────────────────────────────────── */}
      {/* Base plinth */}
      <polygon points="288,700 372,700 362,676 298,676" fill="#161c25" />
      {/* Shaft */}
      <polygon points="295,700 365,700 348,236 312,236" fill="url(#cts-metal)" />
      {/* Shaft edge highlight */}
      <polygon points="295,700 301,700 314,236 312,236" fill="rgba(255,255,255,0.05)" />
      {/* Shaft floor seams */}
      {([{ y: 340, l: 308, r: 352 }, { y: 450, l: 304, r: 356 }, { y: 560, l: 300, r: 360 }] as const).map(
        ({ y, l, r }) => (
          <rect key={y} x={l} y={y} width={r - l} height="2" fill="rgba(0,0,0,0.3)" />
        )
      )}
      {/* A couple of lit shaft windows */}
      <rect x="324" y="300" width="12" height="22" rx="1.5" fill="rgba(120,200,225,0.5)" />
      <rect x="324" y="360" width="12" height="22" rx="1.5" fill="rgba(120,200,225,0.4)" />

      {/* Cab (overhanging control room) */}
      <polygon points="300,236 290,193 297,150 363,150 370,193 360,236" fill="url(#cts-metal)" />
      {/* Glass glow halo */}
      <ellipse cx="330" cy="193" rx="44" ry="40" fill="rgba(110,205,230,0.22)" filter="url(#cts-soft)" />
      {/* Lit glass */}
      <polygon points="303,228 296,193 302,158 358,158 364,193 357,228" fill="url(#cts-glass)" />
      {/* Mullions */}
      {([314, 330, 346] as const).map((x) => (
        <rect key={x} x={x - 1} y="158" width="2" height="70" fill="rgba(15,30,40,0.55)" />
      ))}
      <rect x="300" y="192" width="62" height="2" fill="rgba(15,30,40,0.55)" />

      {/* Roof slab + lip */}
      <rect x="288" y="138" width="84" height="12" rx="2" fill="#222b36" />
      <rect x="284" y="132" width="92" height="7" rx="2" fill="#2c3744" />

      {/* Antenna mast */}
      <rect x="328.5" y="98" width="3" height="36" fill="#2a333f" />
      <circle cx="330" cy="98" r="3" fill="#3a4655" />
      {/* Pulsing red beacon */}
      <motion.g
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="330" cy="92" r="11" fill="rgba(255,70,50,0.45)" filter="url(#cts-bulb)" />
        <circle cx="330" cy="92" r="3.5" fill="#ff5038" />
      </motion.g>
    </svg>
  );
}

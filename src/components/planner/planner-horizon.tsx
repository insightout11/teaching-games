'use client';

import { motion } from 'framer-motion';

// Distant departure airfield on the horizon for the planner — the field you're
// about to fly out of, seen across the way at dusk. Spread across the full width
// (hangar + windsock + control tower) as small dark silhouettes against the
// sunset sky (provided by SkyBackground behind). Full-bleed, pinned to the
// bottom; ambient and behind the content.

const GY = 780; // horizon / ground line

export function PlannerHorizon({ className }: { className?: string }) {
  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none select-none ${className ?? ''}`}
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <svg viewBox="0 0 1600 900" width="100%" height="100%" preserveAspectRatio="xMidYMax slice" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="ph-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#13241a" />
            <stop offset="1" stopColor="#070b0e" />
          </linearGradient>
          <linearGradient id="ph-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a2230" />
            <stop offset="1" stopColor="#0a0f16" />
          </linearGradient>
        </defs>

        {/* distant ground / grass field */}
        <rect x="-200" y={GY - 4} width="2000" height="6" fill="rgba(255,170,90,0.10)" />
        <rect x="-200" y={GY} width="2000" height="200" fill="url(#ph-ground)" />

        {/* faint distant runway edge lights along the horizon */}
        {[120, 300, 560, 1000, 1320, 1520].map((x) => (
          <circle key={x} cx={x} cy={GY + 10} r="1.6" fill="rgba(255,190,110,0.4)" />
        ))}

        {/* ── HANGAR (left) ─────────────────────────────────────────────── */}
        <g>
          <path d={`M328,${GY} L328,${GY - 34} Q386,${GY - 70} 444,${GY - 34} L444,${GY} Z`} fill="#0c1219" />
          <path d={`M328,${GY - 34} Q386,${GY - 70} 444,${GY - 34}`} fill="none" stroke="rgba(255,170,90,0.22)" strokeWidth="1.5" />
        </g>

        {/* ── WINDSOCK (centre) ─────────────────────────────────────────── */}
        <g>
          <rect x="798" y={GY - 50} width="4" height="50" fill="url(#ph-metal)" />
          <polygon points={`802,${GY - 48} 778,${GY - 46} 778,${GY - 36} 802,${GY - 34}`} fill="#e07b1e" opacity="0.9" />
          <polygon points={`778,${GY - 46} 762,${GY - 44} 762,${GY - 38} 778,${GY - 36}`} fill="rgba(244,238,230,0.8)" />
          <polygon points={`762,${GY - 44} 750,${GY - 41} 762,${GY - 38}`} fill="#e07b1e" opacity="0.9" />
        </g>

        {/* ── CONTROL TOWER (right) ─────────────────────────────────────── */}
        <g>
          <polygon points={`1214,${GY} 1228,${GY} 1226,${GY - 92} 1216,${GY - 92}`} fill="url(#ph-metal)" />
          <polygon points={`1212,${GY - 92} 1209,${GY - 110} 1215,${GY - 126} 1227,${GY - 126} 1233,${GY - 110} 1230,${GY - 92}`} fill="url(#ph-metal)" />
          <polygon points={`1215,${GY - 96} 1213,${GY - 110} 1217,${GY - 122} 1225,${GY - 122} 1229,${GY - 110} 1227,${GY - 96}`} fill="rgba(110,205,230,0.55)" />
          <rect x="1220" y={GY - 142} width="2.5" height="16" fill="#2a333f" />
          <motion.circle cx="1221" cy={GY - 144} r="2.4" fill="#ff5038"
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }} />
        </g>

        {/* small distant hangar far right (balance) */}
        <path d={`M1470,${GY} L1470,${GY - 22} Q1505,${GY - 44} 1540,${GY - 22} L1540,${GY} Z`} fill="#0a1017" />
      </svg>
    </div>
  );
}

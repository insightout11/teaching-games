'use client';

import { motion } from 'framer-motion';
import type { PlannerStep } from '@/stores/planner-store';

// Mission Control / ops-room backdrop for the planner — the captain plans the
// flight before heading to the airfield. A slow radar sweep, a plotting grid, a
// route from origin → destination, and a warm dusk glow through the "window".
// Progresses with the step:
//   mission-setup → destination pin drops (no route yet)
//   flight-plan   → route arc draws between origin and destination
//   launch        → route locked + "CLEARED FOR DEPARTURE", deeper dusk
//
// Ambient (sits behind the planner content); fills the viewport (slice).

// origin (departure) and destination markers + the great-circle-ish route arc
const ORIGIN = { x: 430, y: 470 };
const DEST = { x: 1180, y: 430 };
const ROUTE = `M${ORIGIN.x},${ORIGIN.y} Q805,250 ${DEST.x},${DEST.y}`;
const RADAR = { x: 800, y: 612 };
const RINGS = [150, 262, 374, 486] as const;

export function PlannerOpsBackground({ step, className }: { step: PlannerStep; className?: string }) {
  const routeDrawn = step !== 'mission-setup';
  const cleared = step === 'launch';
  const routeColor = cleared ? '#46e07a' : '#54d3ff';

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none select-none ${className ?? ''}`}
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <svg viewBox="0 0 1600 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="ops-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#05080f" />
            <stop offset="0.6" stopColor="#070b15" />
            <stop offset="1" stopColor="#0b0f1a" />
          </linearGradient>
          <radialGradient id="ops-dusk" cx="0.5" cy="1" r="0.9">
            <stop offset="0" stopColor="rgba(255,150,70,0.22)" />
            <stop offset="0.5" stopColor="rgba(180,80,60,0.07)" />
            <stop offset="1" stopColor="rgba(255,150,70,0)" />
          </radialGradient>
          <radialGradient id="ops-gridfade" cx="0.5" cy="0.55" r="0.65">
            <stop offset="0" stopColor="white" stopOpacity="0.9" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="ops-gridmask">
            <rect x="0" y="0" width="1600" height="900" fill="url(#ops-gridfade)" />
          </mask>
          <pattern id="ops-grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0 H0 V64" fill="none" stroke="rgba(110,170,255,0.10)" strokeWidth="1" />
          </pattern>
          <radialGradient id="ops-sweep" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
            gradientTransform={`translate(${RADAR.x} ${RADAR.y})`}>
            <stop offset="0" stopColor="rgba(84,211,255,0.28)" />
            <stop offset="1" stopColor="rgba(84,211,255,0)" />
          </radialGradient>
          <filter id="ops-soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* base + plotting grid + dusk window glow */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#ops-base)" />
        <rect x="0" y="0" width="1600" height="900" fill="url(#ops-grid)" mask="url(#ops-gridmask)" />
        <rect x="0" y="540" width="1600" height="360" fill="url(#ops-dusk)" />

        {/* ── RADAR ─────────────────────────────────────────────────────── */}
        {RINGS.map((r) => (
          <circle key={r} cx={RADAR.x} cy={RADAR.y} r={r} fill="none"
            stroke="rgba(110,190,255,0.10)" strokeWidth="1" />
        ))}
        <line x1={RADAR.x - 486} y1={RADAR.y} x2={RADAR.x + 486} y2={RADAR.y} stroke="rgba(110,190,255,0.07)" strokeWidth="1" />
        <line x1={RADAR.x} y1={RADAR.y - 486} x2={RADAR.x} y2={RADAR.y + 486} stroke="rgba(110,190,255,0.07)" strokeWidth="1" />
        {/* rotating sweep */}
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: `${RADAR.x}px ${RADAR.y}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <path d={`M${RADAR.x},${RADAR.y} L${RADAR.x + 486},${RADAR.y - 120} A486,486 0 0 1 ${RADAR.x + 486},${RADAR.y} Z`}
            fill="url(#ops-sweep)" />
        </motion.g>

        {/* ── ROUTE ─────────────────────────────────────────────────────── */}
        <motion.path
          d={ROUTE}
          fill="none"
          stroke={routeColor}
          strokeWidth="2.5"
          strokeDasharray="3 7"
          strokeLinecap="round"
          filter="url(#ops-soft)"
          initial={false}
          animate={{ pathLength: routeDrawn ? 1 : 0, opacity: routeDrawn ? 0.85 : 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* CLEARED stamp at the route apex */}
        <motion.text
          x="805" y="232" textAnchor="middle"
          fill="#46e07a" fontFamily="monospace" fontSize="15" fontWeight="bold" letterSpacing="3"
          initial={false}
          animate={{ opacity: cleared ? 0.9 : 0 }}
          transition={{ duration: 0.5 }}
        >
          ● CLEARED FOR DEPARTURE
        </motion.text>

        {/* ── ORIGIN + DESTINATION markers ──────────────────────────────── */}
        {/* origin */}
        <motion.circle cx={ORIGIN.x} cy={ORIGIN.y} r="6" fill="#54d3ff"
          animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
        <circle cx={ORIGIN.x} cy={ORIGIN.y} r="14" fill="none" stroke="rgba(84,211,255,0.4)" strokeWidth="1.5" />
        <text x={ORIGIN.x} y={ORIGIN.y + 34} textAnchor="middle" fill="rgba(120,200,255,0.5)" fontFamily="monospace" fontSize="11" letterSpacing="2">ORIGIN</text>

        {/* destination — pings in on Mission Setup */}
        <motion.circle cx={DEST.x} cy={DEST.y} r="6"
          fill={cleared ? '#46e07a' : '#ffd27a'}
          animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
        <motion.circle cx={DEST.x} cy={DEST.y} fill="none"
          stroke={cleared ? 'rgba(70,224,122,0.5)' : 'rgba(255,210,122,0.5)'} strokeWidth="1.5"
          initial={false}
          animate={{ r: [10, 26], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} />
        <text x={DEST.x} y={DEST.y - 22} textAnchor="middle" fill="rgba(255,210,122,0.55)" fontFamily="monospace" fontSize="11" letterSpacing="2">DESTINATION</text>
      </svg>
    </div>
  );
}

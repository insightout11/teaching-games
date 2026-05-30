'use client';

import { motion } from 'framer-motion';
import type { PlannerStep } from '@/stores/planner-store';

// Mission Control ROOM backdrop for the planner — ambient, never competing with
// the real content. A dark ops room whose WINDOW looks out onto the dusk
// departure airfield (the same control tower + windsock as the lobby), with a
// faint console along the bottom. The sun sets lower in the window as the
// captain progresses Mission Setup → Flight Plan → Launch.

// window geometry (lives in the right margin; sky bleeds behind the content)
const WIN = { x: 1182, y: 96, w: 396, h: 512 };
const GROUND_Y = 524; // airfield ground line inside the window

export function PlannerOpsBackground({ step, className }: { step: PlannerStep; className?: string }) {
  // sun sets lower toward departure
  const sunY = step === 'mission-setup' ? 440 : step === 'flight-plan' ? 478 : 512;

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none select-none ${className ?? ''}`}
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <svg viewBox="0 0 1600 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="ops-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0f17" />
            <stop offset="1" stopColor="#0c121d" />
          </linearGradient>
          <linearGradient id="ops-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b111b" />
            <stop offset="1" stopColor="#05080e" />
          </linearGradient>
          <linearGradient id="ops-winsky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0c1430" />
            <stop offset="0.5" stopColor="#3a1f3a" />
            <stop offset="0.8" stopColor="#7a2f1a" />
            <stop offset="1" stopColor="#bb5420" />
          </linearGradient>
          <radialGradient id="ops-winsun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(255,210,130,0.95)" />
            <stop offset="0.5" stopColor="rgba(255,150,60,0.5)" />
            <stop offset="1" stopColor="rgba(255,150,60,0)" />
          </radialGradient>
          <radialGradient id="ops-warmglow" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0" stopColor="rgba(255,150,70,0.16)" />
            <stop offset="1" stopColor="rgba(255,150,70,0)" />
          </radialGradient>
          <linearGradient id="ops-towermetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a4655" />
            <stop offset="1" stopColor="#1b222b" />
          </linearGradient>
          <clipPath id="ops-winclip">
            <rect x={WIN.x + 12} y={WIN.y + 12} width={WIN.w - 24} height={WIN.h - 24} />
          </clipPath>
        </defs>

        {/* ── ROOM ──────────────────────────────────────────────────────── */}
        <rect x="0" y="0" width="1600" height="640" fill="url(#ops-wall)" />
        <rect x="0" y="640" width="1600" height="260" fill="url(#ops-floor)" />
        <rect x="0" y="638" width="1600" height="2" fill="rgba(120,160,220,0.05)" />
        <ellipse cx={WIN.x + WIN.w / 2} cy={WIN.y + WIN.h / 2} rx="460" ry="460" fill="url(#ops-warmglow)" />

        {/* ── WINDOW onto the dusk departure airfield ───────────────────── */}
        <g>
          <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx="8" fill="#11161f" />
          <g clipPath="url(#ops-winclip)">
            <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill="url(#ops-winsky)" />
            {/* setting sun (lower as steps progress) */}
            <circle cx={1380} cy={sunY} r="150" fill="url(#ops-winsun)" />
            <circle cx={1380} cy={sunY} r="34" fill="rgba(255,230,180,0.95)" />
            {/* airfield ground */}
            <rect x={WIN.x} y={GROUND_Y - 8} width={WIN.w} height="8" fill="#1e3c22" />
            <rect x={WIN.x} y={GROUND_Y} width={WIN.w} height={WIN.h} fill="#10202c" />

            {/* runway waypoint / approach lights receding to the horizon */}
            {([{ y: GROUND_Y + 64, dx: 70, r: 3 }, { y: GROUND_Y + 42, dx: 52, r: 2.5 }, { y: GROUND_Y + 24, dx: 38, r: 2 }, { y: GROUND_Y + 10, dx: 27, r: 1.6 }, { y: GROUND_Y + 0, dx: 19, r: 1.3 }] as const).map((d, i) => (
              <g key={i}>
                <circle cx={1380 - d.dx} cy={d.y} r={d.r} fill="rgba(120,200,255,0.85)" />
                <circle cx={1380 + d.dx} cy={d.y} r={d.r} fill="rgba(120,200,255,0.85)" />
                <rect x={1380 - d.r / 2} y={d.y - d.r / 2} width={d.r} height={d.r * 2} rx="0.5" fill="rgba(255,255,255,0.4)" />
              </g>
            ))}

            {/* WINDSOCK (real, streams left) */}
            <rect x={1452} y={GROUND_Y - 56} width="4" height="56" fill="url(#ops-towermetal)" />
            <polygon points={`1456,${GROUND_Y - 54} 1432,${GROUND_Y - 52} 1432,${GROUND_Y - 40} 1456,${GROUND_Y - 38}`} fill="#e07b1e" />
            <polygon points={`1432,${GROUND_Y - 52} 1414,${GROUND_Y - 50} 1414,${GROUND_Y - 42} 1432,${GROUND_Y - 40}`} fill="rgba(244,238,230,0.9)" />
            <polygon points={`1414,${GROUND_Y - 50} 1400,${GROUND_Y - 46} 1414,${GROUND_Y - 42}`} fill="#e07b1e" />

            {/* CONTROL TOWER (real — slender shaft, teal cab, pulsing beacon) */}
            <polygon points={`1515,${GROUND_Y} 1531,${GROUND_Y} 1528,${GROUND_Y - 120} 1518,${GROUND_Y - 120}`} fill="url(#ops-towermetal)" />
            <polygon points={`1514,${GROUND_Y - 120} 1511,${GROUND_Y - 140} 1516,${GROUND_Y - 158} 1530,${GROUND_Y - 158} 1535,${GROUND_Y - 140} 1532,${GROUND_Y - 120}`} fill="url(#ops-towermetal)" />
            <polygon points={`1517,${GROUND_Y - 124} 1514,${GROUND_Y - 140} 1518,${GROUND_Y - 154} 1528,${GROUND_Y - 154} 1532,${GROUND_Y - 140} 1529,${GROUND_Y - 124}`} fill="rgba(110,205,230,0.7)" />
            <rect x={1521.5} y={GROUND_Y - 172} width="3" height="16" fill="#2a333f" />
            <motion.circle cx={1523} cy={GROUND_Y - 174} r="3" fill="#ff5038"
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />

            {/* hangar silhouette far left of the view */}
            <path d={`M1232,${GROUND_Y} L1232,${GROUND_Y - 30} Q1262,${GROUND_Y - 52} 1292,${GROUND_Y - 30} L1292,${GROUND_Y} Z`} fill="#0b1118" />
          </g>
          {/* mullions + frame */}
          <rect x={WIN.x + WIN.w / 2 - 1} y={WIN.y + 12} width="2" height={WIN.h - 24} fill="rgba(0,0,0,0.4)" />
          <rect x={WIN.x + 12} y={WIN.y + WIN.h / 2 - 1} width={WIN.w - 24} height="2" fill="rgba(0,0,0,0.4)" />
          <rect x={WIN.x + 12} y={WIN.y + 12} width={WIN.w - 24} height={WIN.h - 24} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
        </g>

        {/* ── faint console along the bottom (ambient, not data) ────────── */}
        <rect x="-20" y="824" width="1640" height="90" fill="#0a0f18" />
        <rect x="-20" y="820" width="1640" height="4" fill="rgba(120,170,230,0.07)" />
        {Array.from({ length: 9 }).map((_, i) => {
          const x = 150 + i * 150;
          const color = ['rgba(70,224,122,0.7)', 'rgba(255,200,90,0.6)', 'rgba(84,211,255,0.6)'][i % 3];
          return (
            <motion.circle key={i} cx={x} cy={848} r="3" fill={color}
              animate={{ opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 2.4 + (i % 4) * 0.6, repeat: Infinity, ease: 'easeInOut', delay: (i * 0.4) % 2 }} />
          );
        })}
      </svg>
    </div>
  );
}

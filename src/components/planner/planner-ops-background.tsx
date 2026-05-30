'use client';

import { motion } from 'framer-motion';
import type { PlannerStep } from '@/stores/planner-store';

// Mission Control ROOM backdrop for the planner — the captain plans the flight
// from the ops room before heading to the airfield. A window onto the dusk
// airfield, monitor screens (radar + the route being plotted), and a console
// desk with blinking indicators. The route screen progresses with the step:
//   mission-setup → destination pin pings in (no route)
//   flight-plan   → route draws origin → destination
//   launch        → route locks green + "CLEARED", dusk deepens in the window
//
// Ambient (behind planner content); fills the viewport. The window sits in the
// right margin, the monitors in the left margin, the console along the bottom.

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
          <linearGradient id="ops-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a1018" />
            <stop offset="1" stopColor="#0c121d" />
          </linearGradient>
          <linearGradient id="ops-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b111b" />
            <stop offset="1" stopColor="#05080e" />
          </linearGradient>
          <linearGradient id="ops-winsky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0c1430" />
            <stop offset="0.55" stopColor="#3a1f3a" />
            <stop offset="0.82" stopColor="#7a2f1a" />
            <stop offset="1" stopColor="#b9531f" />
          </linearGradient>
          <radialGradient id="ops-winsun" cx="0.5" cy="1" r="0.7">
            <stop offset="0" stopColor="rgba(255,200,120,0.9)" />
            <stop offset="1" stopColor="rgba(255,150,60,0)" />
          </radialGradient>
          <radialGradient id="ops-screenglow" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0" stopColor="rgba(70,180,235,0.18)" />
            <stop offset="1" stopColor="rgba(70,180,235,0)" />
          </radialGradient>
          <radialGradient id="ops-warmglow" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0" stopColor="rgba(255,150,70,0.16)" />
            <stop offset="1" stopColor="rgba(255,150,70,0)" />
          </radialGradient>
          <filter id="ops-soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* ── ROOM ──────────────────────────────────────────────────────── */}
        <rect x="0" y="0" width="1600" height="640" fill="url(#ops-wall)" />
        <rect x="0" y="640" width="1600" height="260" fill="url(#ops-floor)" />
        <rect x="0" y="638" width="1600" height="2" fill="rgba(120,160,220,0.06)" />
        {/* ambient glows from window (right, warm) + monitors (left, cool) */}
        <ellipse cx="1380" cy="360" rx="420" ry="420" fill="url(#ops-warmglow)" />
        <ellipse cx="190" cy="380" rx="360" ry="360" fill="url(#ops-screenglow)" />

        {/* ── WINDOW onto the dusk airfield (right) ─────────────────────── */}
        <g>
          <rect x="1196" y="96" width="372" height="512" rx="8" fill="#11161f" />
          <rect x="1210" y="110" width="344" height="484" fill="url(#ops-winsky)" />
          {/* rising/​setting sun glow low in the window */}
          <rect x="1210" y="430" width="344" height="164" fill="url(#ops-winsun)" />
          {/* distant airfield ground inside the window */}
          <rect x="1210" y="540" width="344" height="10" fill="#1e3a22" />
          <rect x="1210" y="550" width="344" height="44" fill="#12202c" />
          {/* control tower silhouette out the window */}
          <rect x="1500" y="455" width="9" height="95" fill="#0a0f16" />
          <rect x="1492" y="438" width="25" height="22" rx="3" fill="#0d1822" />
          <rect x="1497" y="442" width="15" height="14" fill="rgba(110,205,230,0.5)" />
          <motion.circle cx={1504.5} cy={433} r="3" fill="#ff5038"
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          {/* hangar silhouette */}
          <path d="M1250,550 L1250,520 Q1280,498 1310,520 L1310,550 Z" fill="#0b1118" />
          {/* window mullions + frame highlight */}
          <rect x="1381" y="110" width="2" height="484" fill="rgba(0,0,0,0.45)" />
          <rect x="1210" y="350" width="344" height="2" fill="rgba(0,0,0,0.45)" />
          <rect x="1210" y="110" width="344" height="484" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
        </g>

        {/* ── MONITOR 1 — radar (left, upper) ───────────────────────────── */}
        <g>
          <rect x="34" y="150" width="312" height="196" rx="10" fill="#0c1119" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
          <rect x="46" y="162" width="288" height="172" rx="4" fill="#06121a" />
          <text x="54" y="180" fill="rgba(110,200,255,0.5)" fontFamily="monospace" fontSize="10" letterSpacing="2">RADAR</text>
          {[26, 50, 74].map((r) => (
            <circle key={r} cx={190} cy={258} r={r} fill="none" stroke="rgba(110,200,255,0.18)" strokeWidth="1" />
          ))}
          <motion.g style={{ transformBox: 'view-box', transformOrigin: '190px 258px' }}
            animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}>
            <path d="M190,258 L264,238 A74,74 0 0 1 264,258 Z" fill="rgba(84,211,255,0.30)" />
          </motion.g>
          <circle cx={232} cy={234} r="2.5" fill="#9be7ff" />
          <circle cx={158} cy={290} r="2.5" fill="#9be7ff" />
        </g>

        {/* ── MONITOR 2 — flight plan / route (left, lower) ─────────────── */}
        <g>
          <rect x="34" y="364" width="312" height="196" rx="10" fill="#0c1119" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
          <rect x="46" y="376" width="288" height="172" rx="4" fill="#06121a" />
          <text x="54" y="394" fill="rgba(110,200,255,0.5)" fontFamily="monospace" fontSize="10" letterSpacing="2">FLIGHT PLAN</text>
          {/* origin → destination on the screen */}
          <motion.path d="M96,500 Q190,420 286,476" fill="none" stroke={routeColor} strokeWidth="2"
            strokeDasharray="3 6" strokeLinecap="round"
            initial={false} animate={{ pathLength: routeDrawn ? 1 : 0, opacity: routeDrawn ? 0.9 : 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
          <circle cx={96} cy={500} r="4.5" fill="#54d3ff" />
          <motion.circle cx={286} cy={476} r="4.5" fill={cleared ? '#46e07a' : '#ffd27a'}
            animate={{ opacity: [1, 0.45, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx={286} cy={476} fill="none" stroke={cleared ? 'rgba(70,224,122,0.5)' : 'rgba(255,210,122,0.5)'} strokeWidth="1.4"
            initial={false} animate={{ r: [7, 20], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} />
          <motion.text x="190" y="408" textAnchor="middle" fill="#46e07a" fontFamily="monospace" fontSize="11" fontWeight="bold" letterSpacing="2"
            initial={false} animate={{ opacity: cleared ? 0.95 : 0 }} transition={{ duration: 0.4 }}>
            ● CLEARED
          </motion.text>
        </g>

        {/* ── CONSOLE desk + indicator lights (foreground bottom) ───────── */}
        <g>
          <rect x="-20" y="792" width="1640" height="120" fill="#0b1018" />
          <rect x="-20" y="788" width="1640" height="5" fill="rgba(120,170,230,0.10)" />
          {/* rows of indicator lights */}
          {Array.from({ length: 22 }).map((_, i) => {
            const x = 120 + i * 62;
            const colorA = ['rgba(70,224,122,0.85)', 'rgba(255,200,90,0.85)', 'rgba(84,211,255,0.85)'][i % 3];
            return (
              <g key={i}>
                <motion.circle cx={x} cy={822} r="3.5" fill={colorA}
                  animate={{ opacity: [0.9, 0.25, 0.9] }}
                  transition={{ duration: 1.6 + (i % 5) * 0.5, repeat: Infinity, ease: 'easeInOut', delay: (i * 0.3) % 2 }} />
                <rect x={x - 12} y={846} width="24" height="6" rx="1.5" fill="rgba(120,160,210,0.10)" />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

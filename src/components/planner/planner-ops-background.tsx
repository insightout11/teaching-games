'use client';

import { motion } from 'framer-motion';
import type { PlannerStep } from '@/stores/planner-store';

// Planner backdrop — full-bleed, balanced, quiet. A calm dusk sky (the evening
// before the dusk departure) with a single faint flight-path arc spanning the
// whole width (origin → destination) behind the content. The aircraft advances
// along the arc as the captain progresses Mission Setup → Flight Plan → Launch.
// Low opacity so it never competes with the real content; scales at any width.

// arc: origin (left) → apex → destination (right)
const P0 = { x: 150, y: 648 };
const C = { x: 800, y: 150 };
const P1 = { x: 1450, y: 600 };
const ARC = `M${P0.x},${P0.y} Q${C.x},${C.y} ${P1.x},${P1.y}`;

function pointOnArc(t: number) {
  const u = 1 - t;
  return {
    x: u * u * P0.x + 2 * u * t * C.x + t * t * P1.x,
    y: u * u * P0.y + 2 * u * t * C.y + t * t * P1.y,
  };
}

const STEP_T: Record<PlannerStep, number> = {
  'mission-setup': 0.12,
  'flight-plan': 0.5,
  'launch': 0.9,
};

const STARS = [
  { x: 120, y: 90, r: 1.4, o: 0.7 }, { x: 280, y: 150, r: 1, o: 0.5 },
  { x: 430, y: 70, r: 1.3, o: 0.65 }, { x: 600, y: 130, r: 1, o: 0.5 },
  { x: 780, y: 64, r: 1.4, o: 0.7 }, { x: 960, y: 120, r: 1, o: 0.5 },
  { x: 1130, y: 80, r: 1.3, o: 0.6 }, { x: 1300, y: 140, r: 1, o: 0.5 },
  { x: 1460, y: 76, r: 1.4, o: 0.68 }, { x: 1560, y: 150, r: 1, o: 0.5 },
] as const;

export function PlannerOpsBackground({ step, className }: { step: PlannerStep; className?: string }) {
  const t = STEP_T[step] ?? 0.12;
  const plane = pointOnArc(t);

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none select-none ${className ?? ''}`}
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <svg viewBox="0 0 1600 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="pb-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#070b14" />
            <stop offset="0.55" stopColor="#0f0e1d" />
            <stop offset="1" stopColor="#1d1226" />
          </linearGradient>
          <radialGradient id="pb-dusk" cx="0.5" cy="1" r="0.8">
            <stop offset="0" stopColor="rgba(255,140,70,0.14)" />
            <stop offset="1" stopColor="rgba(255,140,70,0)" />
          </radialGradient>
          <linearGradient id="pb-route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#54d3ff" />
            <stop offset="1" stopColor="#c38bff" />
          </linearGradient>
          <filter id="pb-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* dusk sky + warm horizon */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#pb-sky)" />
        <rect x="0" y="500" width="1600" height="400" fill="url(#pb-dusk)" />

        {/* stars */}
        {STARS.map((s, i) => (
          <motion.circle key={i} cx={s.x} cy={s.y} r={s.r} fill="rgba(255,255,255,0.9)"
            animate={{ opacity: [s.o, s.o * 0.35, s.o] }}
            transition={{ duration: 3 + (i % 4) * 0.8, repeat: Infinity, ease: 'easeInOut', delay: (i * 0.4) % 3 }} />
        ))}

        {/* full flight-path arc (faint) */}
        <path d={ARC} fill="none" stroke="rgba(150,190,255,0.16)" strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" />
        {/* flown portion lights up to the current step */}
        <motion.path d={ARC} fill="none" stroke="url(#pb-route)" strokeWidth="2.5" strokeLinecap="round"
          filter="url(#pb-soft)" initial={false}
          animate={{ pathLength: t, opacity: 0.5 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />

        {/* origin + destination */}
        <circle cx={P0.x} cy={P0.y} r="6" fill="rgba(84,211,255,0.55)" />
        <circle cx={P0.x} cy={P0.y} r="12" fill="none" stroke="rgba(84,211,255,0.3)" strokeWidth="1.5" />
        <circle cx={P1.x} cy={P1.y} r="6" fill="rgba(255,200,120,0.5)" />
        <motion.circle cx={P1.x} cy={P1.y} fill="none" stroke="rgba(255,200,120,0.4)" strokeWidth="1.4"
          animate={{ r: [10, 24], opacity: [0.5, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }} />

        {/* aircraft — advances along the arc per step */}
        <motion.g initial={false} animate={{ x: plane.x, y: plane.y }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
          <circle r="14" fill="rgba(150,225,255,0.18)" filter="url(#pb-soft)" />
          <circle r="4" fill="#dff6ff" />
        </motion.g>
      </svg>
    </div>
  );
}

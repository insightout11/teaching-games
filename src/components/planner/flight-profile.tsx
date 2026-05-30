'use client';

import { computeAltitude, calculateSlotBudgets } from '@/lib/flight-plan-helpers';
import type { LessonSlot } from '@/hooks/use-lesson-session';
import type { PlanModule } from '@/lib/planner-utils';

// Flight profile: the lesson plotted as an altitude bell-curve (takeoff → cruise
// → landing) over a dusk→dawn time-of-day gradient, with each module a waypoint
// and per-leg times. Mirrors the real in-flight weather/altitude arc.

const SLOT_FILL: Record<string, string> = {
  takeoff: '#fbbf24',
  presentation: '#38bdf8',
  practice: '#34d399',
  production: '#a78bfa',
  landing: '#2dd4bf',
};

const W = 1000;
const H = 170;
const PAD_X = 70;
const BASE_Y = 128;
const AMP = 96; // peak height above baseline

function altY(t: number) {
  // bell curve matching computeAltitude: 1 - (2t-1)^2
  return BASE_Y - (1 - Math.pow(2 * t - 1, 2)) * AMP;
}

export function FlightProfile({ modules, durationMinutes }: { modules: PlanModule[]; durationMinutes: number }) {
  const n = modules.length;
  if (n === 0) return null;

  const xAt = (i: number) => (n === 1 ? W / 2 : PAD_X + (i * (W - 2 * PAD_X)) / (n - 1));
  const tAt = (i: number) => (n === 1 ? 0.5 : i / (n - 1));

  const budgets = calculateSlotBudgets(durationMinutes, modules as unknown as LessonSlot[]);

  // smooth curve sampled across the journey
  const samples = 64;
  let line = '';
  for (let s = 0; s <= samples; s++) {
    const t = s / samples;
    const x = PAD_X + t * (W - 2 * PAD_X);
    const y = altY(t);
    line += `${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  const area = `${line} L${W - PAD_X},${BASE_Y} L${PAD_X},${BASE_Y} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }} aria-hidden>
      <defs>
        {/* dusk → night → dawn across the journey */}
        <linearGradient id="fp-time" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,120,40,0.30)" />
          <stop offset="28%" stopColor="rgba(120,45,85,0.22)" />
          <stop offset="52%" stopColor="rgba(22,26,52,0.30)" />
          <stop offset="76%" stopColor="rgba(150,60,110,0.22)" />
          <stop offset="100%" stopColor="rgba(255,150,60,0.32)" />
        </linearGradient>
      </defs>

      {/* baseline (ground) */}
      <line x1={PAD_X} y1={BASE_Y} x2={W - PAD_X} y2={BASE_Y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

      {/* time-of-day envelope under the flight path */}
      <path d={area} fill="url(#fp-time)" />
      {/* the flight path itself */}
      <path d={line} fill="none" stroke="rgba(190,215,255,0.7)" strokeWidth="2.5"
        strokeDasharray="2 5" strokeLinecap="round" />

      {/* phase labels */}
      <text x={PAD_X} y={BASE_Y + 30} fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="monospace" letterSpacing="1">TAKEOFF</text>
      <text x={W / 2} y={26} fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="monospace" letterSpacing="1" textAnchor="middle">CRUISE</text>
      <text x={W - PAD_X} y={BASE_Y + 30} fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="monospace" letterSpacing="1" textAnchor="end">LANDING</text>

      {/* waypoints */}
      {modules.map((m, i) => {
        const x = xAt(i);
        const y = altY(tAt(i));
        const fill = SLOT_FILL[m.slotType] ?? SLOT_FILL.practice;
        return (
          <g key={m.id}>
            <line x1={x} y1={y} x2={x} y2={BASE_Y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle cx={x} cy={y} r="6" fill={fill} stroke="rgba(8,12,18,0.9)" strokeWidth="2" />
            {budgets[i] != null && (
              <text x={x} y={BASE_Y + 16} fill="rgba(255,255,255,0.45)" fontSize="11" textAnchor="middle">
                {budgets[i]}m
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

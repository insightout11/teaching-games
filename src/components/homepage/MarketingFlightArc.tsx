'use client';

// Purpose-built marketing visual for Captain's Flight — a real flight ARC: takeoff lifts
// off the earth on the left, climbs into a high cruise, and descends to land back on the
// earth on the right. Stage nodes ride the arc with clean labels (phase + stage, no
// boxes); micro-events are small pips. A parked plane sits on the runway at takeoff,
// ready to depart. Static/showcase only — no runtime mechanics, not coupled to sessions.

import { motion, useReducedMotion } from 'framer-motion';
import { Plane } from 'lucide-react';
import { getFeaturedRoute } from '@/lib/discovery-shelves';
import type { FlightPhase } from '@/lib/flight-plan-presets';

const PHASE_LABEL: Record<FlightPhase, string> = {
  takeoff: 'Takeoff',
  climb: 'Climb',
  cruise: 'Cruise',
  descent: 'Descent',
  landing: 'Landing',
};

// Per-phase accent so the arc reads takeoff→landing (emerald lift-off → amber touchdown).
const PHASE_ACCENT: Record<FlightPhase, { dot: string; text: string; glow: string }> = {
  takeoff: { dot: '#34d399', text: 'text-emerald-300', glow: 'rgba(52,211,153,0.9)' },
  climb: { dot: '#5eead4', text: 'text-teal-200', glow: 'rgba(94,234,212,0.9)' },
  cruise: { dot: '#67e8f9', text: 'text-cyan-200', glow: 'rgba(103,232,249,0.9)' },
  descent: { dot: '#a78bfa', text: 'text-violet-200', glow: 'rgba(167,139,250,0.9)' },
  landing: { dot: '#fbbf24', text: 'text-amber-200', glow: 'rgba(245,158,11,0.95)' },
};

const VB_W = 1200;
const VB_H = 440;
const INSET = 132;
const SPAN = VB_W - INSET * 2;
const GROUND_Y = 350; // where takeoff + landing rest on the earth
const ARC_H = 262; // cruise peak = GROUND_Y - ARC_H

const arcX = (t: number) => INSET + t * SPAN;
const arcY = (t: number) => GROUND_Y - ARC_H * 4 * t * (1 - t);

export function MarketingFlightArc() {
  const reduce = useReducedMotion();
  const route = getFeaturedRoute();
  const n = route.length;
  if (n < 2) return null;

  const nodes = route.map((wp, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    return { ...wp, i, t, x: arcX(t), y: arcY(t), phase: wp.phase ?? 'cruise', isMicro: wp.kind === 'micro-event' };
  });

  // Smooth arc path sampled from the analytic parabola (independent of node count).
  let arcPath = '';
  for (let s = 0; s <= 1.0001; s += 0.02) {
    arcPath += `${s === 0 ? 'M' : 'L'} ${arcX(s).toFixed(1)} ${arcY(s).toFixed(1)} `;
  }

  // Earth: a gentle convex horizon the arc lifts off / settles onto.
  const groundEdge = `M 0 ${GROUND_Y + 14} Q ${VB_W / 2} ${GROUND_Y - 16} ${VB_W} ${GROUND_Y + 14} L ${VB_W} ${VB_H} L 0 ${VB_H} Z`;
  const takeoff = nodes[0];

  return (
    <div className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="mfa-arc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="34%" stopColor="#5eead4" />
            <stop offset="62%" stopColor="#67e8f9" />
            <stop offset="82%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <radialGradient id="mfa-earth" cx="50%" cy="100%" r="75%">
            <stop offset="0%" stopColor="#1f7a44" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#0e3f22" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06140d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mfa-ground" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a5e34" />
            <stop offset="55%" stopColor="#0c3119" />
            <stop offset="100%" stopColor="#050f09" />
          </linearGradient>
          <filter id="mfa-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* Earth glow + ground */}
        <rect x="0" y={GROUND_Y - 90} width={VB_W} height={VB_H - GROUND_Y + 90} fill="url(#mfa-earth)" />
        <path d={groundEdge} fill="url(#mfa-ground)" />
        <path
          d={`M 0 ${GROUND_Y + 14} Q ${VB_W / 2} ${GROUND_Y - 16} ${VB_W} ${GROUND_Y + 14}`}
          fill="none"
          stroke="rgba(120,240,170,0.35)"
          strokeWidth="1.5"
        />

        {/* Arc: faint base, then the bright gradient drawing in */}
        <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" strokeLinecap="round" />
        <motion.path
          d={arcPath}
          fill="none"
          stroke="url(#mfa-arc)"
          strokeWidth="9"
          strokeLinecap="round"
          filter="url(#mfa-glow)"
          initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 0.55 : 0 }}
          whileInView={{ pathLength: 1, opacity: 0.6 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d={arcPath}
          fill="none"
          stroke="url(#mfa-arc)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Nodes — light in sequence after the arc draws */}
        {nodes.map((nd) => {
          const accent = PHASE_ACCENT[nd.phase];
          const delay = reduce ? 0 : 0.5 + nd.i * 0.12;
          return (
            <motion.g
              key={`${nd.label}-${nd.i}`}
              initial={{ opacity: reduce ? 1 : 0, scale: reduce ? 1 : 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: `${nd.x}px ${nd.y}px` }}
            >
              {nd.isMicro ? (
                <circle cx={nd.x} cy={nd.y} r={4} fill="#0a1a2e" stroke={accent.dot} strokeWidth={1.6} />
              ) : (
                <>
                  <circle cx={nd.x} cy={nd.y} r={11} fill={accent.dot} opacity={0.2} filter="url(#mfa-glow)" />
                  <circle cx={nd.x} cy={nd.y} r={6} fill={accent.dot} stroke="#fff" strokeWidth={1.6} />
                </>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Stage labels (HTML overlay) — phase + name above each non-micro node */}
      {nodes.filter((nd) => !nd.isMicro).map((nd) => {
        const accent = PHASE_ACCENT[nd.phase];
        const delay = reduce ? 0 : 0.6 + nd.i * 0.12;
        return (
          <motion.div
            key={`label-${nd.i}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full text-center"
            style={{ left: `${(nd.x / VB_W) * 100}%`, top: `calc(${(nd.y / VB_H) * 100}% - 1.1rem)` }}
            initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay }}
          >
            <span className={`font-instrument block text-[9px] uppercase tracking-[0.16em] ${accent.text}`}>
              {PHASE_LABEL[nd.phase]}
            </span>
            <span className="block max-w-[6rem] text-[12px] font-semibold leading-tight text-white">
              {nd.label}
            </span>
          </motion.div>
        );
      })}

      {/* Parked plane at takeoff — on the runway, nose up the climb-out, idle bob */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${((takeoff.x - 26) / VB_W) * 100}%`, top: `${((takeoff.y - 6) / VB_H) * 100}%` }}
        initial={{ opacity: reduce ? 1 : 0, scale: reduce ? 1 : 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, -3, 0], rotate: [-13, -11, -13] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/30 bg-[#0a1a2e]/90 shadow-[0_0_22px_rgba(52,211,153,0.45)]"
        >
          <Plane className="h-6 w-6 -rotate-[10deg] text-emerald-200" strokeWidth={2} />
        </motion.div>
      </motion.div>
    </div>
  );
}

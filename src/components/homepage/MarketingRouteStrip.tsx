'use client';

// Presentational, read-only Captain's Flight route strip for marketing surfaces
// (homepage hero + /showcase). Renders RouteWaypoint[] from getFeaturedRoute() as a
// boarding-pass-style timeline: a fixed flight-PHASE band over phase-grouped STAGE-JOB
// stops. The signal line draws in and stops light in sequence on load. No planner,
// credits, or auth dependencies — safe on logged-out pages.

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { RouteWaypoint } from '@/lib/discovery-shelves';
import type { FlightPhase } from '@/lib/flight-plan-presets';

const PHASE_LABEL: Record<FlightPhase, string> = {
  takeoff: 'Takeoff',
  climb: 'Climb',
  cruise: 'Cruise',
  descent: 'Descent',
  landing: 'Landing',
};

export function MarketingRouteStrip({
  route,
  className,
  animate = true,
}: {
  route: RouteWaypoint[];
  className?: string;
  /** false renders fully-lit with no sweep (used for the calm pre-loaded sample). */
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const isStatic = reduce || !animate;
  const n = route.length;
  // Index of the stop the signal has reached; stops with index ≤ activeIdx are lit.
  const [activeIdx, setActiveIdx] = useState(isStatic ? n - 1 : -1);

  // Group consecutive stops by flight phase, keeping each stop's global index for lighting.
  const groups: { phase: FlightPhase; items: { wp: RouteWaypoint; idx: number }[] }[] = [];
  route.forEach((wp, idx) => {
    const phase = wp.phase ?? 'cruise';
    const last = groups[groups.length - 1];
    if (last && last.phase === phase) last.items.push({ wp, idx });
    else groups.push({ phase, items: [{ wp, idx }] });
  });

  // Single forward sweep that lights stops in sequence, then holds fully lit.
  useEffect(() => {
    if (isStatic) {
      setActiveIdx(n - 1);
      return;
    }
    let idx = -1;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      idx += 1;
      if (idx >= n) {
        setActiveIdx(n - 1);
        return;
      }
      setActiveIdx(idx);
      timer = setTimeout(tick, 360);
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, [isStatic, n]);

  if (n === 0) return null;

  return (
    <div className={cn('w-full', className)}>
      <p className="font-instrument mb-4 text-[10px] uppercase tracking-[0.22em] text-cyan-300/80">
        One lesson, stage by stage
      </p>

      {/* Phase band — the fixed flight-structure layer, grouping the stops below */}
      <div className="mb-2 hidden sm:flex">
        {groups.map((g, gi) => (
          <div
            key={`${g.phase}-${gi}`}
            className="px-1.5 text-center"
            style={{ flexGrow: g.items.length, flexBasis: 0 }}
          >
            <span className="font-instrument text-[9px] uppercase tracking-[0.24em] text-lc-amber/75">
              {PHASE_LABEL[g.phase]}
            </span>
            <span
              aria-hidden
              className="mt-1.5 block h-1.5 rounded-t-[3px] border-x border-t border-cyan-300/15"
            />
          </div>
        ))}
      </div>

      {/* Track — drawn line + phase-grouped stops, each lighting in sequence */}
      <div className="relative pt-1.5">
        <div className="absolute left-0 right-0 top-[11px] h-px bg-cyan-300/15" />
        <motion.div
          className="absolute left-0 right-0 top-[11px] h-[2px] origin-left rounded-full bg-gradient-to-r from-cyan-300 via-cyan-300/70 to-cyan-300/20 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
          initial={{ scaleX: isStatic ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: isStatic ? 0 : 1.2, delay: 0.3, ease: [0.12, 0.8, 0.32, 1] }}
        />

        <ol className="relative flex">
          {groups.map((g, gi) => (
            <li
              key={`${g.phase}-${gi}`}
              className="flex justify-around"
              style={{ flexGrow: g.items.length, flexBasis: 0 }}
            >
              {g.items.map(({ wp, idx }) => {
                const lit = idx <= activeIdx;
                const isLanding = wp.kind === 'landing';
                const isMicro = wp.kind === 'micro-event';
                return (
                  <motion.div
                    key={`${wp.label}-${idx}`}
                    className="flex flex-col items-center gap-2.5"
                    initial={isStatic ? false : { opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: isStatic ? 0 : 0.35 + idx * 0.07 }}
                  >
                    <span
                      className={cn(
                        'rounded-full border-2 transition-all duration-300',
                        isMicro ? 'h-3 w-3' : 'h-4 w-4',
                        lit
                          ? isLanding
                            ? 'border-lc-amber bg-lc-amber shadow-[0_0_14px_rgba(245,158,11,0.95)]'
                            : 'border-cyan-100 bg-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.95)]'
                          : isLanding
                            ? 'border-lc-amber/45 bg-lc-amber/10'
                            : 'border-cyan-300/45 bg-[#0a1a33]',
                      )}
                    />
                    <span
                      className={cn(
                        'font-instrument max-w-[5.5rem] text-center text-[9px] uppercase leading-tight tracking-wide transition-colors duration-300 sm:text-[10px]',
                        lit ? 'text-cyan-100' : 'text-lc-text2',
                      )}
                    >
                      {wp.label}
                    </span>
                  </motion.div>
                );
              })}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

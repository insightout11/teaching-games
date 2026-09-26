'use client';

import { motion } from 'framer-motion';
import { Pause, Plane, Play } from 'lucide-react';

/**
 * Middle-of-lesson transition: a short beat instead of the full cinematic.
 *
 * Takeoff and arrival keep their full scenes; every stage in between used to
 * replay a 3.5s cutscene that looked the same each time. This slides the plane
 * one node along the route and briefs the next activity, then gets out of the way.
 * The parent owns timing (min duration, wait-until-ready, hold).
 */
interface WaypointBeatProps {
  /** 1-based index of the stage being flown to. */
  stageNumber: number;
  stageCount: number;
  to: string | null;
  toDescription?: string;
  held: boolean;
  waiting: boolean;
  reduce: boolean;
  onToggleHold: () => void;
}

export function WaypointBeat({
  stageNumber,
  stageCount,
  to,
  toDescription,
  held,
  waiting,
  reduce,
  onToggleHold,
}: WaypointBeatProps) {
  const count = Math.max(2, stageCount);
  const pct = (i: number) => (i / (count - 1)) * 100;
  const fromIdx = Math.max(0, stageNumber - 2);
  const toIdx = Math.min(count - 1, stageNumber - 1);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(8,20,42,0.88) 0%, rgba(4,9,20,0.94) 100%)' }}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-full max-w-3xl flex flex-col gap-10">
        {/* Route strip */}
        <div className="relative h-8" aria-hidden>
          <div
            className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2"
            style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 10px, transparent 10px 20px)' }}
          />
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className={[
                'absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
                i < toIdx
                  ? 'border-cyan-400 bg-cyan-400'
                  : i === toIdx
                    ? 'border-amber-400 bg-slate-950 shadow-[0_0_0_6px_rgba(251,191,36,0.2)]'
                    : 'border-white/40 bg-slate-950',
              ].join(' ')}
              style={{ left: `${pct(i)}%` }}
            />
          ))}
          <motion.div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
            initial={reduce ? { left: `${pct(toIdx)}%` } : { left: `${pct(fromIdx)}%` }}
            animate={{ left: `${pct(toIdx)}%` }}
            transition={{ duration: reduce ? 0 : 0.9, ease: 'easeInOut' }}
          >
            <div className="rotate-45 -mt-7">
              <Plane className="h-6 w-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" fill="currentColor" />
            </div>
          </motion.div>
        </div>

        {/* Briefing card */}
        <motion.div
          className="rounded-2xl border border-white/12 bg-slate-950/70 px-7 py-6 backdrop-blur-md"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: reduce ? 0 : 0.15 }}
        >
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
            Next waypoint · {stageNumber} of {stageCount}
          </p>
          {to && (
            <p className="mt-2 font-game text-4xl leading-tight text-white" style={{ textShadow: '0 1px 12px rgba(0,0,0,0.55)' }}>
              {to}
            </p>
          )}
          {toDescription && <p className="mt-2 max-w-2xl text-lg text-white/75">{toDescription}</p>}
          {waiting && (
            <p className="mt-4 flex items-center gap-2 text-sm text-cyan-200/80">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
              Loading the next stage…
            </p>
          )}
        </motion.div>
      </div>

      {/* Hold control — teacher keeps talking; H toggles too. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleHold();
        }}
        className="absolute bottom-5 right-5 flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-slate-950/70 px-3 text-sm text-white/80 transition-colors hover:bg-white/10"
      >
        {held ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
        {held ? 'Continue (H)' : 'Hold (H)'}
      </button>
      <p className="pointer-events-none absolute bottom-7 left-5 text-[10px] uppercase tracking-widest text-white/35">
        Tap anywhere to skip
      </p>
    </motion.div>
  );
}

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { DesignStudioBrief, DesignStudioState } from '@/activities/types';

export interface BlueprintCity {
  city: string;
  /** What the class found there, in a sentence. */
  found?: string | null;
}

/**
 * The design mission's ending: one poster the class made, built from its decisions, with the three cities it drew
 * on. Shown as the lesson's landing and reopened from World Flight. No names and no ranking: the whole class made it.
 */
export function DesignBlueprint({
  brief,
  decisions,
  cities = [],
  missionTitle,
  className,
  designers,
  completedAt,
  animate = false,
}: {
  brief: DesignStudioBrief;
  decisions: DesignStudioState['decisions'];
  cities?: BlueprintCity[];
  missionTitle?: string | null;
  className?: string | null;
  designers?: number;
  completedAt?: string | null;
  /** Reveal piece by piece (the landing); off when reopened later. */
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const reveal = (order: number) => (animate && !reduce
    ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.25 + order * 0.45, duration: 0.45 } }
    : {});
  const date = completedAt ? new Date(completedAt) : null;
  const INK = '#1b2233';

  return (
    <div
      className="mx-auto w-full max-w-4xl -rotate-[0.6deg] rounded-md p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:p-9"
      style={{
        color: INK,
        background: 'linear-gradient(rgba(27,34,51,0.07) 1px, transparent 1px) 0 0 / 100% 26px, linear-gradient(90deg, rgba(27,34,51,0.07) 1px, transparent 1px) 0 0 / 26px 100%, #f4efe3',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a5a00]">
        <span>Class blueprint{missionTitle ? ` · ${missionTitle}` : ''}</span>
        {className && <span>{className}</span>}
      </div>

      <motion.h2 {...reveal(0)} className="mt-4 font-display text-4xl leading-[1.08] sm:text-6xl" style={{ color: INK }}>{brief.title}</motion.h2>

      <motion.div {...reveal(1)} className="mt-5 max-w-3xl border-l-[3px] border-[#b7791f] pl-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a5a00]">Say it together</p>
        <p className="mt-1 text-xl font-semibold leading-snug sm:text-2xl">{brief.pitch}</p>
      </motion.div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {decisions.map((decision, index) => (
          <motion.div key={decision.roundNumber} {...reveal(2 + index)} className="rounded border-[1.5px] border-[#1b2233]/30 bg-white/45 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#1b2233]/55">{decision.roundNumber} · {decision.stage}</p>
            <p className="mt-0.5 text-lg font-bold leading-tight">{decision.selectedOption.title}</p>
            <p className="mt-0.5 text-sm leading-snug text-[#1b2233]/70">{decision.selectedOption.description}</p>
          </motion.div>
        ))}
      </div>

      {cities.length > 0 && (
        <motion.div {...reveal(2 + decisions.length)} className="mt-6 flex flex-wrap items-center gap-4">
          {cities.map((entry, index) => (
            <div
              key={entry.city}
              className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-[3px] border-double text-center font-mono text-[10px] uppercase leading-tight tracking-[0.08em] opacity-85"
              style={{ color: STAMP_INKS[index % STAMP_INKS.length], borderColor: STAMP_INKS[index % STAMP_INKS.length], transform: `rotate(${[-8, 5, -3][index % 3]}deg)` }}
            >
              <span className="px-1.5">
                <span className="block text-[13px] font-bold tracking-[0.02em]">{entry.city}</span>
                visited
              </span>
            </div>
          ))}
          <ul className="min-w-0 flex-1 basis-64 space-y-1 text-sm leading-snug text-[#1b2233]/75">
            {cities.filter((entry) => entry.found).map((entry) => (
              <li key={entry.city}><span className="font-bold text-[#1b2233]">{entry.city}:</span> {entry.found}</li>
            ))}
          </ul>
        </motion.div>
      )}

      <div className="mt-6 flex flex-wrap justify-between gap-2 border-t-[1.5px] border-[#1b2233]/25 pt-3 font-mono text-[11px] text-[#1b2233]/60">
        <span>
          {decisions.length} {decisions.length === 1 ? 'decision' : 'decisions'}
          {designers ? ` · ${designers} ${designers === 1 ? 'designer' : 'designers'}` : ''}
        </span>
        {date && !Number.isNaN(date.getTime()) && <span suppressHydrationWarning>Designed {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
      </div>
    </div>
  );
}

const STAMP_INKS = ['#9b2c2c', '#2c5282', '#276749'];

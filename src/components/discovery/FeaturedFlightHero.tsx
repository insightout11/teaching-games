'use client';

// The Teacher Home hero: All-Around Flight as a cockpit "boarding pass".
// The lesson route is the poster art — a cyan flight line that draws in on load
// with a traveling pulse. One primary CTA; source choice is secondary. All motion
// is transform/opacity only and disabled under prefers-reduced-motion.

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Plane, ArrowRight, Video, FileText, Type } from 'lucide-react';
import { usePlannerStore } from '@/stores/planner-store';
import { getFeaturedPreset, getFeaturedRoute } from '@/lib/discovery-shelves';

export function FeaturedFlightHero() {
  const router = useRouter();
  const loadPreset = usePlannerStore((s) => s.loadPreset);
  const prefersReducedMotion = useReducedMotion();
  const preset = getFeaturedPreset();
  const route = getFeaturedRoute();

  function launch() {
    if (preset) loadPreset(preset);
    router.push('/lesson-planner');
  }

  const drawTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 1.1, delay: 0.25, ease: [0.12, 0.8, 0.32, 1] as [number, number, number, number] };

  return (
    <section
      aria-label="Featured lesson: All-Around Flight"
      className="panel-card panel-card--ready relative overflow-hidden p-6 lg:p-8"
    >
      {/* Ambient cockpit glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        {/* Left — identity, route, CTA */}
        <div className="min-w-0 flex-1">
          <span className="font-instrument inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cyan-400">
            <Plane className="h-3.5 w-3.5" aria-hidden />
            Featured flight
          </span>

          <h2 className="font-game mt-2 text-3xl leading-tight text-lc-text lg:text-4xl">
            All-Around Flight
          </h2>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-lc-text2">
            A complete live lesson from any topic, video, article, or PDF — warm-up, language,
            discussion, a game, and a landing, sequenced for you.
          </p>

          {/* Route timeline — the poster art */}
          {route.length > 0 && (
            <div className="relative mt-6 max-w-xl" aria-hidden>
              {/* Base track */}
              <div className="absolute left-0 right-0 top-[7px] h-px bg-lc-border" />
              {/* Drawn cyan line */}
              <motion.div
                className="absolute left-0 right-0 top-[7px] h-px origin-left bg-gradient-to-r from-cyan-400/80 to-cyan-400/30"
                initial={{ scaleX: prefersReducedMotion ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={drawTransition}
              />
              {/* Traveling pulse */}
              {!prefersReducedMotion && (
                <motion.div
                  className="absolute top-[3px] h-[9px] w-[9px] rounded-full bg-cyan-300 shadow-[0_0_10px_2px_rgba(34,211,238,0.7)]"
                  initial={{ left: '0%', opacity: 0 }}
                  animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 3.2, delay: 1.2, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
                />
              )}
              <ol className="relative flex justify-between">
                {route.map((wp, i) => (
                  <motion.li
                    key={`${wp.label}-${i}`}
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : 0.3 + i * 0.08 }}
                  >
                    <span
                      className={
                        'h-3.5 w-3.5 rounded-full border-2 ' +
                        (wp.kind === 'landing'
                          ? 'border-lc-amber bg-lc-amber/30'
                          : wp.kind === 'end-game'
                            ? 'border-cyan-300 bg-cyan-400/40'
                            : 'border-cyan-400/70 bg-lc-bg')
                      }
                    />
                    <span className="font-instrument hidden text-[9px] uppercase tracking-wider text-lc-text3 sm:block">
                      {wp.label}
                    </span>
                  </motion.li>
                ))}
              </ol>
            </div>
          )}

          {/* Primary CTA + secondary source choice */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={launch}
              className="animate-beacon inline-flex items-center gap-2 rounded-xl bg-lc-amber px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-lc-amber/90"
            >
              <Plane className="h-4 w-4" aria-hidden />
              Build this lesson
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-instrument text-[10px] uppercase tracking-wider text-lc-text3">from</span>
              {[
                { icon: Video, label: 'Video' },
                { icon: FileText, label: 'Article' },
                { icon: Type, label: 'Topic' },
              ].map(({ icon: ChipIcon, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={launch}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-lc-border bg-lc-bg/40 px-2.5 py-1.5 text-xs text-lc-text2 transition-colors hover:border-cyan-400/40 hover:text-lc-text"
                >
                  <ChipIcon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — boarding-pass stub (decorative instrument readout) */}
        <div className="shrink-0 lg:w-52">
          <div className="relative rounded-xl border border-cyan-400/25 bg-lc-bg/50 p-4">
            <div className="font-instrument flex items-center justify-between text-[10px] uppercase tracking-wider text-cyan-400/80">
              <span>Boarding pass</span>
              <span>LC-60</span>
            </div>
            <dl className="mt-3 space-y-2.5">
              {[
                ['Duration', '~60 min'],
                ['Class', 'Whole class'],
                ['Source', 'Optional'],
                ['Goal', 'Speaking'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="font-instrument text-[10px] uppercase tracking-wider text-lc-text3">{k}</dt>
                  <dd className="text-[13px] font-medium text-lc-text">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

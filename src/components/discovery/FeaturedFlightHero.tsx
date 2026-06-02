'use client';

// The Teacher Home hero: All-Around Flight as a real boarding-pass OBJECT — a torn
// ticket with a main panel and a perforated stub, the flight route as the visual
// centerpiece (line draws in, a plane tracks across), one dominant amber CTA, and
// tactile source controls. Sized to dominate the first viewport. Motion is
// transform/opacity only and fully disabled under prefers-reduced-motion.

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Plane, ArrowRight, Video, FileText, Type, Hash } from 'lucide-react';
import { usePlannerStore } from '@/stores/planner-store';
import { getFeaturedPreset, getFeaturedRoute } from '@/lib/discovery-shelves';

export function FeaturedFlightHero() {
  const router = useRouter();
  const loadPreset = usePlannerStore((s) => s.loadPreset);
  const reduce = useReducedMotion();
  const preset = getFeaturedPreset();
  const route = getFeaturedRoute();

  function launch() {
    if (preset) loadPreset(preset);
    router.push('/lesson-planner');
  }

  return (
    <div className="relative">
      {/* Outer glow halo behind the ticket */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -inset-y-8 rounded-[2rem] bg-[radial-gradient(60%_80%_at_30%_40%,rgba(34,211,238,0.18),transparent)] blur-2xl"
      />

      <motion.article
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.12, 0.8, 0.32, 1] }}
        aria-label="Featured lesson: All-Around Flight"
        className="relative flex flex-col overflow-hidden rounded-[1.4rem] border border-cyan-300/30 bg-gradient-to-br from-[#0a1a33]/85 to-[#060f1f]/90 shadow-[0_28px_80px_-20px_rgba(4,10,24,0.9),0_0_70px_-24px_rgba(34,211,238,0.45)] backdrop-blur-xl lg:flex-row"
      >
        {/* Scanning sheen */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-200/[0.06] to-transparent"
            initial={{ left: '-40%' }}
            animate={{ left: ['-40%', '140%'] }}
            transition={{ duration: 6, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          />
        )}

        {/* ── Main panel ───────────────────────────────────────────── */}
        <div className="relative flex-1 p-7 sm:p-9 lg:p-12">
          <div className="flex items-center justify-between">
            <span className="font-instrument inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-cyan-300/90">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.8)]" />
              Featured Flight
            </span>
            <span className="font-instrument text-[11px] uppercase tracking-[0.2em] text-lc-text3">
              LessonCaptain Airways
            </span>
          </div>

          <h2 className="font-game mt-5 text-[2.6rem] leading-[0.95] text-lc-text sm:text-6xl">
            All-Around Flight
          </h2>
          <p className="mt-4 max-w-md text-base text-lc-text2">
            One complete live lesson, built around any topic, video, or article.
          </p>

          {/* Route — the centerpiece */}
          {route.length > 0 && <RouteStrip route={route} reduce={!!reduce} />}

          {/* CTA + source controls */}
          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4">
            <button
              type="button"
              onClick={launch}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-lc-amber to-[#e08600] px-7 py-3.5 text-base font-bold text-[#1a0f00] shadow-[0_8px_24px_-6px_rgba(245,158,11,0.6)] transition-all hover:shadow-[0_10px_30px_-6px_rgba(245,158,11,0.8)] hover:brightness-105"
            >
              <Plane className="h-5 w-5" aria-hidden />
              Build this lesson
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-instrument mr-1 text-[10px] uppercase tracking-[0.18em] text-lc-text3">
                Start from
              </span>
              {[
                { icon: Video, label: 'Video' },
                { icon: FileText, label: 'Article' },
                { icon: Type, label: 'Topic' },
              ].map(({ icon: ChipIcon, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={launch}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] px-3 py-2 text-sm text-lc-text2 transition-colors hover:border-cyan-300/50 hover:bg-cyan-300/10 hover:text-lc-text"
                >
                  <ChipIcon className="h-4 w-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Perforated stub ──────────────────────────────────────── */}
        <div className="relative shrink-0 border-t border-dashed border-cyan-300/30 bg-cyan-300/[0.05] p-7 lg:w-72 lg:border-l lg:border-t-0">
          {/* Tear notches */}
          <span aria-hidden className="absolute -left-2.5 -top-2.5 hidden h-5 w-5 rounded-full bg-[#070B14] lg:block" />
          <span aria-hidden className="absolute -bottom-2.5 -left-2.5 hidden h-5 w-5 rounded-full bg-[#070B14] lg:block" />

          <div className="font-instrument flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-cyan-300/90">
            <span>Boarding Pass</span>
            <span className="inline-flex items-center gap-1 text-lc-text3">
              <Hash className="h-3 w-3" aria-hidden />
              LC-60
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-1">
            {[
              ['Duration', '≈ 60 min'],
              ['Class', 'Whole class'],
              ['Source', 'Optional'],
              ['Focus', 'Speaking'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-instrument text-[9px] uppercase tracking-[0.18em] text-lc-text3">{k}</dt>
                <dd className="font-instrument mt-0.5 text-[15px] font-semibold text-lc-text">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-center gap-3 border-t border-cyan-300/15 pt-5">
            <div className="rounded-md bg-white/90 p-1.5">
              <QRCodeSVG value="lessoncaptain://all-around-flight" size={48} bgColor="#ffffff" fgColor="#06121f" level="L" />
            </div>
            <div className="font-instrument text-[9px] uppercase leading-relaxed tracking-[0.16em] text-lc-text3">
              Gate&nbsp;A1
              <br />
              Ready to board
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

// ── Route strip: drawn line + traveling plane + waypoints ─────────────────────
function RouteStrip({
  route,
  reduce,
}: {
  route: { label: string; kind: 'stage' | 'micro-event' | 'end-game' | 'landing' }[];
  reduce: boolean;
}) {
  return (
    <div className="mt-9">
      <div className="font-instrument mb-3 flex items-center justify-between text-[9px] uppercase tracking-[0.22em] text-lc-text3">
        <span>Departure · Icebreaker</span>
        <span>Arrival · Landing</span>
      </div>
      <div className="relative pt-1">
        {/* Base track */}
        <div className="absolute left-0 right-0 top-[10px] h-px bg-cyan-300/15" />
        {/* Drawn line */}
        <motion.div
          className="absolute left-0 right-0 top-[10px] h-px origin-left bg-gradient-to-r from-cyan-300 via-cyan-300/70 to-cyan-300/20 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
          initial={{ scaleX: reduce ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduce ? 0 : 1.2, delay: 0.3, ease: [0.12, 0.8, 0.32, 1] }}
        />
        {/* Traveling plane */}
        {!reduce && (
          <motion.div
            className="absolute top-[2px] -ml-2 text-cyan-200 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)]"
            initial={{ left: '0%', opacity: 0 }}
            animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3.4, delay: 1.3, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
          >
            <Plane className="h-4 w-4 rotate-90" aria-hidden />
          </motion.div>
        )}

        <ol className="relative flex justify-between">
          {route.map((wp, i) => (
            <motion.li
              key={`${wp.label}-${i}`}
              className="flex flex-col items-center gap-2"
              initial={reduce ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: reduce ? 0 : 0.35 + i * 0.07 }}
            >
              <span
                className={
                  'h-[14px] w-[14px] rounded-full border-2 ' +
                  (wp.kind === 'landing'
                    ? 'border-lc-amber bg-lc-amber/40 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : wp.kind === 'end-game'
                      ? 'border-cyan-200 bg-cyan-300/50'
                      : 'border-cyan-300/70 bg-[#0a1a33]')
                }
              />
              <span className="font-instrument hidden text-[9px] uppercase tracking-wider text-lc-text3 sm:block">
                {wp.label}
              </span>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}

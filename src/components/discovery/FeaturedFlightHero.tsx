'use client';

// The Teacher Home hero: All-Around Flight as a real boarding-pass OBJECT.
// Torn ticket = main panel + hole-punched stub, paper grain + glass sheen, corner
// registration marks, a barcode, and the flight route as the dominant centerpiece
// (phase band over stage-job stops; line draws in, stops light in sequence).
// One amber CTA + tactile source controls. All motion transform/opacity only;
// disabled under prefers-reduced-motion.

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plane, ArrowRight, Video, FileText, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFeaturedRoute, type RouteWaypoint } from '@/lib/discovery-shelves';
import type { FlightPhase } from '@/lib/flight-plan-presets';
import { FeaturedFlightLaunchModal } from './FeaturedFlightLaunchModal';

// Flight-phase display labels — the fixed structural layer above the stage jobs.
const PHASE_LABEL: Record<FlightPhase, string> = {
  takeoff: 'Takeoff',
  climb: 'Climb',
  cruise: 'Cruise',
  descent: 'Descent',
  landing: 'Landing',
};

// Subtle paper grain (tiled SVG noise).
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Deterministic Code-128-style barcode: alternating bar / space segment widths
// (even index = dark bar, odd index = light gap). Rendered with flex-grow so the
// strip fills the full width of the boarding-pass stub like a real printed label.
const BARCODE = [
  2, 1, 1, 2, 3, 1, 1, 1, 2, 1, 3, 2, 1, 1, 2, 1, 1, 3, 1, 2, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1,
  1, 2, 3, 1, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 1, 2, 1, 2, 1,
  3, 1, 1, 2, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 1, 3, 1, 2, 1, 1,
];

export function FeaturedFlightHero() {
  const reduce = useReducedMotion();
  const route = getFeaturedRoute();
  const [launchOpen, setLaunchOpen] = useState(false);
  const [expandSource, setExpandSource] = useState(false);

  function openLaunch(withSource: boolean) {
    setExpandSource(withSource);
    setLaunchOpen(true);
  }

  return (
    <div className="relative">
      <FeaturedFlightLaunchModal open={launchOpen} expandSource={expandSource} onClose={() => setLaunchOpen(false)} />
      {/* Outer glow halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -inset-y-8 rounded-[2.5rem] bg-[radial-gradient(60%_80%_at_28%_42%,rgba(34,211,238,0.20),transparent)] blur-2xl"
      />
      {/* Grounded contact shadow — gives the pass weight on the scene */}
      <div aria-hidden className="pointer-events-none absolute inset-x-10 -bottom-5 h-10 rounded-[50%] bg-black/65 blur-2xl" />

      <motion.article
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.12, 0.8, 0.32, 1] }}
        aria-label="Featured lesson: Captain's Flight"
        className="relative flex flex-col overflow-hidden rounded-[1.5rem] border border-cyan-300/30 bg-gradient-to-br from-[#0b1c38]/90 to-[#060f1f]/92 shadow-[inset_0_1px_0_rgba(180,220,255,0.12),0_22px_44px_-12px_rgba(0,0,0,0.9),0_46px_96px_-30px_rgba(2,8,20,0.95),0_0_80px_-30px_rgba(34,211,238,0.42)] backdrop-blur-xl lg:flex-row"
      >
        {/* Bottom paper edge — implies ticket thickness */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2 bg-gradient-to-t from-black/50 to-transparent" />
        {/* Paper grain */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '160px' }} />
        {/* Glass sheen */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.07] to-transparent" />
        {/* Warm paper tint — keeps it from reading as a cold HUD panel */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_70%_at_95%_112%,rgba(245,158,11,0.12),transparent)]" />
        {/* Corner registration marks */}
        <CornerMarks />
        {/* Scanning sheen */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-200/[0.07] to-transparent"
            initial={{ left: '-40%' }}
            animate={{ left: ['-40%', '140%'] }}
            transition={{ duration: 6, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          />
        )}

        {/* ── Main panel ───────────────────────────────────────────── */}
        <div className="relative flex-1 p-7 sm:p-9 lg:p-12">
          {/* Large faint LessonCaptain monogram — turns the open center-right of the pass
              into intentional branded texture (kept off the perforation seam) */}
          <div
            aria-hidden
            className="pointer-events-none absolute right-[7%] top-1/2 hidden h-72 w-72 -translate-y-1/2 bg-contain bg-center bg-no-repeat opacity-[0.06] lg:block xl:h-[24rem] xl:w-[24rem]"
            style={{ backgroundImage: 'url(/lessoncaptain-mark-on-dark.svg)' }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <span className="font-instrument inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-cyan-300/90">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.8)]" />
              Featured · All-Around Lesson
            </span>
            <span className="font-instrument text-[11px] uppercase tracking-[0.2em] text-lc-text3">
              LessonCaptain Airways
            </span>
          </div>

          <h2 className="font-game relative z-10 mt-4 text-[3.4rem] leading-[0.88] text-lc-text sm:text-[5.25rem]">
            Captain&apos;s Flight
          </h2>
          <p className="relative z-10 mt-3 text-xl font-semibold text-lc-text sm:text-[1.6rem]">
            A complete lesson, start to finish.
          </p>
          <p className="relative z-10 mt-3.5 max-w-lg text-[15px] leading-relaxed text-lc-text2">
            Every stage from warm-up to wrap-up &mdash; speaking, vocabulary, and a closing
            game &mdash; sequenced for you. Built around any topic, video, or article, at the
            level you choose.
          </p>

          {/* Route — the centerpiece */}
          {route.length > 0 && (
            <div className="relative z-10">
              <RouteStrip route={route} reduce={!!reduce} />
            </div>
          )}

          {/* CTA + source controls */}
          <div className="relative z-10 mt-10">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
              <button
                type="button"
                onClick={() => openLaunch(false)}
                className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-lc-amber to-[#e08600] px-7 py-3.5 text-base font-bold text-[#1a0f00] shadow-[0_8px_24px_-6px_rgba(245,158,11,0.6)] transition-all hover:shadow-[0_10px_30px_-6px_rgba(245,158,11,0.85)] hover:brightness-105"
              >
                <Plane className="h-5 w-5" aria-hidden />
                Start this lesson
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </button>

              <div className="flex items-center gap-2">
                <span className="font-instrument mr-0.5 text-[10px] uppercase tracking-[0.18em] text-lc-text3">
                  or add
                </span>
                {[
                  { icon: Video, label: 'Video' },
                  { icon: FileText, label: 'Article' },
                  { icon: Type, label: 'Topic' },
                ].map(({ icon: ChipIcon, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => openLaunch(label !== 'Topic')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.04] px-2.5 py-1.5 text-[13px] font-medium text-lc-text3 transition-colors hover:border-cyan-300/45 hover:bg-cyan-300/10 hover:text-lc-text"
                  >
                    <ChipIcon className="h-4 w-4" aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 text-[13px] text-lc-text3">
              Runs from just a topic &mdash; or bring a video or article, yours or one from the Library.
            </p>
          </div>
        </div>

        {/* ── Perforated stub ──────────────────────────────────────── */}
        <div className="relative flex shrink-0 flex-col border-t-2 border-dashed border-cyan-300/35 bg-cyan-300/[0.05] p-7 lg:w-72 lg:border-l-2 lg:border-t-0 lg:shadow-[inset_12px_0_18px_-12px_rgba(0,0,0,0.6)]">
          {/* Hole-punch perforation along the seam (lg) */}
          <div aria-hidden className="absolute left-0 top-0 hidden h-full -translate-x-1/2 flex-col items-center justify-around py-3 lg:flex">
            {Array.from({ length: 13 }).map((_, i) => (
              <span key={i} className="h-3 w-3 rounded-full bg-[#070B14] shadow-[inset_0_1px_2px_rgba(0,0,0,0.7)]" />
            ))}
          </div>
          {/* Tear notches at seam ends */}
          <span aria-hidden className="absolute -left-2.5 -top-2.5 hidden h-5 w-5 rounded-full bg-[#070B14] lg:block" />
          <span aria-hidden className="absolute -bottom-2.5 -left-2.5 hidden h-5 w-5 rounded-full bg-[#070B14] lg:block" />

          <div className="font-instrument flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-cyan-300/90">
            <span>Boarding Pass</span>
            <span className="text-lc-text3">LC-60</span>
          </div>

          <dl className="mt-5 space-y-3">
            {[
              ['Duration', '≈ 60 min'],
              ['Class', 'Whole class'],
              ['Level', 'You choose'],
              ['Skills', 'All-around'],
              ['Source', 'Optional'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-2">
                <dt className="font-instrument shrink-0 text-[9px] uppercase tracking-[0.16em] text-lc-text3">{k}</dt>
                <span aria-hidden className="min-w-0 flex-1 translate-y-[-2px] border-b border-dotted border-cyan-300/20" />
                <dd className="font-instrument shrink-0 text-[14px] font-semibold text-lc-text">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-auto flex items-center justify-between border-t border-cyan-300/15 pt-5">
            <span className="font-instrument text-[9px] uppercase tracking-[0.16em] text-lc-text3">Gate&nbsp;A1</span>
            <span className="font-instrument inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-emerald-300/90">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Ready to board
            </span>
          </div>

          {/* Barcode — full-width printed label (dark bars on near-white) */}
          <div aria-hidden className="mt-6 rounded-[3px] bg-[#eef2f8] px-2.5 pb-1.5 pt-2 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
            <div className="flex h-14 w-full items-stretch">
              {BARCODE.map((w, i) => (
                <span
                  key={i}
                  className={i % 2 === 0 ? 'bg-[#0b1320]' : 'bg-transparent'}
                  style={{ flexGrow: w, flexBasis: 0 }}
                />
              ))}
            </div>
            <div className="font-instrument mt-1.5 text-center text-[10px] tracking-[0.32em] text-[#4a5670]">
              LC 60 0042 8817
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

function CornerMarks() {
  const base = 'pointer-events-none absolute h-3.5 w-3.5 border-lc-amber/50';
  return (
    <>
      <span aria-hidden className={`${base} left-3 top-3 border-l-2 border-t-2`} />
      <span aria-hidden className={`${base} right-3 top-3 border-r-2 border-t-2`} />
      <span aria-hidden className={`${base} bottom-3 left-3 border-b-2 border-l-2`} />
      <span aria-hidden className={`${base} bottom-3 right-3 border-b-2 border-r-2`} />
    </>
  );
}

// ── Route strip: the three-layer journey — flight PHASE band (fixed structure) over
//    phase-grouped STAGE-JOB stops. Line draws in; stops light in sequence. ─────────
function RouteStrip({
  route,
  reduce,
}: {
  route: RouteWaypoint[];
  reduce: boolean;
}) {
  const n = route.length;
  // Index of the stop the signal has reached; stops with index ≤ activeIdx are lit.
  const [activeIdx, setActiveIdx] = useState(reduce ? n - 1 : -1);

  // Group consecutive stops by flight phase, keeping each stop's global index for lighting.
  const groups: { phase: FlightPhase; items: { wp: RouteWaypoint; idx: number }[] }[] = [];
  route.forEach((wp, idx) => {
    const phase = wp.phase ?? 'cruise';
    const last = groups[groups.length - 1];
    if (last && last.phase === phase) last.items.push({ wp, idx });
    else groups.push({ phase, items: [{ wp, idx }] });
  });

  useEffect(() => {
    if (reduce) {
      setActiveIdx(n - 1);
      return;
    }
    let idx = -1;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      idx += 1;
      if (idx >= n) {
        setActiveIdx(n - 1); // hold the fully-lit route
        timer = setTimeout(() => {
          idx = -1;
          setActiveIdx(-1); // reset dark, then sweep again
          timer = setTimeout(tick, 700);
        }, 1600);
        return;
      }
      setActiveIdx(idx);
      timer = setTimeout(tick, 600); // dwell at each stop
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, [reduce, n]);

  return (
    <div className="mt-8">
      <p className="font-instrument mb-4 text-[10px] uppercase tracking-[0.22em] text-cyan-300/80">
        The lesson, stage by stage
      </p>

      {/* Phase band — the fixed flight-structure layer, grouping the stops below */}
      <div className="mb-2 hidden sm:flex">
        {groups.map((g) => (
          <div key={g.phase} className="px-1.5 text-center" style={{ flexGrow: g.items.length, flexBasis: 0 }}>
            <span className="font-instrument text-[9px] uppercase tracking-[0.24em] text-lc-amber/75">
              {PHASE_LABEL[g.phase]}
            </span>
            <span aria-hidden className="mt-1.5 block h-1.5 rounded-t-[3px] border-x border-t border-cyan-300/15" />
          </div>
        ))}
      </div>

      {/* Track — drawn line + phase-grouped stops, each lighting in sequence */}
      <div className="relative pt-1.5">
        <div className="absolute left-0 right-0 top-[11px] h-px bg-cyan-300/15" />
        <motion.div
          className="absolute left-0 right-0 top-[11px] h-[2px] origin-left rounded-full bg-gradient-to-r from-cyan-300 via-cyan-300/70 to-cyan-300/20 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
          initial={{ scaleX: reduce ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduce ? 0 : 1.2, delay: 0.3, ease: [0.12, 0.8, 0.32, 1] }}
        />

        <ol className="relative flex">
          {groups.map((g) => (
            <li key={g.phase} className="flex justify-around" style={{ flexGrow: g.items.length, flexBasis: 0 }}>
              {g.items.map(({ wp, idx }) => {
                const lit = idx <= activeIdx;
                const isLanding = wp.kind === 'landing';
                const isMicro = wp.kind === 'micro-event';
                return (
                  <motion.div
                    key={`${wp.label}-${idx}`}
                    className="flex flex-col items-center gap-2.5"
                    initial={reduce ? false : { opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: reduce ? 0 : 0.35 + idx * 0.07 }}
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
                        'font-instrument hidden max-w-[5.5rem] text-center text-[10px] uppercase leading-tight tracking-wide transition-colors duration-300 sm:block',
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

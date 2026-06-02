'use client';

// The Teacher Home hero: All-Around Flight as a real boarding-pass OBJECT.
// Torn ticket = main panel + hole-punched stub, paper grain + glass sheen, corner
// registration marks, a barcode, and the flight route as the dominant centerpiece
// (line draws in, plane tracks across). One amber CTA + tactile source controls.
// All motion transform/opacity only; disabled under prefers-reduced-motion.

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Plane, ArrowRight, Video, FileText, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFeaturedRoute } from '@/lib/discovery-shelves';
import { FeaturedFlightLaunchModal } from './FeaturedFlightLaunchModal';

// Subtle paper grain (tiled SVG noise).
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Deterministic barcode bar widths.
const BARCODE = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1];

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
        aria-label="Featured lesson: All-Around Flight"
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
          <div className="flex items-center justify-between">
            <span className="font-instrument inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-cyan-300/90">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.8)]" />
              Featured Flight
            </span>
            <span className="font-instrument text-[11px] uppercase tracking-[0.2em] text-lc-text3">
              LessonCaptain Airways
            </span>
          </div>

          <h2 className="font-game mt-5 text-[2.8rem] leading-[0.92] text-lc-text sm:text-[4rem]">
            All-Around Flight
          </h2>
          <p className="mt-4 max-w-md text-base text-lc-text2">
            One complete live lesson, built around any topic, video, or article.
          </p>

          {/* Route — the centerpiece */}
          {route.length > 0 && <RouteStrip route={route} reduce={!!reduce} />}

          {/* CTA + source controls */}
          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-4">
            <button
              type="button"
              onClick={() => openLaunch(false)}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-lc-amber to-[#e08600] px-7 py-3.5 text-base font-bold text-[#1a0f00] shadow-[0_8px_24px_-6px_rgba(245,158,11,0.6)] transition-all hover:shadow-[0_10px_30px_-6px_rgba(245,158,11,0.85)] hover:brightness-105"
            >
              <Plane className="h-5 w-5" aria-hidden />
              Build this lesson
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="font-instrument mr-0.5 text-[10px] uppercase tracking-[0.18em] text-lc-text3">
                or from
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
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/[0.06] px-4 py-3 text-sm font-medium text-lc-text2 transition-colors hover:border-cyan-300/55 hover:bg-cyan-300/12 hover:text-lc-text"
                >
                  <ChipIcon className="h-[18px] w-[18px]" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Perforated stub ──────────────────────────────────────── */}
        <div className="relative shrink-0 border-t-2 border-dashed border-cyan-300/35 bg-cyan-300/[0.05] p-7 lg:w-72 lg:border-l-2 lg:border-t-0 lg:shadow-[inset_12px_0_18px_-12px_rgba(0,0,0,0.6)]">
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
              ['Source', 'Optional'],
              ['Focus', 'Speaking'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-2">
                <dt className="font-instrument shrink-0 text-[9px] uppercase tracking-[0.16em] text-lc-text3">{k}</dt>
                <span aria-hidden className="min-w-0 flex-1 translate-y-[-2px] border-b border-dotted border-cyan-300/20" />
                <dd className="font-instrument shrink-0 text-[14px] font-semibold text-lc-text">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-center gap-3 border-t border-cyan-300/15 pt-5">
            <div className="rounded-md bg-white/90 p-1.5">
              <QRCodeSVG value="lessoncaptain://all-around-flight" size={46} bgColor="#ffffff" fgColor="#06121f" level="L" />
            </div>
            <div className="font-instrument text-[9px] uppercase leading-relaxed tracking-[0.16em] text-lc-text3">
              Gate&nbsp;A1
              <br />
              Ready to board
            </div>
          </div>

          {/* Barcode */}
          <div aria-hidden className="mt-5 flex h-8 items-stretch gap-[2px] opacity-70">
            {BARCODE.map((w, i) => (
              <span key={i} className="bg-[#c7d2e6]" style={{ width: `${w}px` }} />
            ))}
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

// ── Route strip: drawn line + a signal that eases into each waypoint, dwells, and
//    lights it up as it passes ──────────────────────────────────────────────────
function RouteStrip({
  route,
  reduce,
}: {
  route: { label: string; kind: 'stage' | 'micro-event' | 'end-game' | 'landing' }[];
  reduce: boolean;
}) {
  const n = route.length;
  // Index of the waypoint the signal has reached; dots with index ≤ activeIdx are lit.
  const [activeIdx, setActiveIdx] = useState(reduce ? n - 1 : -1);

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
      timer = setTimeout(tick, 600); // dwell at each dot (≈ travel 0.45s + brief pause)
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, [reduce, n]);

  const cometPct = activeIdx <= 0 ? 0 : (activeIdx / Math.max(1, n - 1)) * 100;

  return (
    <div className="mt-11">
      <div className="font-instrument mb-4 flex items-center justify-between text-[9px] uppercase tracking-[0.22em] text-lc-text3">
        <span>Dep · Icebreaker</span>
        <span>Arr · Landing</span>
      </div>
      <div className="relative pt-1.5">
        {/* Base track */}
        <div className="absolute left-0 right-0 top-[11px] h-px bg-cyan-300/15" />
        {/* Drawn line */}
        <motion.div
          className="absolute left-0 right-0 top-[11px] h-[2px] origin-left rounded-full bg-gradient-to-r from-cyan-300 via-cyan-300/70 to-cyan-300/20 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
          initial={{ scaleX: reduce ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduce ? 0 : 1.2, delay: 0.3, ease: [0.12, 0.8, 0.32, 1] }}
        />
        {/* Signal — eases into each waypoint (easeInOut) and dwells there */}
        {!reduce && activeIdx >= 0 && (
          <motion.div
            aria-hidden
            className="absolute top-[11px] -translate-y-1/2"
            initial={{ left: '0%' }}
            animate={{ left: `${cometPct}%` }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          >
            <div className="relative">
              <div className="absolute right-1 top-1/2 h-[3px] w-16 -translate-y-1/2 rounded-full bg-gradient-to-l from-cyan-200 to-transparent" />
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-50 shadow-[0_0_14px_4px_rgba(34,211,238,0.95)]" />
            </div>
          </motion.div>
        )}

        <ol className="relative flex justify-between">
          {route.map((wp, i) => {
            const lit = i <= activeIdx;
            const isLanding = wp.kind === 'landing';
            return (
              <motion.li
                key={`${wp.label}-${i}`}
                className="flex flex-col items-center gap-2.5"
                initial={reduce ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: reduce ? 0 : 0.35 + i * 0.07 }}
              >
                <span
                  className={cn(
                    'h-4 w-4 rounded-full border-2 transition-all duration-300',
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
                    'font-instrument hidden text-[9px] uppercase tracking-wider transition-colors duration-300 sm:block',
                    lit ? 'text-cyan-100' : 'text-lc-text3',
                  )}
                >
                  {wp.label}
                </span>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

'use client';

// World Flight home hero — the "Globe + the Window" showcase band (home redesign,
// Option B): a full-width, cinematic mode entry that sits BELOW the Captain's
// Flight boarding-pass hero. Deliberately unlike the flat HUD preset cards — a live
// arrival scene rotates behind a bespoke navigation globe, selling "you teach from
// real places." Owns the rotation timer; pauses on hover; single still under
// reduced motion.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Plane } from 'lucide-react';
import { HERO_CITIES } from './hero-cities';
import { DestinationWindow } from './destination-window';
import { NavGlobe } from './globe';

const ADVANCE_MS = 5400;

export function WorldFlightHero({
  ctaHref = '/world-flight',
}: {
  /** Where the primary CTA points. Defaults to the in-app map; the marketing
   *  landing passes a sign-in route since /world-flight requires auth. */
  ctaHref?: string;
} = {}) {
  const reduced = !!useReducedMotion();
  const cities = HERO_CITIES;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || paused || cities.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % cities.length), ADVANCE_MS);
    return () => clearInterval(id);
  }, [reduced, paused, cities.length]);

  if (cities.length === 0) return null;
  const city = cities[active];

  return (
    <section
      aria-label="World Flight"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative isolate min-h-[460px] overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#04101f] shadow-2xl shadow-black/30 md:min-h-[540px]"
    >
      {/* The window — live arrival scene, cross-fading */}
      <DestinationWindow cities={cities} activeIndex={active} reduced={reduced} />

      {/* Legibility scrims: dark on the left (copy) and along the bottom (dots) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#030a14]/95 via-[#030a14]/72 to-transparent md:via-[#030a14]/55" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030a14]/90 to-transparent" />

      <div className="relative z-10 grid h-full min-h-[460px] grid-cols-1 items-center gap-6 p-6 md:min-h-[540px] md:grid-cols-[1.05fr_minmax(0,380px)] md:p-10">
        {/* ── Copy ─────────────────────────────────────────────── */}
        <div className="max-w-xl">
          <p className="font-instrument inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-cyan-300/85">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.8)]" />
            World Flight · A teaching mode
          </p>

          <h2 className="font-game mt-3 text-[2.6rem] leading-[0.92] text-lc-text sm:text-[3.4rem]">
            Fly your class around the world
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-lc-text2">
            Pick a real destination and run a full live lesson grounded in that city: its
            streets, its stories, its language. Earn range, upgrade your plane, and chart a
            course across the map together.
          </p>

          {/* Now arriving */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-instrument shrink-0 text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">
              Now arriving
            </span>
            <span className="h-px flex-1 bg-cyan-300/15" aria-hidden />
          </div>
          <div className="mt-1 flex min-h-[2.4rem] items-baseline gap-3 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={city.id}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="text-2xl font-bold text-lc-text"
              >
                {city.city}
                <span className="ml-2 text-sm font-normal text-lc-text3">{city.country}</span>
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="font-instrument mt-1 text-[11px] uppercase tracking-[0.18em] text-amber-200/80">
            {city.focus}
          </p>

          {/* CTA */}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              href={ctaHref}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-lc-amber to-[#e08600] px-6 py-3.5 text-[15px] font-bold text-[#1a0f00] shadow-[0_8px_24px_-6px_rgba(245,158,11,0.6)] transition-all hover:shadow-[0_10px_30px_-6px_rgba(245,158,11,0.85)] hover:brightness-105"
            >
              <Plane className="h-5 w-5" aria-hidden />
              Choose your destination
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>

            {/* City dots */}
            <div className="flex items-center gap-2" role="tablist" aria-label="Destinations">
              {cities.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={c.city}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === active ? 'w-6 bg-lc-amber' : 'w-2 bg-cyan-300/30 hover:bg-cyan-300/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Globe ────────────────────────────────────────────── */}
        <div className="hidden justify-self-center md:block">
          <div className="w-[360px] max-w-full">
            <NavGlobe cities={cities} activeIndex={active} reduced={reduced} />
          </div>
        </div>
      </div>
    </section>
  );
}

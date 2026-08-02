'use client';

// World Flight home hero — the "Globe + the Window" showcase band. Below Captain's
// Flight. Desktop: a full-bleed cross-fading arrival scene with the copy on the left and
// a bespoke navigation globe on the right. Mobile (option C): a smaller globe + a compact
// destination postcard together up top, then the copy below — both signatures kept, no
// text-over-full-bleed. The mobile/desktop switch is CONTAINER-measured so either variant
// can be previewed at any width. Owns the rotation timer; pauses on hover.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Plane } from 'lucide-react';
import { HERO_CITIES } from './hero-cities';
import { DestinationWindow } from './destination-window';
import { NavGlobe } from './globe';

const ADVANCE_MS = 5400;

// Rounded size of the destination catalog shown in the hero. Kept a step ahead of the
// live count on purpose (Shanghai is being added to make it exactly 50); the rotation
// only showcases a handful, so this tells teachers the full set is much larger.
const DESTINATION_COUNT = 50;
const MOBILE_MAX = 768;

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

  // Container-measured layout switch so the mobile + desktop variants respond to the
  // panel width (works in a dev gallery at any width, not just the real viewport).
  const ref = useRef<HTMLElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (w: number) => {
      if (w > 0) setWidth((p) => (p !== null && Math.abs(p - w) < 1 ? p : w));
    };
    update(el.getBoundingClientRect().width);
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) update(e.contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const isMobile = width !== null && width < MOBILE_MAX;

  useEffect(() => {
    if (reduced || paused || cities.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % cities.length), ADVANCE_MS);
    return () => clearInterval(id);
  }, [reduced, paused, cities.length]);

  if (cities.length === 0) return null;
  const city = cities[active];

  // ── Shared pieces ────────────────────────────────────────────────────────────
  const eyebrow = (
    <p className="font-instrument inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-cyan-300/85">
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.8)]" />
      World Flight · A teaching mode
    </p>
  );

  const cta = (
    <Link
      href={ctaHref}
      className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-lc-amber to-[#e08600] px-6 py-3.5 text-[15px] font-bold text-[#1a0f00] shadow-[0_8px_24px_-6px_rgba(245,158,11,0.6)] transition-all hover:shadow-[0_10px_30px_-6px_rgba(245,158,11,0.85)] hover:brightness-105"
    >
      <Plane className="h-5 w-5" aria-hidden />
      Choose your destination
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );

  const dots = (
    <div className="flex items-center gap-3">
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
      <span className="font-instrument text-[11px] uppercase tracking-[0.16em] text-lc-text3">
        +{DESTINATION_COUNT - cities.length} more
      </span>
    </div>
  );

  return (
    <section
      ref={ref}
      aria-label="World Flight"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative isolate overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#04101f] shadow-2xl shadow-black/30"
    >
      {isMobile ? (
        // ── MOBILE (option C): globe + destination postcard up top, copy below ──
        <div className="p-5">
          <div className="flex items-stretch gap-3">
            <div className="relative aspect-square w-[38%] max-w-[150px] shrink-0">
              <NavGlobe cities={cities} activeIndex={active} reduced={reduced} size={150} />
            </div>
            <div className="relative flex-1 overflow-hidden rounded-xl border border-cyan-300/20 bg-[#03101f]">
              <DestinationWindow cities={cities} activeIndex={active} reduced={reduced} />
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#030a14]/92 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <span className="font-instrument block text-[9px] uppercase tracking-[0.2em] text-cyan-300/70">Now arriving</span>
                <span className="block truncate text-[15px] font-bold text-lc-text">{city.city}</span>
                <span className="font-instrument block truncate text-[9px] uppercase tracking-wider text-amber-200/80">{city.focus}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {eyebrow}
            <h2 className="font-game mt-2 text-[2rem] leading-[0.95] text-lc-text">Fly your class around the world</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-lc-text2">
              Pick from {DESTINATION_COUNT} real destinations and run a full live lesson built around that
              city — earn range, upgrade your plane, and chart a course across the map.
            </p>
            <div className="mt-5 flex flex-col gap-4">
              {cta}
              {dots}
            </div>
          </div>
        </div>
      ) : (
        // ── DESKTOP: full-bleed arrival scene + copy left + globe right ──
        <div className="relative min-h-[460px] md:min-h-[540px]">
          <DestinationWindow cities={cities} activeIndex={active} reduced={reduced} />

          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#030a14]/95 via-[#030a14]/72 to-transparent md:via-[#030a14]/55" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030a14]/90 to-transparent" />

          <div className="relative z-10 grid h-full min-h-[460px] grid-cols-1 items-center gap-6 p-6 md:min-h-[540px] md:grid-cols-[1.05fr_minmax(0,380px)] md:p-10">
            <div className="max-w-xl">
              {eyebrow}
              <h2 className="font-game mt-3 text-[2.6rem] leading-[0.92] text-lc-text sm:text-[3.4rem]">
                Fly your class around the world
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-lc-text2">
                Pick from {DESTINATION_COUNT} real destinations and run a full live lesson built around
                that city: its streets, its stories, its language. Earn range, upgrade your plane, and
                chart a course across the map together.
              </p>

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

              <div className="mt-7 flex flex-wrap items-center gap-4">
                {cta}
                {dots}
              </div>
            </div>

            <div className="hidden justify-self-center md:block">
              <div className="w-[360px] max-w-full">
                <NavGlobe cities={cities} activeIndex={active} reduced={reduced} />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

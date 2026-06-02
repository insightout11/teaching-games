'use client';

// Teacher Home — the "Departure Lounge". A cinematic, full-width command center:
// real night-sky atmosphere, an All-Around Flight boarding pass that dominates the
// first viewport, a compact "previous flights" strip, then teacher-job shelves.
// Brief: "here are today's best lesson routes for your class," not a catalog.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { Compass, Library as LibraryIcon, Plane, ChevronRight } from 'lucide-react';
import { SkyBackground } from '@/components/ui/sky-background';
import { buildShelves, type DiscoveryItem } from '@/lib/discovery-shelves';
import { FeaturedFlightHero } from './FeaturedFlightHero';
import { DiscoveryShelf } from './DiscoveryShelf';
import { DiscoveryDetailDrawer } from './DiscoveryDetailDrawer';

export interface RecentSession {
  id: string;
  topic: string;
  custom_topic: string | null;
  started_at: string;
  status: string;
  class_name: string;
}

interface TeacherHomeClientProps {
  recentSessions: RecentSession[];
  isPro: boolean;
  credits: number;
  isFirstVisit: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TeacherHomeClient({ recentSessions, isPro, credits, isFirstVisit }: TeacherHomeClientProps) {
  const reduce = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [depth, setDepth] = useState(0);
  const [selected, setSelected] = useState<DiscoveryItem | null>(null);

  const shelves = buildShelves();

  // Scroll-linked climb: gentle altitude rise drives the sky's parallax (gate → climb).
  useEffect(() => {
    if (reduce) return;
    // The dashboard <main> is overflow-auto but its parent isn't height-constrained,
    // so depending on content the WINDOW may scroll instead of <main>. Listen to both
    // and read depth from whichever is actually scrollable.
    const main = wrapperRef.current?.closest('main') as HTMLElement | null;
    let raf = 0;
    const compute = () => {
      const doc = document.scrollingElement || document.documentElement;
      const mainMax = main ? main.scrollHeight - main.clientHeight : 0;
      const docMax = doc.scrollHeight - doc.clientHeight;
      const { top, max } =
        mainMax > 8
          ? { top: main!.scrollTop, max: mainMax }
          : { top: doc.scrollTop || window.scrollY, max: docMax };
      setDepth(max > 0 ? Math.min(1, top / max) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    main?.addEventListener('scroll', onScroll, { passive: true });
    compute();
    return () => {
      window.removeEventListener('scroll', onScroll);
      main?.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  // Card click opens a detail drawer (Library-style) — it never commits an action.
  function handleSelect(item: DiscoveryItem) {
    setSelected(item);
  }

  // Scroll depth drives a real sky phase: gate → climb → cruise.
  const skyPhase: 'idle' | 'climbing' | 'cruising' =
    reduce || depth < 0.22 ? 'idle' : depth < 0.6 ? 'climbing' : 'cruising';
  const skyEarth: 'takeoff' | 'flight' = reduce || depth < 0.22 ? 'takeoff' : 'flight';
  const skyAltitude = reduce ? 0 : Math.min(0.92, depth * 1.05);

  return (
    <div ref={wrapperRef} className="relative -mx-6 -mt-6 min-h-full lg:-mx-8 lg:-mt-8">
      {/* Cinematic night-departure atmosphere; morphs gate → climb → cruise on scroll.
          altitudeInitial triggers a one-shot parallax "fly-in" on load — the clouds and
          runway glide vertically into place before the teacher scrolls. */}
      <SkyBackground
        weatherState={skyPhase}
        earthState={skyEarth}
        altitude={skyAltitude}
        altitudeInitial={reduce ? undefined : 0.55}
        showMoon={skyPhase === 'cruising'}
        showRunwayMarkings={skyEarth === 'takeoff'}
        showSkyline={skyEarth === 'takeoff'}
        intensity="subtle"
        className="md:!left-64"
      />
      {/* Gate / apron glow — warms the airfield into a lit "departure lounge" */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 z-[1] h-[55vh] md:!left-64">
        <div className="absolute -bottom-[12%] left-[14%] h-[45vh] w-[42%] rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.13),transparent)] blur-3xl" />
        <div className="absolute -bottom-[8%] right-[12%] h-[38vh] w-[36%] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.10),transparent)] blur-3xl" />
      </div>
      {/* Legibility veil — sky stays vivid behind the hero, darkens over the shelves */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#060b16]/25 via-[#060b16]/55 to-[#060b16]/92"
      />

      <div className="relative z-10 px-6 pb-20 pt-7 lg:px-10">
        <div className="mx-auto w-full max-w-[1500px]">
          {/* Slim top bar */}
          <div className="mb-2 flex items-center justify-between">
            <p className="font-instrument text-[11px] uppercase tracking-[0.26em] text-cyan-300/80">
              Departure Lounge
            </p>
            {!isPro && (
              <span className="font-instrument rounded-full border border-cyan-300/20 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-wider text-lc-text2">
                {credits} Test Flight{credits === 1 ? '' : 's'} left
              </span>
            )}
          </div>

          {/* HERO — dominates the first viewport; heading is a quiet prompt */}
          <section className="flex min-h-[74vh] flex-col justify-center py-6">
            <h1 className="mb-5 text-sm font-normal text-lc-text3">
              What are you teaching today?
            </h1>
            <FeaturedFlightHero />
            {isFirstVisit && (
              <p className="mt-5 text-sm text-lc-text3">
                New here? Start with a complete flight — it sequences the whole lesson for you in minutes.
              </p>
            )}
          </section>

          {/* Previous flights — compact strip */}
          {recentSessions.length > 0 && (
            <section aria-label="Recent lessons" className="mt-6">
              <h2 className="font-instrument mb-3 text-[11px] uppercase tracking-[0.2em] text-lc-text3">
                Previous flights
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {recentSessions.map((s) => (
                  <Link
                    key={s.id}
                    href="/lesson-planner"
                    className="group flex w-56 shrink-0 items-center gap-3 rounded-xl border border-cyan-300/15 bg-white/[0.03] px-4 py-3 backdrop-blur-sm transition-colors hover:border-cyan-300/40 hover:bg-white/[0.06]"
                  >
                    <Plane className="h-4 w-4 shrink-0 rotate-45 text-cyan-300/70" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-lc-text">
                        {s.custom_topic || s.topic}
                      </span>
                      <span className="font-instrument block truncate text-[10px] uppercase tracking-wider text-lc-text3">
                        {s.class_name} · {formatDate(s.started_at)}
                      </span>
                    </span>
                    <span className="font-instrument text-[9px] uppercase tracking-wider text-lc-amber opacity-0 transition-opacity group-hover:opacity-100">
                      Run
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Teacher-job shelves */}
          <div className="mt-14 space-y-12">
            {shelves.map((shelf) => (
              <DiscoveryShelf
                key={shelf.id}
                label={shelf.label}
                description={shelf.description}
                items={shelf.items}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Catalog + Library — two distinct destinations */}
          <section aria-label="Browse more" className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Link
              href="/explore"
              className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/[0.10] to-transparent p-6 backdrop-blur-sm transition-colors hover:border-cyan-300/50"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-cyan-400/70" />
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10">
                <Compass className="h-7 w-7 text-cyan-300" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold text-lc-text">Open Activity Catalog</span>
                <span className="mt-0.5 block text-[13px] text-lc-text3">Browse every game and activity, with filters.</span>
              </span>
              <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-cyan-300/70 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <Link
              href="/library"
              className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-lc-amber/25 bg-gradient-to-br from-lc-amber/[0.10] to-transparent p-6 backdrop-blur-sm transition-colors hover:border-lc-amber/50"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-lc-amber/70" />
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-lc-amber/25 bg-lc-amber/10">
                <LibraryIcon className="h-7 w-7 text-lc-amber" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold text-lc-text">Open Source Library</span>
                <span className="mt-0.5 block text-[13px] text-lc-text3">Your videos, readings, courses, and saved plans.</span>
              </span>
              <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-lc-amber/70 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </section>
        </div>
      </div>

      {/* Library-style detail drawer for the clicked activity/game */}
      <DiscoveryDetailDrawer item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}


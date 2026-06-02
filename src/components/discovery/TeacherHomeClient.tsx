'use client';

// Teacher Home — the "Departure Lounge". A cinematic, full-width command center:
// real night-sky atmosphere, an All-Around Flight boarding pass that dominates the
// first viewport, a compact "previous flights" strip, then teacher-job shelves.
// Brief: "here are today's best lesson routes for your class," not a catalog.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { Compass, Library as LibraryIcon, Plane, ChevronRight } from 'lucide-react';
import { SkyBackground } from '@/components/ui/sky-background';
import { usePlannerStore } from '@/stores/planner-store';
import { buildShelves, type DiscoveryItem } from '@/lib/discovery-shelves';
import { FeaturedFlightHero } from './FeaturedFlightHero';
import { DiscoveryShelf } from './DiscoveryShelf';

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
  const router = useRouter();
  const seedWithModule = usePlannerStore((s) => s.seedWithModule);
  const reduce = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [depth, setDepth] = useState(0);

  const shelves = buildShelves();

  // Scroll-linked climb: gentle altitude rise drives the sky's parallax (gate → climb).
  useEffect(() => {
    if (reduce) return;
    const scroller = wrapperRef.current?.closest('main');
    if (!scroller) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = scroller.scrollHeight - scroller.clientHeight;
        setDepth(max > 0 ? Math.min(1, scroller.scrollTop / max) : 0);
      });
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  function handleSelect(item: DiscoveryItem) {
    seedWithModule(item.key, item.meta?.slotFit?.[0] ?? 'practice');
    router.push('/lesson-planner');
  }

  return (
    <div ref={wrapperRef} className="relative -mx-6 -mt-6 min-h-full lg:-mx-8 lg:-mt-8">
      {/* Cinematic night-departure atmosphere (covers the global golden sky on this route) */}
      <SkyBackground
        weatherState="idle"
        earthState="takeoff"
        altitude={reduce ? 0 : depth * 0.55}
        showMoon
        showRunwayMarkings
        intensity="moderate"
        className="md:!left-64"
      />
      {/* Legibility veil so text reads cleanly over the sky */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#060b16]/40 via-transparent to-[#060b16]/85"
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

          {/* HERO — dominates the first viewport */}
          <section className="flex min-h-[74vh] flex-col justify-center py-6">
            <h1 className="mb-7 max-w-2xl text-3xl font-bold leading-tight text-lc-text sm:text-[2.5rem]">
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

          {/* Browse + Library */}
          <section aria-label="Browse more" className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/explore"
              className="group flex items-center gap-4 rounded-2xl border border-cyan-300/15 bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:border-cyan-300/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15">
                <Compass className="h-5 w-5 text-cyan-300" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-lc-text">Browse all activities</span>
                <span className="block text-[13px] text-lc-text3">Every game and activity, with filters.</span>
              </span>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-lc-text3 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/library"
              className="group flex items-center gap-4 rounded-2xl border border-lc-amber/15 bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:border-lc-amber/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lc-amber/15">
                <LibraryIcon className="h-5 w-5 text-lc-amber" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-lc-text">Open your library</span>
                <span className="block text-[13px] text-lc-text3">Videos, readings, courses, and saved plans.</span>
              </span>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-lc-text3 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

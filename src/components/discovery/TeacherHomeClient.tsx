'use client';

// Teacher Home — the "what should I run?" command center.
// Twilight-cockpit backdrop (deep-night HUD), All-Around Flight hero, recent flights,
// and teacher-job shelves. The brief: "here are today's best lesson routes for your
// class," not "a catalog of stuff."

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { Compass, Library as LibraryIcon, Clock, ChevronRight, Plane } from 'lucide-react';
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
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TeacherHomeClient({ recentSessions, isPro, credits, isFirstVisit }: TeacherHomeClientProps) {
  const router = useRouter();
  const seedWithModule = usePlannerStore((s) => s.seedWithModule);
  const prefersReducedMotion = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [depth, setDepth] = useState(0);

  const shelves = buildShelves();

  // Subtle scroll-driven depth (gate → cruise). Transform/opacity only; off when reduced-motion.
  useEffect(() => {
    if (prefersReducedMotion) return;
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
  }, [prefersReducedMotion]);

  function handleSelect(item: DiscoveryItem) {
    const slot = item.meta?.slotFit?.[0] ?? 'practice';
    seedWithModule(item.key, slot);
    router.push('/lesson-planner');
  }

  return (
    <div
      ref={wrapperRef}
      className="hud-bg relative -mx-6 -mt-6 min-h-full px-6 pb-16 pt-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8"
    >
      {/* Atmosphere: slow drifting cloud band + scroll-reactive cockpit glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="cloud-layer-far absolute left-0 top-[6%]" style={{ width: '200vw' }}>
          <div className="h-40 w-[40vw] rounded-full bg-cyan-300/[0.04] blur-3xl" />
          <div className="absolute left-[80vw] top-10 h-32 w-[34vw] rounded-full bg-sky-300/[0.035] blur-3xl" />
        </div>
        <div
          className="absolute left-1/2 top-0 h-[70vh] w-[120vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(34,211,238,0.10),transparent)] blur-2xl"
          style={{ transform: `translate(-50%, ${depth * 220}px)`, opacity: 0.45 + depth * 0.5 }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-10">
        {/* Greeting */}
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-lc-text">What are you teaching today?</h1>
            <p className="mt-1 text-sm text-lc-text3">
              Start with a complete flight, or drop in a single activity.
            </p>
          </div>
          {!isPro && (
            <span className="font-instrument shrink-0 rounded-full border border-lc-border bg-lc-card/70 px-3 py-1 text-[11px] uppercase tracking-wider text-lc-text2">
              {credits} Test Flight{credits === 1 ? '' : 's'} left
            </span>
          )}
        </header>

        {/* First-visit nudge */}
        {isFirstVisit && (
          <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.06] px-5 py-4 text-sm text-lc-text2">
            New here? The best first run is a complete <span className="text-lc-text">All-Around Flight</span> —
            warm-up, language, discussion, a game, and a landing, built around your topic in minutes.
          </div>
        )}

        {/* Hero */}
        <FeaturedFlightHero />

        {/* Continue / Recent — "previous flights" */}
        {recentSessions.length > 0 && (
          <section aria-label="Recent lessons">
            <h2 className="font-instrument mb-3 text-[11px] uppercase tracking-[0.18em] text-lc-text3">
              Previous flights
            </h2>
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-lc-border bg-lc-card/70 px-5 py-3.5 transition-colors hover:border-lc-border-subtle"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Clock className="h-4 w-4 shrink-0 text-lc-text3" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-lc-text">{s.custom_topic || s.topic}</p>
                      <p className="text-xs text-lc-text3">
                        {s.class_name} · {formatDate(s.started_at)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/lesson-planner"
                    className="ml-4 shrink-0 rounded-lg border border-lc-amber/30 px-3 py-1.5 text-xs font-semibold text-lc-amber transition-colors hover:border-lc-amber/60"
                  >
                    Run again
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Teacher-job shelves */}
        {shelves.map((shelf) => (
          <DiscoveryShelf
            key={shelf.id}
            label={shelf.label}
            description={shelf.description}
            items={shelf.items}
            onSelect={handleSelect}
          />
        ))}

        {/* Browse + Library entries */}
        <section aria-label="Browse more" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/explore"
            className="panel-card group flex items-center gap-4 p-5 transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15">
              <Compass className="h-5 w-5 text-cyan-400" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-lc-text">Browse all activities</span>
              <span className="block text-[13px] text-lc-text3">Every game and activity, with filters.</span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-lc-text3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          </Link>
          <Link
            href="/library"
            className="panel-card group flex items-center gap-4 p-5 transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lc-amber/15">
              <LibraryIcon className="h-5 w-5 text-lc-amber" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-lc-text">Open your library</span>
              <span className="block text-[13px] text-lc-text3">Videos, readings, courses, and saved plans.</span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-lc-text3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
          </Link>
        </section>

        {/* Fallback if every shelf was filtered out (shouldn't happen with the live catalog) */}
        {shelves.length === 0 && (
          <Link
            href="/lesson-planner"
            className="inline-flex items-center gap-2 text-sm font-semibold text-lc-amber"
          >
            <Plane className="h-4 w-4" aria-hidden />
            Plan a Flight
          </Link>
        )}
      </div>
    </div>
  );
}

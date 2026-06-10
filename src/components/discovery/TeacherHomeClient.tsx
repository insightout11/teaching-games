'use client';

// Teacher Home — the "Departure Lounge". A cinematic, full-width command center:
// real night-sky atmosphere, an All-Around Flight boarding pass that dominates the
// first viewport, a compact "previous flights" strip, then teacher-job shelves.
// Brief: "here are today's best lesson routes for your class," not a catalog.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { Compass, Globe2, Library as LibraryIcon, Plane, ChevronRight, Sparkles } from 'lucide-react';
import { SkyBackground } from '@/components/ui/sky-background';
import { buildShelves, type DiscoveryItem } from '@/lib/discovery-shelves';
import type { TeacherProfile, TeachingFocus } from '@/lib/teacher-profile';
import { FeaturedFlightHero } from './FeaturedFlightHero';
import { FullFlightsLane } from './FullFlightsLane';
import { ReadyToTeachLane } from './ReadyToTeachLane';
import { SpecialFeaturesLane } from './SpecialFeaturesLane';
import { RecommendedLane } from './RecommendedLane';
import { OnboardingFlow } from './OnboardingFlow';
import { DiscoveryShelf } from './DiscoveryShelf';
import { DiscoveryDetailDrawer } from './DiscoveryDetailDrawer';

const ONBOARDING_DISMISSED_KEY = 'lc-onboarding-dismissed';

// Only the highest-urgency shelves live on the home; the rest stay in Browse so the page
// reads as a home, not a catalog (§3). The teacher's focus (from onboarding) leads the row.
const BASE_HOME_SHELVES = ['end-with-a-game', 'speaking', 'quick'];
const FOCUS_LEAD_SHELF: Record<TeachingFocus, string | null> = {
  speaking: 'speaking',
  vocabulary: 'vocabulary',
  kids: 'end-with-a-game',
  grammar: null, // no dedicated grammar shelf yet
  exam: null,
  business: null,
};
function homeShelfIdsFor(focus: TeachingFocus | null): string[] {
  const lead = focus ? FOCUS_LEAD_SHELF[focus] : null;
  if (!lead) return BASE_HOME_SHELVES;
  return [lead, ...BASE_HOME_SHELVES.filter((id) => id !== lead).slice(0, 2)];
}

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
  profile: TeacherProfile | null;
  onboardingCompleted: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TeacherHomeClient({ recentSessions, isPro, credits, isFirstVisit, profile, onboardingCompleted }: TeacherHomeClientProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [depth, setDepth] = useState(0);
  const [selected, setSelected] = useState<DiscoveryItem | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // NOTE: demo crew UI entry points removed Jun 2026 — the simulator only
  // handles broadcast-style modules; turn-based/format-validated games looked
  // broken. Plumbing (/api/session/demo, /api/demo/*, DemoSimulator) is kept
  // dormant pending a scoped rebuild with per-module support declarations.

  // First-run, skippable: open once if not completed and not dismissed before.
  useEffect(() => {
    if (onboardingCompleted) return;
    try {
      if (localStorage.getItem(ONBOARDING_DISMISSED_KEY) === '1') return;
    } catch { /* ignore */ }
    setShowOnboarding(true);
  }, [onboardingCompleted]);

  function dismissOnboarding() {
    try { localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1'); } catch { /* ignore */ }
    setShowOnboarding(false);
  }
  function completeOnboarding() {
    setShowOnboarding(false);
    router.refresh(); // re-fetch the profile so Recommended updates
  }

  const shelfById = new Map(buildShelves().map((s) => [s.id, s] as const));
  const homeShelves = homeShelfIdsFor(profile?.focus ?? null);
  const shelfProfile = profile?.classSize ? { setup: profile.classSize } : undefined;
  const renderShelf = (id: string) => {
    const shelf = shelfById.get(id);
    if (!shelf) return null;
    return (
      <DiscoveryShelf
        label={shelf.label}
        description={shelf.description}
        items={shelf.items}
        onSelect={handleSelect}
        profile={shelfProfile}
      />
    );
  };

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

  // DESCENT narrative: top = high cruise sky, bottom = runway/gate (the action point).
  // The ground is simply NOT RENDERED up high (showEarth=false) — the most reliable way
  // to keep the hero in clean sky — then the runway appears and the city follows as you
  // scroll down, with altitude parallax sliding them up into view.
  // Ground (runway + skyline together) FADES in/out with scroll rather than toggling,
  // so scrolling back up never pops. earthState only flips to 'takeoff' once the ground
  // is essentially invisible, so the terrain swap + takeoff sun cross-fade smoothly too.
  const earthOpacity = reduce ? 0 : Math.max(0, Math.min(1, (depth - 0.3) / 0.22));
  const skyEarthState: 'flight' | 'takeoff' = reduce || depth < 0.32 ? 'flight' : 'takeoff';
  const skyPhase: 'idle' | 'cruising' | 'golden' =
    reduce ? 'cruising' : depth < 0.42 ? 'cruising' : depth < 0.7 ? 'golden' : 'idle';
  const skyAltitude = reduce ? 0.85 : (1 - depth) * 0.85;

  return (
    <div ref={wrapperRef} className="relative -mx-6 -mt-6 min-h-full lg:-mx-8 lg:-mt-8">
      {/* Cinematic night-departure atmosphere; morphs gate → climb → cruise on scroll.
          altitudeInitial triggers a one-shot parallax "fly-in" on load — the clouds and
          runway glide vertically into place before the teacher scrolls. */}
      <SkyBackground
        weatherState={skyPhase}
        earthState={skyEarthState}
        altitude={skyAltitude}
        altitudeInitial={reduce ? undefined : 3.2}
        parallaxScale={1.6}
        parallaxDuration={0.9}
        showEarth
        earthOpacity={earthOpacity}
        showMoon
        moonPosition={{ top: '8%', right: '20%' }}
        showRunwayMarkings
        showSkyline
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
            <div className="flex items-center gap-3">
              {!onboardingCompleted && (
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="font-instrument inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-400/[0.06] px-3 py-1 text-[11px] uppercase tracking-wider text-cyan-200 transition-colors hover:border-cyan-300/60 hover:bg-cyan-400/10"
                >
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Personalize your home
                </button>
              )}
              {!isPro && (
                <span className="font-instrument rounded-full border border-cyan-300/20 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-wider text-lc-text2">
                  {credits} Test Flight{credits === 1 ? '' : 's'} left
                </span>
              )}
            </div>
          </div>

          {/* HERO — dominates the first viewport; heading is a deliberate gate-board label */}
          <section className="flex min-h-[74vh] flex-col justify-center py-6">
            <div className="mb-6 inline-flex w-fit items-center gap-3 rounded-lg border border-cyan-300/20 bg-[#040a14]/70 px-3.5 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)] motion-safe:animate-pulse" aria-hidden />
              <span className="font-instrument text-[11px] uppercase tracking-[0.24em] text-emerald-300/90">Now boarding</span>
              <span className="h-3.5 w-px bg-cyan-300/20" aria-hidden />
              <h1 className="font-instrument text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-100/90">
                What are you teaching today?
              </h1>
            </div>
            <FeaturedFlightHero />
            {isFirstVisit && (
              <p className="mt-5 text-sm text-lc-text3">
                New here? Start with a complete lesson — it sequences the whole class for you in minutes.
              </p>
            )}
          </section>

          {/* Recommended for you — driven by the onboarding profile (cold-start = starting points) */}
          <section className="mt-4">
            <RecommendedLane profile={profile} />
          </section>

          {/* Jump back in — compact strip of recent flights */}
          {recentSessions.length > 0 && (
            <section aria-label="Recent lessons" className="mt-6">
              <h2 className="font-instrument mb-3 text-[11px] uppercase tracking-[0.2em] text-lc-text3">
                Jump back in
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

          {/* Interleaved: rich featured lanes punctuate the plain card rows so the page
              reads as a home, not a catalog (docs/home-screen-redesign-audit-jun2026.md §3).
              The two strongest "ready to run" options lead (Full Flights → Ready to Teach);
              End with a Game is a garnish shelf and sits below them. */}
          <div className="mt-14 space-y-14">
            <section aria-label="World Flight" className="rounded-2xl border border-cyan-300/20 bg-[#04101f]/78 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm">
              <div className="flex items-center gap-5">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10">
                  <Globe2 className="h-8 w-8 text-cyan-300" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-instrument text-[10px] uppercase tracking-[0.24em] text-cyan-300/75">
                    Prototype mode
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-lc-text">World Flight</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-lc-text3">
                    Fly to a real city, choose a classroom focus, then launch a normal Captain&apos;s Flight from that destination pack.
                  </p>
                </div>
                <Link
                  href="/world-flight"
                  className="font-instrument inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-lc-blue px-4 text-xs font-bold uppercase tracking-wider text-[#06101d] transition-colors hover:bg-lc-blue-hover"
                >
                  Open Map
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </section>
            <FullFlightsLane />
            <ReadyToTeachLane />
            {renderShelf(homeShelves[0])}
            <SpecialFeaturesLane />
            {renderShelf(homeShelves[1])}
            {renderShelf(homeShelves[2])}
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

      {/* First-run personalization */}
      <OnboardingFlow open={showOnboarding} onClose={dismissOnboarding} onCompleted={completeOnboarding} />
    </div>
  );
}

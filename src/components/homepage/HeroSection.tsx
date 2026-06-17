'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlaneTakeoff,
  Play,
  ArrowRight,
  Youtube,
  FileText,
  Lightbulb,
  ArrowUpRight,
} from 'lucide-react';
import { FEATURED_CHIPS } from '@/lib/video-lesson-demos';
import { CAPTAINS_FLIGHT_STEPS } from '@/lib/marketing/captains-flight-steps';
import { LessonCaptainFlightPlan } from '@/components/ui/flight-plan';

// Client-safe YouTube ID parser (the lib helper is server-only). Falls back to a
// ?url= hand-off when a pasted link isn't a recognizable YouTube URL.
function parseYouTubeId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

// "Just a topic" chips — real Standard-tier subjects (see src/lib/standard-topics.ts).
const TOPIC_CHIPS = [
  'Travel & Tourism',
  'Technology',
  'Environment',
  'Food & Culture',
  'Work & Careers',
];

type EntryTab = 'video' | 'article' | 'topic' | 'flight';

const TABS: { id: EntryTab; icon: typeof Youtube; label: string }[] = [
  { id: 'video', icon: Youtube, label: 'YouTube' },
  { id: 'article', icon: FileText, label: 'Article' },
  { id: 'topic', icon: Lightbulb, label: 'Topic' },
  { id: 'flight', icon: PlaneTakeoff, label: 'Ready-made' },
];

// ── The "start from anything" widget ─────────────────────────────────────────
function StartWidget() {
  const router = useRouter();
  const [tab, setTab] = useState<EntryTab>('video');
  const [url, setUrl] = useState('');

  function buildFromUrl(target: string) {
    const trimmed = target.trim();
    if (!trimmed) return;
    const id = parseYouTubeId(trimmed);
    // Cached chips/known IDs use ?v= (shareable + free); arbitrary links use ?url=.
    router.push(id ? `/video-lesson?v=${id}` : `/video-lesson?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="rounded-2xl border border-lc-border bg-lc-card/70 p-1.5 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.9)] backdrop-blur-sm">
      {/* Segmented control — four entry points, breadth made visible */}
      <div className="flex items-center gap-1 rounded-xl bg-lc-surface/60 p-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={active}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors sm:text-xs ${
                active ? 'text-lc-text' : 'text-lc-text3 hover:text-lc-text2'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="entryTabPill"
                  className="absolute inset-0 rounded-lg border border-lc-blue/30 bg-lc-blue/[0.12]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="relative h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="relative truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel — fixed min-height so switching tabs doesn't jump the layout */}
      <div className="min-h-[208px] px-3.5 pb-3.5 pt-4">
        {tab === 'video' && (
          <div>
            <p className="mb-3 text-sm font-medium text-lc-text">
              Paste a video — a full lesson builds itself.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') buildFromUrl(url);
                }}
                placeholder="Paste a YouTube link…"
                aria-label="YouTube video link"
                className="min-w-0 flex-1 rounded-lg border border-lc-border bg-lc-surface px-3.5 py-2.5 text-sm text-lc-text placeholder-lc-text3 outline-none focus:border-lc-amber/60 focus:ring-1 focus:ring-lc-amber/40"
              />
              <button
                onClick={() => buildFromUrl(url)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-lc-amber px-4 py-2.5 text-sm font-bold text-[#1a0f00] transition-colors hover:bg-lc-amber/90"
              >
                <PlaneTakeoff className="h-4 w-4" aria-hidden />
                Build my lesson
              </button>
            </div>
            <p className="mt-2 text-[11px] text-lc-text3">Free · no sign-up · 60 seconds</p>

            {/* Example videos — deliberately small, subordinate to the flight plan below */}
            <p className="mt-3.5 text-[10px] font-semibold uppercase tracking-wider text-lc-text3">
              or try one of these
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {FEATURED_CHIPS.map((chip) => (
                <Link
                  key={chip.videoId}
                  href={`/video-lesson?v=${chip.videoId}`}
                  title={chip.title}
                  className="group relative overflow-hidden rounded-lg border border-cyan-300/15 bg-black/40 transition-colors hover:border-cyan-300/45"
                >
                  <div className="relative aspect-video w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${chip.videoId}/mqdefault.jpg`}
                      alt={chip.title}
                      className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                    />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
                        <Play className="h-3 w-3 translate-x-px" aria-hidden />
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {tab === 'article' && (
          <div className="flex h-full flex-col">
            <p className="text-sm font-medium text-lc-text">Bring your own reading.</p>
            <p className="mt-2 text-sm leading-relaxed text-lc-text2">
              Paste any article, PDF, or your own text in the planner and the same lesson
              builds around it — vocabulary, comprehension, discussion, and a review game.
            </p>
            <Link
              href="/login"
              className="mt-auto inline-flex w-fit items-center gap-1.5 pt-4 text-sm font-semibold text-lc-blue transition-colors hover:text-lc-blue-hover"
            >
              Open the planner
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}

        {tab === 'topic' && (
          <div className="flex h-full flex-col">
            <p className="text-sm font-medium text-lc-text">No source? Pick a topic.</p>
            <p className="mt-2 text-sm leading-relaxed text-lc-text2">
              Name what your class is into — we build the whole flight around it.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TOPIC_CHIPS.map((topic) => (
                <Link
                  key={topic}
                  href="/login"
                  className="rounded-full border border-lc-border bg-lc-surface px-3 py-1.5 text-xs font-medium text-lc-text2 transition-colors hover:border-lc-blue hover:text-lc-text"
                >
                  {topic}
                </Link>
              ))}
            </div>
            <Link
              href="/login"
              className="mt-auto inline-flex w-fit items-center gap-1.5 pt-4 text-sm font-semibold text-lc-blue transition-colors hover:text-lc-blue-hover"
            >
              Start from a topic
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}

        {tab === 'flight' && (
          <div className="flex h-full flex-col">
            <p className="text-sm font-medium text-lc-text">Don&apos;t want to build anything?</p>
            <p className="mt-2 text-sm leading-relaxed text-lc-text2">
              Run <span className="font-semibold text-lc-text">Captain&apos;s Flight</span> — a
              complete 60-minute lesson, warm-up to wrap-up, already sequenced for you. Drop in
              a topic and go.
            </p>
            <Link
              href="/showcase"
              className="mt-auto inline-flex w-fit items-center gap-1.5 pt-4 text-sm font-semibold text-lc-blue transition-colors hover:text-lc-blue-hover"
            >
              See the flight
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── The product: a live Captain's Flight, plotted from the real preset ───────
function FlightPlanPanel() {
  const reduce = useReducedMotion();
  // Settle the plane early in the cruise so it reads as a lesson underway while most
  // stage cards stay bright (completed cards dim) — a fuller, more vivid panel.
  const [activeIndex, setActiveIndex] = useState(reduce ? 2.4 : 0);

  useEffect(() => {
    if (reduce) return;
    const steps: [number, number][] = [
      [700, 1.1],
      [1600, 1.9],
      [2500, 2.4],
    ];
    const timers = steps.map(([ms, idx]) => setTimeout(() => setActiveIndex(idx), ms));
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#0b1c38]/80 to-[#060f1f]/85 px-4 py-5 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)] sm:px-7 sm:py-6">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-lc-blue" />
          <span className="text-sm font-semibold text-lc-text">Captain&apos;s Flight</span>
        </div>
        <span className="font-instrument text-[11px] uppercase tracking-[0.2em] text-lc-text3">
          ≈ 60 min · whole class
        </span>
      </div>
      <p className="mb-4 text-sm text-lc-text2">
        A complete lesson, start to finish — warm-up to wrap-up, sequenced for you and run live.
      </p>
      <LessonCaptainFlightPlan
        steps={CAPTAINS_FLIGHT_STEPS}
        height={300}
        mode="runtime"
        activeIndex={activeIndex}
        forceEmphasis
      />
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-8">
      {/* Hero-local horizon glow — anchors the product panel without restyling the global sky */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 64% 38% at 30% 20%, rgba(77,163,255,0.10) 0%, transparent 68%), radial-gradient(ellipse 80% 30% at 50% 92%, rgba(245,158,11,0.05) 0%, transparent 72%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Top: asymmetric two-column — copy leads, the start-widget sits beside it */}
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_minmax(0,460px)]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-5 text-center lg:text-left"
          >
            <span className="inline-flex items-center gap-1.5 self-center text-xs font-medium uppercase tracking-widest text-lc-blue lg:self-start">
              <span className="h-px w-4 bg-lc-blue" />
              Live Lesson Layer for Online ESL
            </span>
            <h1
              className="text-4xl font-bold leading-tight text-lc-text sm:text-5xl"
              style={{ textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
            >
              Run interactive ESL lessons while you screen share.
            </h1>
            <p className="max-w-xl self-center text-lg leading-relaxed text-lc-text2 lg:self-start">
              Screen-share the teacher view on Zoom, Meet, or Teams — students join from any
              browser to answer, play, vote, and speak live. Start from a video, an article, a
              topic, or a ready-made flight.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-lc-blue px-6 py-3 text-base font-semibold text-[#070B14] transition-colors hover:bg-lc-blue-hover"
                >
                  Start a Test Flight
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </motion.div>
              <Link
                href="/showcase"
                className="inline-flex items-center gap-1.5 text-base font-semibold text-lc-text2 transition-colors hover:text-lc-text"
              >
                Browse games and activities
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <StartWidget />
          </motion.div>
        </div>

        {/* Below the fold of the copy, but still above the page fold: the real product */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <FlightPlanPanel />
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlaneTakeoff, Play, ArrowRight } from 'lucide-react';
import { getFeaturedRoute } from '@/lib/discovery-shelves';
import { FEATURED_CHIPS } from '@/lib/video-lesson-demos';
import { MarketingRouteStrip } from './MarketingRouteStrip';

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

export function HeroSection() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const route = getFeaturedRoute();

  function buildFromUrl(target: string) {
    const trimmed = target.trim();
    if (!trimmed) return;
    const id = parseYouTubeId(trimmed);
    // Cached chips/known IDs use ?v= (shareable + free); arbitrary links use ?url=.
    router.push(id ? `/video-lesson?v=${id}` : `/video-lesson?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-8">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 50% 22%, rgba(77,163,255,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-7 text-center">
        {/* Headline block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex max-w-3xl flex-col items-center gap-5"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-lc-blue">
            <span className="h-px w-4 bg-lc-blue" />
            Live Lesson Layer for Online ESL
          </span>
          <h1
            className="text-4xl font-bold leading-tight text-lc-text sm:text-5xl"
            style={{ textShadow: '0 1px 24px rgba(0,0,0,0.65)' }}
          >
            Run interactive ESL lessons while you screen share.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-lc-text2">
            Paste a video and a full lesson builds itself. Screen-share the teacher view on
            Zoom, Meet, or Teams, and students join from any browser to answer, play, vote,
            and speak live.
          </p>
        </motion.div>

        {/* The magic moment: paste a video → a lesson */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="w-full max-w-xl"
        >
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
              className="min-w-0 flex-1 rounded-xl border border-lc-border bg-lc-surface px-4 py-3 text-sm text-lc-text placeholder-lc-text3 outline-none focus:border-lc-amber/60 focus:ring-1 focus:ring-lc-amber/40"
            />
            <button
              onClick={() => buildFromUrl(url)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-lc-amber px-5 py-3 text-sm font-bold text-[#1a0f00] transition-colors hover:bg-lc-amber/90"
            >
              <PlaneTakeoff className="h-4 w-4" aria-hidden />
              Build my lesson
            </button>
          </div>
          <p className="mt-2.5 text-xs text-lc-text3">Free · no sign-up · 60 seconds</p>

          {/* Featured thumbnails — one click hits cache and builds instantly */}
          <div className="mt-5">
            <p className="font-instrument mb-2.5 text-[11px] uppercase tracking-wider text-lc-text3">
              or try one of these
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {FEATURED_CHIPS.map((chip) => (
                <Link
                  key={chip.videoId}
                  href={`/video-lesson?v=${chip.videoId}`}
                  className="group relative overflow-hidden rounded-xl border border-cyan-300/15 bg-black/40 text-left transition-colors hover:border-cyan-300/45"
                >
                  <div className="relative aspect-video w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${chip.videoId}/mqdefault.jpg`}
                      alt={chip.title}
                      className="h-full w-full object-cover opacity-85 transition-opacity group-hover:opacity-100"
                    />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
                        <Play className="h-4 w-4 translate-x-px" aria-hidden />
                      </span>
                    </span>
                  </div>
                  <p className="line-clamp-2 px-2 py-1.5 text-[11px] font-medium leading-tight text-lc-text2 group-hover:text-lc-text">
                    {chip.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center gap-3 sm:flex-row"
        >
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
            className="inline-block rounded-lg border border-lc-border px-6 py-3 text-base font-semibold text-lc-text2 transition-colors hover:border-lc-blue hover:text-lc-text"
          >
            Browse games and activities
          </Link>
        </motion.div>
      </div>

      {/* The real flight path: Captain's Flight, plotted from the live preset */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.32 }}
        className="relative mx-auto mt-14 max-w-4xl"
      >
        <div className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#0b1c38]/80 to-[#060f1f]/85 px-5 py-6 shadow-[0_22px_44px_-20px_rgba(0,0,0,0.9)] sm:px-8 sm:py-7">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lc-blue" />
              <span className="text-sm font-semibold text-lc-text">Captain&apos;s Flight</span>
            </div>
            <span className="font-instrument text-[11px] uppercase tracking-[0.2em] text-lc-text3">
              ≈ 60 min · whole class
            </span>
          </div>
          <p className="mb-5 text-sm text-lc-text2">
            A complete lesson, start to finish — warm-up to wrap-up, sequenced for you.
          </p>
          <MarketingRouteStrip route={route} />
        </div>
      </motion.div>
    </section>
  );
}

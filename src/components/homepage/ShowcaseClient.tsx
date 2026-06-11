'use client';

// Public, logged-out browse destination (the marketing successor to /explore). Strictly
// presentational: every interactive element routes to /login or a public SEO page. NO
// planner, tier, or auth imports — shelves come straight from the registry-derived
// discovery data, which is pure/auth-free.

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Plane } from 'lucide-react';
import {
  buildShelves,
  getCardTone,
  getTypeLabel,
  getStudentAction,
  getFeaturedRoute,
  getFeaturedPreset,
  TONE_STYLES,
  type DiscoveryItem,
} from '@/lib/discovery-shelves';
import { MarketingRouteStrip } from './MarketingRouteStrip';

function ShowcaseCard({ item }: { item: DiscoveryItem }) {
  const tone = TONE_STYLES[getCardTone(item)];
  const Icon = item.icon;
  return (
    <Link
      href="/login"
      className="group/card relative flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-lc-border bg-lc-card/70 transition-all hover:-translate-y-0.5 hover:border-lc-border/80 sm:w-auto sm:shrink"
    >
      <span aria-hidden className={`block h-1 w-full ${tone.bar}`} />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between">
          <span className={`grid h-9 w-9 place-items-center rounded-lg border ${tone.iconBg}`}>
            <Icon className={`h-5 w-5 ${tone.iconText}`} />
          </span>
          <span className="font-instrument text-[10px] uppercase tracking-wide text-lc-text3">
            {getTypeLabel(item)}
            {item.isPro && <span className="ml-1.5 text-lc-amber">Pro</span>}
          </span>
        </div>
        <h4 className="text-sm font-bold leading-snug text-lc-text">{item.name}</h4>
        <p className="line-clamp-2 text-xs leading-relaxed text-lc-text3">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className={`text-[11px] font-medium ${tone.iconText}`}>
            {getStudentAction(item)}
          </span>
          <span className="font-instrument text-[10px] text-lc-text3">
            ~{item.estimatedMinutes} min
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ShowcaseClient() {
  const route = getFeaturedRoute();
  const preset = getFeaturedPreset();
  const shelves = buildShelves().slice(0, 4);

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* ── Read-only Captain's Flight hero ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#0b1c38]/85 to-[#060f1f]/90 p-6 sm:p-9"
        >
          <span className="font-instrument inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-cyan-300/90">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            Featured · All-Around Lesson
          </span>
          <h1 className="font-game mt-3 text-4xl leading-[0.9] text-lc-text sm:text-6xl">
            Captain&apos;s Flight
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-lc-text2">
            {preset?.description ??
              'A complete lesson, start to finish — every stage from warm-up to wrap-up, sequenced for you.'}
          </p>
          <div className="mt-7">
            <MarketingRouteStrip route={route} />
          </div>
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-lc-amber to-[#e08600] px-6 py-3 text-base font-bold text-[#1a0f00] shadow-[0_8px_24px_-6px_rgba(245,158,11,0.6)] transition-all hover:brightness-105"
            >
              <Plane className="h-5 w-5" aria-hidden />
              Start a Test Flight
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </motion.div>

        {/* ── Browse shelves ───────────────────────────────────────── */}
        <div className="mt-14 flex flex-col gap-12">
          {shelves.map((shelf, si) => (
            <motion.section
              key={shelf.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: si * 0.05 }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-lc-text">{shelf.label}</h2>
                <p className="text-sm text-lc-text3">{shelf.description}</p>
              </div>
              {/* Horizontal scroll on mobile, grid on desktop */}
              <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                {shelf.items.slice(0, 8).map((item) => (
                  <ShowcaseCard key={`${item.type}-${item.key}`} item={item} />
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* ── SEO hub links ────────────────────────────────────────── */}
        <div className="mt-16 border-t border-lc-border pt-8 text-center text-sm text-lc-text3">
          Browse by type:{' '}
          <Link href="/classroom-games" className="font-medium text-lc-blue hover:text-lc-blue-hover">
            Classroom Games
          </Link>{' '}
          ·{' '}
          <Link href="/classroom-activities" className="font-medium text-lc-blue hover:text-lc-blue-hover">
            Classroom Activities
          </Link>
        </div>
      </div>
    </div>
  );
}

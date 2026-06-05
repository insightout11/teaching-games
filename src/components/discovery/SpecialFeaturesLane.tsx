'use client';

// "Special Features" lane — the "make it easy / surprise me" intent. One-tap, zero-setup,
// pre-themed experiences (Cabin Mystery is the model). Deliberately a DIFFERENT card shape
// from the Full Flights boarding pass: vivid illustrated "feature tickets" that read as
// "just launch," not "plan a lesson."
//
// PROTOTYPE: sample content below — Cabin Mystery is a real (in-dev) module; the rest are
// placeholder concepts so the lane's look is visible. Wiring + real catalog comes later.

import { Sparkles, Luggage, Lightbulb, Rocket } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { CardRail } from './CardRail';

interface FeatureTicket {
  id: string;
  title: string;
  blurb: string;
  icon: ComponentType<{ className?: string }>;
  /** Explicit Tailwind gradient + accent so nothing gets purged. */
  gradient: string;
  ring: string;
  iconWrap: string;
  preview?: boolean;
}

// ── PROTOTYPE sample data ─────────────────────────────────────────────────────
const SAMPLE_FEATURES: FeatureTicket[] = [
  {
    id: 'cabin-mystery', title: 'Cabin Mystery', blurb: 'A self-contained whodunnit — deduction, clues, and a reveal. No prep.',
    icon: Luggage, gradient: 'from-violet-500/25 via-fuchsia-500/10 to-transparent',
    ring: 'border-violet-300/35 hover:border-violet-300/70', iconWrap: 'border-violet-300/30 bg-violet-400/15 text-violet-200',
  },
  {
    id: 'sample-think-fast', title: 'Think Fast', blurb: 'Rapid-fire challenge rounds on a surprise theme. Pure energy, zero setup.',
    icon: Lightbulb, gradient: 'from-amber-500/25 via-orange-500/10 to-transparent',
    ring: 'border-amber-300/35 hover:border-amber-300/70', iconWrap: 'border-amber-300/30 bg-amber-400/15 text-amber-200', preview: true,
  },
  {
    id: 'sample-launch-day', title: 'Launch Day', blurb: 'A pre-themed mission your class plays through — one tap and you’re flying.',
    icon: Rocket, gradient: 'from-cyan-500/25 via-sky-500/10 to-transparent',
    ring: 'border-cyan-300/35 hover:border-cyan-300/70', iconWrap: 'border-cyan-300/30 bg-cyan-400/15 text-cyan-200', preview: true,
  },
];
// ──────────────────────────────────────────────────────────────────────────────

export function SpecialFeaturesLane() {
  return (
    <section aria-label="Special Features">
      <div className="mb-5">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <span aria-hidden className="h-6 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.6)]" />
            <h2 className="text-2xl font-bold tracking-tight text-lc-text">Special Features</h2>
          </div>
          <div className="hud-rule hidden sm:block" aria-hidden />
        </div>
        <p className="mt-1.5 text-sm text-lc-text3">Pre-themed, one-tap experiences — nothing to set up, just launch.</p>
      </div>

      <CardRail itemWidthClass="w-[340px] sm:w-[440px]">
        {SAMPLE_FEATURES.map(({ id, title, blurb, icon: Icon, gradient, ring, iconWrap, preview }) => (
          <article
            key={id}
            className={cn(
              'group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-6 backdrop-blur-md transition-all hover:-translate-y-0.5',
              gradient,
              ring,
            )}
          >
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/[0.07] to-transparent" />

            <div className="flex items-start justify-between">
              <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl border', iconWrap)}>
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="font-instrument inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-lc-text2">
                <Sparkles className="h-3 w-3" aria-hidden />
                One tap · No setup
              </span>
            </div>

            <h3 className="mt-4 text-xl font-bold text-lc-text">{title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-lc-text2">{blurb}</p>

            <div className="mt-auto flex items-center justify-between pt-5">
              <span className="font-instrument text-[11px] uppercase tracking-[0.18em] text-lc-text2 transition-colors group-hover:text-lc-text">
                Launch →
              </span>
              {preview && (
                <span className="font-instrument rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-lc-text3">
                  Preview
                </span>
              )}
            </div>
          </article>
        ))}
      </CardRail>
    </section>
  );
}

'use client';

// "Special Features" lane — the "make it easy / surprise me" intent. Pre-themed,
// zero-setup experiences that launch through the standard detail drawer (same launch
// path as every other home module). Deliberately a DIFFERENT card shape from the Full
// Flights boarding pass: vivid illustrated "feature tickets" that read as "just launch."
//
// REAL only: Cabin Mystery (a self-contained whodunnit activity, flight-plan-only in
// browse but featured here) and World Lens (the geography game). Both resolve to live
// DiscoveryItems, so the card metadata can never drift from the module.

import { Sparkles, Luggage, Globe2 } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { CardRail } from './CardRail';
import { getDiscoveryItemByKey, type DiscoveryItem } from '@/lib/discovery-shelves';

interface FeaturePresentation {
  key: string;
  title: string;
  blurb: string;
  icon: ComponentType<{ className?: string }>;
  /** Explicit Tailwind gradient + accent so nothing gets purged. */
  gradient: string;
  ring: string;
  iconWrap: string;
}

const PRESENTATIONS: FeaturePresentation[] = [
  {
    key: 'cabin-mystery',
    title: 'Cabin Mystery',
    blurb: 'A self-contained whodunnit — deduction, clues, and a reveal. No prep.',
    icon: Luggage,
    gradient: 'from-violet-500/25 via-fuchsia-500/10 to-transparent',
    ring: 'border-violet-300/35 hover:border-violet-300/70',
    iconWrap: 'border-violet-300/30 bg-violet-400/15 text-violet-200',
  },
  {
    key: 'world-lens',
    title: 'World Lens',
    blurb: 'Guess real places from photo clues, then reveal them on a world map.',
    icon: Globe2,
    gradient: 'from-cyan-500/25 via-sky-500/10 to-transparent',
    ring: 'border-cyan-300/35 hover:border-cyan-300/70',
    iconWrap: 'border-cyan-300/30 bg-cyan-400/15 text-cyan-200',
  },
];

// Resolve each presentation to a live module; drop any that no longer exists.
const FEATURES = PRESENTATIONS.flatMap((p) => {
  const item = getDiscoveryItemByKey(p.key);
  return item ? [{ ...p, item }] : [];
});

export function SpecialFeaturesLane({ onSelect }: { onSelect: (item: DiscoveryItem) => void }) {
  if (FEATURES.length === 0) return null;

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
        {FEATURES.map(({ key, title, blurb, icon: Icon, gradient, ring, iconWrap, item }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              'group relative flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-6 text-left backdrop-blur-md transition-all hover:-translate-y-0.5',
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
              <span className="font-instrument text-[10px] uppercase tracking-wider text-lc-text3">
                ≈ {item.estimatedMinutes} min
              </span>
            </div>
          </button>
        ))}
      </CardRail>
    </section>
  );
}

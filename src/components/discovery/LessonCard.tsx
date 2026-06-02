'use client';

// Lesson-poster card for the Teacher Home shelves.
//
// CRITICAL: every decision metadatum is visible AT REST — hover does not exist on
// touch devices. Hover adds lift/glow polish only. Deliberately low-text: title,
// use case, time, class format, interaction glyphs, source. Built on the .panel-card
// avionics surface to stay on-brand with the cockpit theme.

import { Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type DiscoveryItem,
  getClassSizeChip,
  getSourceChip,
  getInteractionGlyphs,
} from '@/lib/discovery-shelves';

interface LessonCardProps {
  item: DiscoveryItem;
  onSelect: (item: DiscoveryItem) => void;
  /** Future personalization slot — flips class-size chip to "Best for your setup" when wired. */
  profile?: { setup?: 'one-on-one' | 'small-group' | 'classroom' | 'mixed' };
}

export function LessonCard({ item, onSelect, profile }: LessonCardProps) {
  const Icon = item.icon;
  const glyphs = getInteractionGlyphs(item);
  const classSize = getClassSizeChip(item, profile);
  const source = getSourceChip(item);

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={`${item.name} — ${item.useCase}, about ${item.estimatedMinutes} minutes, ${classSize}`}
      className={cn(
        'panel-card group/card relative flex h-full w-full flex-col gap-4 p-5 text-left',
        'transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1.5',
      )}
    >
      {/* Header: category icon + Pro flag */}
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05]">
          <Icon className={cn('h-6 w-6', item.accent)} />
        </span>
        {item.isPro && (
          <span className="font-instrument rounded-full border border-lc-amber/40 bg-lc-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-lc-amber">
            Pro
          </span>
        )}
      </div>

      {/* Title + use case */}
      <div className="min-w-0">
        <h3 className="text-lg font-semibold leading-tight text-lc-text">{item.name}</h3>
        <p className="font-instrument mt-1 text-[10px] uppercase tracking-[0.16em] text-lc-text3">
          {item.useCase}
        </p>
      </div>

      {/* Decision chips — always visible (no hover dependency) */}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
        <span className="font-instrument inline-flex items-center gap-1.5 text-xs text-lc-text2">
          <Clock className="h-3.5 w-3.5 text-cyan-300/60" aria-hidden />
          {item.estimatedMinutes} min
        </span>
        <span className="font-instrument inline-flex items-center gap-1.5 text-xs text-lc-text2">
          <Users className="h-3.5 w-3.5 text-cyan-300/60" aria-hidden />
          {classSize}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-cyan-300/10 pt-3">
        <div className="flex items-center gap-3">
          {glyphs.map(({ icon: Glyph, label }) => (
            <span key={label} className="inline-flex items-center text-lc-text3" title={label}>
              <Glyph className="h-[18px] w-[18px]" aria-hidden />
              <span className="sr-only">{label}</span>
            </span>
          ))}
        </div>
        <span className="font-instrument truncate text-[10px] uppercase tracking-wider text-cyan-300/70">
          {source}
        </span>
      </div>
    </button>
  );
}

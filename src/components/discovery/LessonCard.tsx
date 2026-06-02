'use client';

// Lesson-poster card for the Teacher Home shelves.
//
// CRITICAL: every decision metadatum is visible AT REST — hover does not exist on
// touch devices. Hover adds lift/glow polish only, never information. Built on the
// existing .panel-card avionics surface so it stays on-brand with the cockpit theme.

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
        'panel-card group/card relative flex h-full w-full flex-col gap-3 p-4 text-left',
        'transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1',
      )}
    >
      {/* Header: category icon + Pro flag */}
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-lc-border bg-lc-bg/60">
          <Icon className={cn('h-[18px] w-[18px]', item.accent)} />
        </span>
        {item.isPro && (
          <span className="font-instrument rounded-full border border-lc-amber/40 bg-lc-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-lc-amber">
            Pro
          </span>
        )}
      </div>

      {/* Title + use case */}
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-semibold leading-tight text-lc-text">{item.name}</h3>
        <p className="font-instrument mt-0.5 text-[10px] uppercase tracking-wider text-lc-text3">
          {item.useCase}
        </p>
      </div>

      <p className="line-clamp-2 text-[13px] leading-snug text-lc-text2">{item.description}</p>

      {/* Decision chips — always visible (no hover dependency) */}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
        <span className="font-instrument inline-flex items-center gap-1 text-[11px] text-lc-text3">
          <Clock className="h-3 w-3" aria-hidden />
          {item.estimatedMinutes} min
        </span>
        <span className="font-instrument inline-flex items-center gap-1 text-[11px] text-lc-text3">
          <Users className="h-3 w-3" aria-hidden />
          {classSize}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-lc-border-subtle pt-2.5">
        {/* Interaction glyphs */}
        <div className="flex items-center gap-2.5">
          {glyphs.map(({ icon: Glyph, label }) => (
            <span key={label} className="inline-flex items-center gap-1 text-lc-text3" title={label}>
              <Glyph className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">{label}</span>
            </span>
          ))}
        </div>
        <span className="font-instrument truncate text-[10px] uppercase tracking-wider text-cyan-400/70">
          {source}
        </span>
      </div>
    </button>
  );
}

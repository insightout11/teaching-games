'use client';

// Lesson-poster card for the Teacher Home shelves.
//
// CRITICAL: every decision metadatum is visible AT REST — hover does not exist on
// touch devices. Hover adds lift/glow polish only. Each card carries a per-use-case
// "tone" (speaking/game/source/vocab/debate/grammar) so the shelves read as distinct
// families, plus an energy meter and a prominent interaction-glyph cluster so the
// card feels rich rather than an empty dark box. Built on .panel-card.

import { Clock, Users, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type DiscoveryItem,
  getClassSizeChip,
  getSourceChip,
  getInteractionGlyphs,
  getCardTone,
  getEnergyLevel,
  TONE_STYLES,
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
  const tone = TONE_STYLES[getCardTone(item)];
  const energy = getEnergyLevel(item);

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={`${item.name} — ${item.useCase}, about ${item.estimatedMinutes} minutes, ${classSize}`}
      className={cn(
        'panel-card group/card relative flex h-full w-full flex-col gap-4 overflow-hidden p-5 pt-6 text-left',
        'transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1.5',
        tone.glow,
      )}
    >
      {/* Top accent bar — per-use-case identity */}
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', tone.bar)} />

      {/* Header: tone icon + Pro flag */}
      <div className="flex items-start justify-between gap-2">
        <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl border', tone.iconBg)}>
          <Icon className={cn('h-6 w-6', tone.iconText)} />
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
          <Clock className="h-3.5 w-3.5 text-lc-text3" aria-hidden />
          {item.estimatedMinutes} min
        </span>
        <span className="font-instrument inline-flex items-center gap-1.5 text-xs text-lc-text2">
          <Users className="h-3.5 w-3.5 text-lc-text3" aria-hidden />
          {classSize}
        </span>
        {/* Energy meter */}
        <span className="font-instrument inline-flex items-center gap-1.5 text-xs text-lc-text2" title={`Energy: ${energy} of 3`}>
          <Activity className="h-3.5 w-3.5 text-lc-text3" aria-hidden />
          <span className="flex items-end gap-0.5" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cn('w-1 rounded-sm', n <= energy ? tone.fill : 'bg-white/10')}
                style={{ height: `${4 + n * 2}px` }}
              />
            ))}
          </span>
          <span className="sr-only">Energy {energy} of 3</span>
        </span>
      </div>

      {/* Interaction glyph cluster + source */}
      <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-2.5">
          {glyphs.map(({ icon: Glyph, label }) => (
            <span
              key={label}
              className={cn('inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]', tone.glyph)}
              title={label}
            >
              <Glyph className="h-4 w-4" aria-hidden />
              <span className="sr-only">{label}</span>
            </span>
          ))}
        </div>
        <span className="font-instrument truncate text-[10px] uppercase tracking-wider text-lc-text3">
          {source}
        </span>
      </div>
    </button>
  );
}

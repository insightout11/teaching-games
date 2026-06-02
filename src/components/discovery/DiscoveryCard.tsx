'use client';

// Discovery "activity pass" for the Teacher Home shelves. Renders ACTIVITIES and
// GAMES — clicking opens a detail drawer; it never silently commits.
//
// Design: ticket-like stub (perforated tear + side notches) so passes feel physical;
// category color appears only as a small STAMP (icon + type pill + cue icon), keeping
// the palette mostly cyan/amber. The body shows a decision-helpful "what students do"
// line rather than a decorative motif. All metadata is visible at rest (no hover dep).

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type DiscoveryItem,
  type CardFamily,
  getClassSizeChip,
  getSourceChip,
  getInteractionGlyphs,
  getStudentAction,
  getCardFamily,
  getCardTone,
  getTypeLabel,
  TONE_STYLES,
} from '@/lib/discovery-shelves';

interface DiscoveryCardProps {
  item: DiscoveryItem;
  onSelect: (item: DiscoveryItem) => void;
  /** Future personalization slot — flips class-size chip to "Best for your setup" when wired. */
  profile?: { setup?: 'one-on-one' | 'small-group' | 'classroom' | 'mixed' };
}

const MODE_LABEL: Record<CardFamily, string> = {
  speaking: 'Speaking',
  debate: 'Debate',
  game: 'Game',
  vocab: 'Vocabulary',
  grammar: 'Grammar',
  source: 'Source-based',
};

export function DiscoveryCard({ item, onSelect, profile }: DiscoveryCardProps) {
  const Icon = item.icon;
  const family = getCardFamily(item);
  const tone = TONE_STYLES[getCardTone(item)];
  const typeLabel = getTypeLabel(item);
  const glyphs = getInteractionGlyphs(item);
  const ActionIcon = glyphs[0]?.icon ?? Icon;
  const action = getStudentAction(item);
  const classSize = getClassSizeChip(item, profile);
  const source = getSourceChip(item);
  const mode = family === 'source' ? (glyphs[0]?.label ?? 'Source') : MODE_LABEL[family];

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={`${item.name} — ${typeLabel}, ${item.useCase}, about ${item.estimatedMinutes} minutes. Opens details.`}
      className={cn(
        'panel-card group/card relative flex h-full w-full flex-col overflow-hidden p-5 text-left',
        'transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1.5',
        tone.glow,
      )}
    >
      {/* Header: family icon STAMP + type / Pro tags */}
      <div className="flex items-start justify-between gap-2">
        <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl border', tone.iconBg)}>
          <Icon className={cn('h-6 w-6', tone.iconText)} />
        </span>
        <div className="flex items-center gap-1.5">
          {item.isPro && (
            <span className="font-instrument rounded-md border border-lc-amber/40 bg-lc-amber/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-lc-amber">
              Pro
            </span>
          )}
          <span className={cn('font-instrument rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]', tone.iconBg, tone.iconText)}>
            {typeLabel}
          </span>
        </div>
      </div>

      {/* Title + use case */}
      <div className="mt-4 min-w-0">
        <h3 className="text-[1.35rem] font-semibold leading-tight text-lc-text">{item.name}</h3>
        <p className="font-instrument mt-1 text-[10px] uppercase tracking-[0.16em] text-lc-text3">
          {item.useCase}
        </p>
      </div>

      {/* What students do — decision-helpful, not decorative */}
      <div className="my-4 flex flex-1 items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', tone.iconBg, tone.iconText)}>
          <ActionIcon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <span className="text-[13px] font-medium leading-snug text-lc-text2">{action}</span>
      </div>

      {/* Ticket stub: perforated tear + side notches + chips + open affordance */}
      <div className="relative -mx-5 -mb-5 border-t border-dashed border-white/15 bg-white/[0.02] px-5 pb-5 pt-4">
        <span aria-hidden className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-[#070B14]" />
        <span aria-hidden className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-[#070B14]" />
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Chip>{item.estimatedMinutes} min</Chip>
            <Chip>{classSize}</Chip>
            <Chip accentClass={tone.iconText}>{mode}</Chip>
            <Chip>{source}</Chip>
          </div>
          <span
            aria-hidden
            className="font-instrument flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-wider text-cyan-300/60 transition-colors group-hover/card:text-cyan-200"
          >
            Open
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/card:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

function Chip({ children, accentClass }: { children: React.ReactNode; accentClass?: string }) {
  return (
    <span
      className={cn(
        'rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[12px] font-medium text-lc-text2',
        accentClass,
      )}
    >
      {children}
    </span>
  );
}

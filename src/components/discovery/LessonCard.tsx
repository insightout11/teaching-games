'use client';

// Lesson-poster card for the Teacher Home shelves.
//
// CRITICAL: every decision metadatum is visible AT REST — hover does not exist on
// touch devices. Each card belongs to a FAMILY (speaking/debate/game/vocab/grammar/
// source) that drives its tone + a central motif, so the shelves read as distinct
// families rather than repeated dark boxes. Metadata is reduced to four clear chips.

import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import {
  type DiscoveryItem,
  type CardFamily,
  getClassSizeChip,
  getSourceChip,
  getInteractionGlyphs,
  getCardFamily,
  getCardTone,
  TONE_STYLES,
} from '@/lib/discovery-shelves';

interface LessonCardProps {
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

export function LessonCard({ item, onSelect, profile }: LessonCardProps) {
  const Icon = item.icon;
  const family = getCardFamily(item);
  const tone = TONE_STYLES[getCardTone(item)];
  const glyphs = getInteractionGlyphs(item);
  const classSize = getClassSizeChip(item, profile);
  const source = getSourceChip(item);
  const mode = family === 'source' ? (glyphs[0]?.label ?? 'Source') : MODE_LABEL[family];

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={`${item.name} — ${item.useCase}, about ${item.estimatedMinutes} minutes, ${classSize}, ${mode}`}
      className={cn(
        'panel-card group/card relative flex h-full w-full flex-col overflow-hidden p-5 pt-6 text-left',
        'transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1.5',
        tone.glow,
      )}
    >
      {/* Top accent bar — family identity */}
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', tone.bar)} />

      {/* Header: family icon + Pro flag */}
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
      <div className="mt-4 min-w-0">
        <h3 className="text-[1.35rem] font-semibold leading-tight text-lc-text">{item.name}</h3>
        <p className="font-instrument mt-1 text-[10px] uppercase tracking-[0.16em] text-lc-text3">
          {item.useCase}
        </p>
      </div>

      {/* Central motif — fills the body with family character */}
      <div className={cn('my-5 flex flex-1 items-center', tone.iconText)}>
        <CardMotif family={family} />
      </div>

      {/* Four clear chips for fast decisions */}
      <div className="flex flex-wrap gap-1.5">
        <Chip>{item.estimatedMinutes} min</Chip>
        <Chip>{classSize}</Chip>
        <Chip accentClass={tone.iconText}>{mode}</Chip>
        <Chip>{source}</Chip>
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

// ── Family motifs ─────────────────────────────────────────────────────────────
// Tone color comes from the parent (currentColor). Kept low-key but characterful.
function CardMotif({ family }: { family: CardFamily }) {
  const M = MOTIFS[family];
  return <M />;
}

const SpeakingMotif: ComponentType = () => (
  <svg viewBox="0 0 140 54" className="h-14 w-full" aria-hidden preserveAspectRatio="xMinYMid meet">
    <rect x="2" y="4" width="78" height="36" rx="11" fill="currentColor" opacity="0.14" />
    <path d="M22 40 L20 50 L32 40 Z" fill="currentColor" opacity="0.14" />
    <line x1="16" y1="16" x2="64" y2="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
    <line x1="16" y1="26" x2="50" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
    <rect x="64" y="20" width="74" height="30" rx="10" fill="currentColor" opacity="0.26" />
    <path d="M118 50 L120 60 L106 50 Z" fill="currentColor" opacity="0.26" />
    <line x1="78" y1="31" x2="124" y2="31" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    <line x1="78" y1="40" x2="110" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
  </svg>
);

const DebateMotif: ComponentType = () => (
  <svg viewBox="0 0 140 54" className="h-14 w-full" aria-hidden preserveAspectRatio="xMidYMid meet">
    <rect x="2" y="6" width="62" height="32" rx="10" fill="currentColor" opacity="0.24" />
    <path d="M18 38 L15 48 L28 38 Z" fill="currentColor" opacity="0.24" />
    <line x1="12" y1="16" x2="52" y2="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    <line x1="12" y1="26" x2="40" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    <rect x="76" y="14" width="62" height="32" rx="10" fill="currentColor" opacity="0.14" />
    <path d="M122 46 L125 56 L112 46 Z" fill="currentColor" opacity="0.14" />
    <line x1="88" y1="24" x2="128" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
    <line x1="88" y1="34" x2="116" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
  </svg>
);

const GameMotif: ComponentType = () => (
  <svg viewBox="0 0 140 54" className="h-14 w-full" aria-hidden preserveAspectRatio="xMinYMax meet">
    {[0, 1, 2, 3, 4].map((i) => {
      const h = [20, 34, 26, 46, 30][i];
      return <rect key={i} x={6 + i * 18} y={50 - h} width="11" height={h} rx="2.5" fill="currentColor" opacity={0.2 + i * 0.07} />;
    })}
    <path
      d="M112 8 l3.2 6.6 7.2 1 -5.2 5.1 1.2 7.2 -6.4 -3.4 -6.4 3.4 1.2 -7.2 -5.2 -5.1 7.2 -1 Z"
      fill="currentColor"
      opacity="0.5"
    />
  </svg>
);

const VocabMotif: ComponentType = () => (
  <svg viewBox="0 0 140 54" className="h-14 w-full" aria-hidden preserveAspectRatio="xMinYMid meet">
    {[
      { x: 2, y: 6, w: 52 },
      { x: 60, y: 6, w: 40 },
      { x: 20, y: 30, w: 46 },
      { x: 72, y: 30, w: 60 },
    ].map((t, i) => (
      <g key={i}>
        <rect x={t.x} y={t.y} width={t.w} height="18" rx="9" fill="currentColor" opacity={0.12 + (i % 2) * 0.12} />
        <line x1={t.x + 10} y1={t.y + 9} x2={t.x + t.w - 10} y2={t.y + 9} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      </g>
    ))}
  </svg>
);

const GrammarMotif: ComponentType = () => (
  <svg viewBox="0 0 140 54" className="h-14 w-full" aria-hidden preserveAspectRatio="xMinYMid meet">
    <line x1="4" y1="18" x2="120" y2="18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    <line x1="4" y1="32" x2="92" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.28" />
    {/* proofreading caret + check */}
    <path d="M60 18 l6 9 l-12 0 Z" fill="currentColor" opacity="0.45" />
    <path d="M104 40 l6 7 l13 -16" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
  </svg>
);

const SourceMotif: ComponentType = () => (
  <svg viewBox="0 0 140 54" className="h-14 w-full" aria-hidden preserveAspectRatio="xMidYMid meet">
    <rect x="40" y="6" width="60" height="42" rx="7" fill="currentColor" opacity="0.14" />
    <rect x="40" y="6" width="60" height="42" rx="7" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
    <path d="M64 18 L64 36 L82 27 Z" fill="currentColor" opacity="0.7" />
    <line x1="10" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
    <line x1="10" y1="27" x2="28" y2="27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.22" />
    <line x1="110" y1="22" x2="130" y2="22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
    <line x1="110" y1="33" x2="126" y2="33" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.22" />
  </svg>
);

const MOTIFS: Record<CardFamily, ComponentType> = {
  speaking: SpeakingMotif,
  debate: DebateMotif,
  game: GameMotif,
  vocab: VocabMotif,
  grammar: GrammarMotif,
  source: SourceMotif,
};

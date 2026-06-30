// Ready to Teach — the fully pre-built, zero-prep lessons. Each entry pairs a REAL
// library source (video or article, by its extract id) with a real launchable preset
// and a pre-chosen topic. "Launch — no prep" attaches the source, loads the preset, and
// drops the teacher straight into the class picker. All sources are in-library and
// transcript/summary-backed; the World Cup card is the timely one and swaps in/out as
// events change. No placeholders.

import type { SourceType } from '@/types/source-material';
import type { Difficulty } from '@/lib/difficulty';

export type ReadySourceKind = 'video' | 'article';

export interface ReadyLesson {
  id: string;
  /** Occasion chip — "Trending", topic area, etc. */
  occasion: string;
  /** Card headline. */
  title: string;
  /** Source extract type + id (payload for /api/source/extract). */
  sourceType: SourceType;
  sourceId: string;
  sourceKind: ReadySourceKind;
  /** Human label for the pre-chosen source ("we already picked this"). */
  sourceTitle: string;
  /** Live preset id from FLIGHT_PLAN_PRESETS. */
  presetId: string;
  /** Pre-chosen topic written into the launch. */
  topic: string;
  difficulty: Difficulty;
  durationMinutes: number;
  /** Explicit Tailwind classes (kept literal so nothing is purged). */
  gradient: string;
  ring: string;
  tagColor: string;
}

export const READY_LESSONS: ReadyLesson[] = [
  {
    id: 'ready-world-cup',
    occasion: 'Trending',
    title: 'The 2026 World Cup, Explained',
    sourceType: 'sports',
    sourceId: 'world-cup-2026-format',
    sourceKind: 'video',
    sourceTitle: 'The 2026 World Cup Format Explained',
    presetId: 'all-around-flight-60',
    topic: 'The 2026 World Cup',
    difficulty: 'Intermediate',
    durationMinutes: 60,
    gradient: 'from-emerald-500/25 via-teal-500/10 to-transparent',
    ring: 'border-emerald-300/35 hover:border-emerald-300/70',
    tagColor: 'text-emerald-200 border-emerald-300/30 bg-emerald-400/10',
  },
  {
    id: 'ready-sugar',
    occasion: 'Health',
    title: 'Why We Can’t Stop Eating Sugar',
    sourceType: 'teded',
    sourceId: 'teded_how_sugar_affects_brain',
    sourceKind: 'video',
    sourceTitle: 'TED-Ed — How sugar affects the brain',
    presetId: 'all-around-flight-60',
    topic: 'Sugar, cravings, and health',
    difficulty: 'Intermediate',
    durationMinutes: 60,
    gradient: 'from-rose-500/25 via-pink-500/10 to-transparent',
    ring: 'border-rose-300/35 hover:border-rose-300/70',
    tagColor: 'text-rose-200 border-rose-300/30 bg-rose-400/10',
  },
  {
    id: 'ready-social-media',
    occasion: 'Society',
    title: 'Is Social Media Hurting Us?',
    sourceType: 'voa',
    sourceId: 'voa-social-media-mental-health',
    sourceKind: 'article',
    sourceTitle: 'VOA — Social Media and Mental Health',
    presetId: 'debate-60',
    topic: 'Social media and mental health',
    difficulty: 'Intermediate',
    durationMinutes: 60,
    gradient: 'from-violet-500/25 via-fuchsia-500/10 to-transparent',
    ring: 'border-violet-300/35 hover:border-violet-300/70',
    tagColor: 'text-violet-200 border-violet-300/30 bg-violet-400/10',
  },
  {
    id: 'ready-commons',
    occasion: 'Environment',
    title: 'Who Owns the Planet’s Resources?',
    sourceType: 'teded',
    sourceId: 'teded_tragedy_of_the_commons',
    sourceKind: 'video',
    sourceTitle: 'TED-Ed — The tragedy of the commons',
    presetId: 'debate-60',
    topic: 'Sharing the planet’s resources',
    difficulty: 'Intermediate',
    durationMinutes: 60,
    gradient: 'from-cyan-500/25 via-sky-500/10 to-transparent',
    ring: 'border-cyan-300/35 hover:border-cyan-300/70',
    tagColor: 'text-cyan-200 border-cyan-300/30 bg-cyan-400/10',
  },
  {
    id: 'ready-ai',
    occasion: 'Technology',
    title: 'Will AI Run Your Daily Life?',
    sourceType: 'voa',
    sourceId: 'voa-artificial-intelligence-daily-life',
    sourceKind: 'article',
    sourceTitle: 'VOA — Artificial Intelligence in Everyday Life',
    presetId: 'all-around-flight-60',
    topic: 'AI in everyday life',
    difficulty: 'Advanced',
    durationMinutes: 60,
    gradient: 'from-amber-500/25 via-orange-500/10 to-transparent',
    ring: 'border-amber-300/35 hover:border-amber-300/70',
    tagColor: 'text-amber-200 border-amber-300/30 bg-amber-400/10',
  },
  {
    id: 'ready-grit',
    occasion: 'Mindset',
    title: 'Can You Actually Get Smarter?',
    sourceType: 'ted',
    sourceId: 'angela_duckworth_grit',
    sourceKind: 'video',
    sourceTitle: 'TED — Grit, by Angela Duckworth',
    presetId: 'all-around-flight-60',
    topic: 'Grit, effort, and success',
    difficulty: 'Easy',
    durationMinutes: 60,
    gradient: 'from-sky-500/25 via-blue-500/10 to-transparent',
    ring: 'border-sky-300/35 hover:border-sky-300/70',
    tagColor: 'text-sky-200 border-sky-300/30 bg-sky-400/10',
  },
];

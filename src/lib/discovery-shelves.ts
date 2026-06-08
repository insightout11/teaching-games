// Teacher Home discovery layer — derives "teacher-job" shelves and lesson-poster
// card metadata from the existing module registries + flight-plan-config.
//
// Personalization slot: getClassSizeChip() takes an optional teacher profile and
// exact student count so audited ideals and hard minimums can drive the verdict.

import type { ComponentType } from 'react';
import { Mic, PenLine, Gamepad2, Vote, Users, Scale } from 'lucide-react';
import { getAllGames, GAME_CATEGORY_INFO } from '@/games/registry';
import { getAllActivities, CATEGORY_INFO } from '@/activities/registry';
import {
  FLIGHT_PLAN_ITEMS,
  getClassSizeMetadata,
  type AuditedClassSize,
  type ClassSizeMetadata,
  type FlightPlanItem,
} from '@/lib/flight-plan-config';
import { FLIGHT_PLAN_PRESETS, type FlightPlanPreset, type FlightPhase, type FlightStageKind } from '@/lib/flight-plan-presets';
import { PRO_ACTIVITY_KEYS, PRO_GAME_KEYS } from '@/lib/standard-topics';

export interface DiscoveryItem {
  key: string;
  name: string;
  description: string;
  type: 'game' | 'activity';
  /** Human-facing "use case" label (category display name) — never the internal PPP stage. */
  useCase: string;
  icon: ComponentType<{ className?: string }>;
  /** Tailwind text-color class for the category accent (e.g. "text-cyan-400"). */
  accent: string;
  estimatedMinutes: number;
  skills: string[];
  isPro: boolean;
  meta?: FlightPlanItem;
  classSize: ClassSizeMetadata;
}

export interface GlyphChip {
  icon: ComponentType<{ className?: string }>;
  label: string;
}

const META_BY_KEY = new Map(FLIGHT_PLAN_ITEMS.map((i) => [i.key, i]));

/** All launchable games + activities (excludes flight-plan-only modules), normalized for cards. */
export function getDiscoveryItems(): DiscoveryItem[] {
  const games: DiscoveryItem[] = getAllGames()
    .filter((g) => !g.flightPlanOnly)
    .map((g) => ({
      key: g.key,
      name: g.name,
      description: g.description,
      type: 'game' as const,
      useCase: GAME_CATEGORY_INFO[g.category].name,
      icon: g.icon,
      accent: GAME_CATEGORY_INFO[g.category].color,
      estimatedMinutes: g.estimatedMinutes,
      skills: g.skills,
      isPro: PRO_GAME_KEYS.has(g.key),
      meta: META_BY_KEY.get(g.key),
      classSize: requireClassSizeMetadata(g.key),
    }));

  const activities: DiscoveryItem[] = getAllActivities()
    .filter((a) => !a.flightPlanOnly)
    .map((a) => ({
      key: a.key,
      name: a.name,
      description: a.description,
      type: 'activity' as const,
      useCase: CATEGORY_INFO[a.category].name,
      icon: a.icon,
      accent: CATEGORY_INFO[a.category].color,
      estimatedMinutes: a.estimatedMinutes,
      skills: a.skills as string[],
      isPro: PRO_ACTIVITY_KEYS.has(a.key),
      meta: META_BY_KEY.get(a.key),
      classSize: requireClassSizeMetadata(a.key),
    }));

  return [...activities, ...games];
}

function requireClassSizeMetadata(key: string): ClassSizeMetadata {
  const metadata = getClassSizeMetadata(key);
  if (!metadata) throw new Error(`Missing class-size metadata for discovery module: ${key}`);
  return metadata;
}

// ─── Card chip derivation ────────────────────────────────────────────────────

/**
 * Ideal-class-size chip from the code-grounded per-module audit. Exact minimum gating
 * is applied when a student count is available. Bucket-only profiles stay conservative
 * when the bucket could include a class below the module minimum.
 */
export function getClassSizeChip(
  item: DiscoveryItem,
  profile?: {
    setup?: 'one-on-one' | 'small-group' | 'classroom' | 'mixed';
    studentCount?: number;
  },
): string {
  const { idealClassSizes, minStudents } = item.classSize;
  const setup = profile?.setup;
  const exactCount = profile?.studentCount;

  if (exactCount != null && exactCount < minStudents) {
    return `Needs ${minStudents}+ students`;
  }

  if (
    setup &&
    setup !== 'mixed' &&
    idealClassSizes.includes(setup) &&
    setupDefinitelyMeetsMinimum(setup, minStudents, exactCount)
  ) {
    return setup === 'one-on-one' ? 'Great for 1-on-1'
      : setup === 'small-group' ? 'Great for small groups'
      : 'Great for your class';
  }

  if (minStudents > 1) return `Best with ${minStudents}+`;
  return genericIdealClassSizeLabel(idealClassSizes);
}

function setupDefinitelyMeetsMinimum(
  setup: AuditedClassSize,
  minStudents: number,
  exactCount?: number,
): boolean {
  if (exactCount != null) return exactCount >= minStudents;
  if (setup === 'one-on-one') return minStudents <= 1;
  if (setup === 'small-group') return minStudents <= 2;
  return minStudents <= 7;
}

function genericIdealClassSizeLabel(idealClassSizes: readonly AuditedClassSize[]): string {
  if (idealClassSizes.length === 3) return 'Any class size';
  if (idealClassSizes.length === 1) {
    if (idealClassSizes[0] === 'one-on-one') return 'Best for 1-on-1';
    if (idealClassSizes[0] === 'small-group') return 'Best for small groups';
    return 'Best for classrooms';
  }
  if (idealClassSizes.includes('one-on-one') && idealClassSizes.includes('small-group')) {
    return 'Best for 1-on-1 & small groups';
  }
  if (idealClassSizes.includes('small-group') && idealClassSizes.includes('classroom')) {
    return 'Best for groups & classes';
  }
  return 'Best for 1-on-1 & classrooms';
}

/** Source-requirement chip. Source-agnostic modules read "Use with any topic" (per brand). */
export function getSourceChip(item: DiscoveryItem): string {
  if (item.meta?.requiresSource === 'video') return 'Needs a video';
  if (item.meta?.requiresSource === 'text') return 'Needs a reading';
  return 'Use with any topic';
}

/** Up to three interaction glyphs (speak / write / play / vote / discuss) — Lucide, never emoji. */
export function getInteractionGlyphs(item: DiscoveryItem): GlyphChip[] {
  const models = item.meta?.interactionModel ?? [];
  const glyphs: GlyphChip[] = [];
  const push = (icon: ComponentType<{ className?: string }>, label: string) => {
    if (glyphs.length < 3 && !glyphs.some((g) => g.label === label)) glyphs.push({ icon, label });
  };

  if (item.meta?.speakingLoad === 'high' || models.includes('discussion') || models.includes('performance')) {
    push(Mic, 'Speaking');
  }
  if (item.meta?.writingLoad === 'high' || models.includes('submission')) {
    push(PenLine, 'Writing');
  }
  if (models.includes('team-based') || models.includes('role-based')) {
    push(Users, 'Teams');
  }
  if (models.includes('voting')) {
    push(Vote, 'Voting');
  }
  if (item.type === 'game') {
    push(Gamepad2, 'Game');
  }
  if (item.useCase === 'Debates') {
    push(Scale, 'Debate');
  }
  // Guarantee at least one glyph so the card never looks unfinished.
  if (glyphs.length === 0) push(Mic, 'Speaking');
  return glyphs;
}

// ─── Per-use-case card identity ───────────────────────────────────────────────
// Each card gets a "tone" so speaking / games / source / vocab / debate / grammar
// read as distinct families rather than repeated dark boxes. Class strings are
// literal so Tailwind's JIT picks them up.

export type CardTone = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky';

/** Card family drives tone + the in-card motif, so each use case reads distinctly. */
export type CardFamily = 'speaking' | 'debate' | 'game' | 'vocab' | 'grammar' | 'source';

const SPEAKING_SKILLS = ['Speaking', 'Fluency', 'Pragmatics', 'Persuasion', 'Role-play', 'Question Formation'];

export function getCardFamily(item: DiscoveryItem): CardFamily {
  if (item.meta?.requiresSource || item.useCase === 'Learning Modules') return 'source';
  if (item.type === 'game') return 'game';
  const goals = item.meta?.goalFit ?? [];
  if (item.useCase === 'Debates' || goals.includes('discussion-debate')) return 'debate';
  if (item.useCase === 'Vocabulary' || goals.includes('vocabulary-building')) return 'vocab';
  if (item.useCase === 'Grammar & Writing' || goals.includes('grammar-reinforcement')) return 'grammar';
  return 'speaking';
}

// Tightened, controlled aviation palette: cyan is the core/default (speaking +
// grammar), amber = source/boarding, emerald = vocab/growth; violet & rose are used
// sparingly for games & debate accents only.
const FAMILY_TONE: Record<CardFamily, CardTone> = {
  speaking: 'cyan',
  debate: 'rose',
  game: 'violet',
  vocab: 'emerald',
  grammar: 'cyan',
  source: 'amber',
};

export function getCardTone(item: DiscoveryItem): CardTone {
  return FAMILY_TONE[getCardFamily(item)];
}

/** Human label for what a card IS — so an activity never gets mistaken for a lesson. */
export function getTypeLabel(item: DiscoveryItem): string {
  if (item.type === 'game') return 'Game';
  if (getCardFamily(item) === 'source') return 'Source activity';
  return 'Activity';
}

/** Short, decision-helpful "what students actually do" line for the card body. */
export function getStudentAction(item: DiscoveryItem): string {
  const m = item.meta?.interactionModel ?? [];
  const family = getCardFamily(item);
  if (family === 'source') return 'Runs on your video or reading';
  if (m.includes('voting')) return 'Students vote from their phones';
  if (m.includes('team-based') || m.includes('role-based')) return 'Teams compete in rounds';
  if (m.includes('submission')) return 'Students type their answers';
  if (family === 'debate') return 'Students take sides and argue';
  if (item.type === 'game') return 'Fast, competitive rounds';
  if (m.includes('discussion') || m.includes('performance') || family === 'speaking') {
    return 'Students speak and react out loud';
  }
  return 'Whole-class participation';
}

export interface ToneStyle {
  bar: string;
  iconBg: string;
  iconText: string;
  glyph: string;
  fill: string;
  glow: string;
}

export const TONE_STYLES: Record<CardTone, ToneStyle> = {
  cyan: {
    bar: 'bg-cyan-400', iconBg: 'border-cyan-300/25 bg-cyan-400/10', iconText: 'text-cyan-300',
    glyph: 'text-cyan-300/80', fill: 'bg-cyan-400', glow: 'group-hover/card:shadow-[0_0_30px_-8px_rgba(34,211,238,0.5)]',
  },
  violet: {
    bar: 'bg-violet-400', iconBg: 'border-violet-300/25 bg-violet-400/10', iconText: 'text-violet-300',
    glyph: 'text-violet-300/80', fill: 'bg-violet-400', glow: 'group-hover/card:shadow-[0_0_30px_-8px_rgba(167,139,250,0.5)]',
  },
  emerald: {
    bar: 'bg-emerald-400', iconBg: 'border-emerald-300/25 bg-emerald-400/10', iconText: 'text-emerald-300',
    glyph: 'text-emerald-300/80', fill: 'bg-emerald-400', glow: 'group-hover/card:shadow-[0_0_30px_-8px_rgba(52,211,153,0.5)]',
  },
  amber: {
    bar: 'bg-amber-400', iconBg: 'border-amber-300/25 bg-amber-400/10', iconText: 'text-amber-300',
    glyph: 'text-amber-300/80', fill: 'bg-amber-400', glow: 'group-hover/card:shadow-[0_0_30px_-8px_rgba(245,158,11,0.5)]',
  },
  rose: {
    bar: 'bg-rose-400', iconBg: 'border-rose-300/25 bg-rose-400/10', iconText: 'text-rose-300',
    glyph: 'text-rose-300/80', fill: 'bg-rose-400', glow: 'group-hover/card:shadow-[0_0_30px_-8px_rgba(251,113,133,0.5)]',
  },
  sky: {
    bar: 'bg-sky-400', iconBg: 'border-sky-300/25 bg-sky-400/10', iconText: 'text-sky-300',
    glyph: 'text-sky-300/80', fill: 'bg-sky-400', glow: 'group-hover/card:shadow-[0_0_30px_-8px_rgba(56,189,248,0.5)]',
  },
};

/** Energy level (1–3) for the card's little energy meter. */
export function getEnergyLevel(item: DiscoveryItem): number {
  const e = item.meta?.energy;
  if (e === 'high') return 3;
  if (e === 'low') return 1;
  return 2;
}

// ─── Shelves (teacher jobs, not internal categories) ──────────────────────────

export interface ShelfDefinition {
  id: string;
  label: string;
  description: string;
  predicate: (item: DiscoveryItem) => boolean;
  /** Keys to front-load (in order) so the strongest fits lead the shelf. */
  priority?: string[];
}

const STARTER_FAVORITE_KEYS = new Set([
  'would-you-rather',
  'quick-pulse',
  'two-truths-and-a-lie',
  'vocab-sprint',
  'flash-quiz',
  'connections',
  'rank-it',
  'prediction-round',
]);

// Order = "grab-and-go by urgency": the most time-pressured in-the-moment jobs lead.
// End-with-a-game (often a "10 minutes left, give me something now" pull) sits above
// pre-planned start-of-class moments. See docs/home-screen-redesign-audit-jun2026.md §4.
export const SHELVES: ShelfDefinition[] = [
  {
    id: 'end-with-a-game',
    label: 'End with a game',
    description: 'Fast, competitive rounds to close class on a high.',
    priority: ['flash-quiz', 'connections', 'grid-rush', 'sector-strike', 'word-chain', 'brain-teasers'],
    predicate: (i) => i.type === 'game',
  },
  {
    id: 'speaking',
    label: 'Get them speaking',
    description: 'High-talk activities that pull every student into the conversation.',
    priority: [
      'decision-council',
      'conversation-rounds',
      'scene-igniter',
      'hot-take-arena',
      'expert-panel',
      'scenario-simulator',
      'would-you-rather',
      'rank-it',
    ],
    predicate: (i) => {
      const goals = i.meta?.goalFit ?? [];
      return (
        i.meta?.speakingLoad === 'high' ||
        goals.includes('speaking-fluency') ||
        goals.includes('discussion-debate') ||
        i.useCase === 'Debates' ||
        i.skills.some((s) => SPEAKING_SKILLS.includes(s))
      );
    },
  },
  {
    id: 'quick',
    label: 'Start of class',
    description: 'Quick warm-ups and short activities to open class or fill a gap.',
    priority: ['quick-pulse', 'would-you-rather', 'prediction-round', 'flash-quiz'],
    predicate: (i) => i.estimatedMinutes <= 10,
  },
  {
    id: 'source',
    label: 'Bring a video or article',
    description: 'Built to run on top of a clip, reading, or PDF you already have.',
    priority: ['read-aloud', 'video-player', 'listening-gap-fill', 'dialogue-detective'],
    predicate: (i) => i.meta?.requiresSource != null || i.useCase === 'Learning Modules',
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary builders',
    description: 'Grow and stress-test word knowledge.',
    priority: ['vocab-sprint', 'synonym-showdown', 'word-chain', 'vocab-radar', 'password'],
    predicate: (i) =>
      i.useCase === 'Vocabulary' ||
      (i.meta?.goalFit ?? []).includes('vocabulary-building') ||
      i.skills.includes('Vocabulary'),
  },
  {
    id: 'starters',
    label: 'Starter favorites',
    description: 'Reliable, low-prep wins to try first.',
    predicate: (i) => STARTER_FAVORITE_KEYS.has(i.key),
  },
];

/** Build the ordered shelves, front-loading priority keys and dropping thin shelves. */
export function buildShelves(minItems = 3): Array<ShelfDefinition & { items: DiscoveryItem[] }> {
  const all = getDiscoveryItems();
  return SHELVES.map((shelf) => {
    let items = all.filter(shelf.predicate);
    if (shelf.priority) {
      const order = shelf.priority;
      const rank = (k: string) => {
        const idx = order.indexOf(k);
        return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
      };
      items = [...items].sort((a, b) => rank(a.key) - rank(b.key));
    }
    return { ...shelf, items };
  }).filter((shelf) => shelf.items.length >= minItems);
}

// ─── Featured flight (All-Around Flight) ──────────────────────────────────────

export function getFeaturedPreset(): FlightPlanPreset | undefined {
  return FLIGHT_PLAN_PRESETS.find((p) => p.id === 'all-around-flight-60');
}

/** Route waypoints for the hero "boarding pass" timeline. Carries all three layers:
 *  flight phase (structure) + stage-job label (slot contract). Use the full stage
 *  label verbatim — abbreviating it is what made the route opaque. */
export interface RouteWaypoint {
  label: string;
  kind: FlightStageKind;
  phase?: FlightPhase; // populated for the featured route; decorative preview routes omit it
}

export function getFeaturedRoute(): RouteWaypoint[] {
  const preset = getFeaturedPreset();
  const stages = preset?.flightConfig?.stages ?? [];
  return stages.map((s) => ({ label: s.label, kind: s.kind, phase: s.phase }));
}

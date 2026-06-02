// Teacher Home discovery layer — derives "teacher-job" shelves and lesson-poster
// card metadata from the EXISTING module registries + flight-plan-config. No new
// per-plugin fields (V0): class-size and chips are derived heuristically here so
// the homepage redesign never blocks on tagging ~30 modules.
//
// Personalization slot: getClassSizeChip() takes an optional teacher profile so a
// future onboarding step can flip generic chips to "Best for your setup" without a
// component refactor.

import type { ComponentType } from 'react';
import { Mic, PenLine, Gamepad2, Vote, Users, Scale } from 'lucide-react';
import { getAllGames, GAME_CATEGORY_INFO } from '@/games/registry';
import { getAllActivities, CATEGORY_INFO } from '@/activities/registry';
import { FLIGHT_PLAN_ITEMS, type FlightPlanItem } from '@/lib/flight-plan-config';
import { FLIGHT_PLAN_PRESETS, type FlightPlanPreset } from '@/lib/flight-plan-presets';
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
    }));

  return [...activities, ...games];
}

// ─── Card chip derivation ────────────────────────────────────────────────────

/**
 * Ideal-class-size chip, derived from interaction model (V0 heuristic — no per-plugin
 * field yet). `profile` is the future personalization slot: when present we can return
 * a "Best for your setup" verdict instead of the generic label.
 */
export function getClassSizeChip(
  item: DiscoveryItem,
  profile?: { setup?: 'one-on-one' | 'small-group' | 'classroom' | 'mixed' },
): string {
  const models = item.meta?.interactionModel ?? [];
  // profile hook reserved for a future "Best for your setup" verdict.
  void profile;
  if (models.includes('team-based') || models.includes('role-based')) return 'Best with 4+';
  if (models.includes('voting') || models.includes('simultaneous')) return 'Whole class';
  if (models.includes('discussion') || models.includes('performance')) return 'Pairs & groups';
  return 'Any class size';
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

// ─── Shelves (teacher jobs, not internal categories) ──────────────────────────

export interface ShelfDefinition {
  id: string;
  label: string;
  description: string;
  predicate: (item: DiscoveryItem) => boolean;
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

export const SHELVES: ShelfDefinition[] = [
  {
    id: 'speaking',
    label: 'Get them speaking',
    description: 'High-talk activities that pull every student into the conversation.',
    predicate: (i) => {
      const goals = i.meta?.goalFit ?? [];
      return (
        i.meta?.speakingLoad === 'high' ||
        goals.includes('speaking-fluency') ||
        goals.includes('discussion-debate') ||
        goals.includes('confidence-building')
      );
    },
  },
  {
    id: 'end-with-a-game',
    label: 'End with a game',
    description: 'Fast, competitive rounds to close class on a high.',
    predicate: (i) => i.type === 'game',
  },
  {
    id: 'quick',
    label: 'Ready in 5–10 minutes',
    description: 'Drop-in moments for the gap at the start, middle, or end.',
    predicate: (i) => i.estimatedMinutes <= 10,
  },
  {
    id: 'source',
    label: 'Bring a video or article',
    description: 'Built to run on top of a clip, reading, or PDF you already have.',
    predicate: (i) => i.meta?.requiresSource != null,
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary builders',
    description: 'Grow and stress-test word knowledge.',
    predicate: (i) =>
      i.useCase === 'Vocabulary' || (i.meta?.goalFit ?? []).includes('vocabulary-building'),
  },
  {
    id: 'starters',
    label: 'Starter favorites',
    description: 'Reliable, low-prep wins to try first.',
    predicate: (i) => STARTER_FAVORITE_KEYS.has(i.key),
  },
];

/** Build the ordered shelves, dropping any that don't have enough items to look intentional. */
export function buildShelves(minItems = 3): Array<ShelfDefinition & { items: DiscoveryItem[] }> {
  const all = getDiscoveryItems();
  return SHELVES.map((shelf) => ({ ...shelf, items: all.filter(shelf.predicate) })).filter(
    (shelf) => shelf.items.length >= minItems,
  );
}

// ─── Featured flight (All-Around Flight) ──────────────────────────────────────

export function getFeaturedPreset(): FlightPlanPreset | undefined {
  return FLIGHT_PLAN_PRESETS.find((p) => p.id === 'all-around-flight-60');
}

/** Condensed route waypoints for the hero "boarding pass" timeline. */
export interface RouteWaypoint {
  label: string;
  kind: 'stage' | 'micro-event' | 'end-game' | 'landing';
}

export function getFeaturedRoute(): RouteWaypoint[] {
  const preset = getFeaturedPreset();
  const stages = preset?.flightConfig?.stages ?? [];
  // Short, scannable labels for the poster timeline.
  const SHORT: Record<string, string> = {
    icebreaker: 'Icebreaker',
    briefing: 'Briefing',
    'language-toolkit': 'Toolkit',
    'opinion-pulse': 'Pulse',
    'mission-board': 'Mission',
    'accuracy-check': 'Accuracy',
    production: 'Council',
    'end-game': 'Game',
    landing: 'Landing',
  };
  return stages.map((s) => ({ label: SHORT[s.stageId] ?? s.label, kind: s.kind }));
}

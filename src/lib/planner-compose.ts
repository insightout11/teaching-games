// Preset-anchored lesson composer. Pure selection/sequencing logic — depends only
// on the static metadata layer (flight-plan-config + presets), never on the React
// registries. This keeps it cheap to test and reusable by the future intent box.

import {
  FLIGHT_PLAN_ITEMS,
  getFlightPlanItem,
  type FlightPlanItem,
  type GoalTag,
  type SlotType,
  type AuditedClassSize,
} from './flight-plan-config';
import { FLIGHT_PLAN_PRESETS, type FlightPlanPreset } from './flight-plan-presets';
import type { Difficulty } from './difficulty';

export interface PlanModule {
  id: string;
  slotType: SlotType;
  key: string;
  isLocked: boolean;
  stageId?: string;
  stageLabel?: string;
  isMicroEvent?: boolean;
  pool?: string[];
  /** Micro-event that only appears in World Flight; filtered out at launch otherwise. */
  worldFlightOnly?: boolean;
}

export type ComposerLevel = 'beginner' | 'intermediate' | 'advanced';

/** Map the 5-level Difficulty scale onto the 3 levels modules are tagged with. */
export function difficultyToComposerLevel(difficulty: Difficulty): ComposerLevel {
  switch (difficulty) {
    case 'Beginner':
    case 'Easy':
      return 'beginner';
    case 'Advanced':
    case 'Expert':
      return 'advanced';
    default:
      return 'intermediate';
  }
}

/** Everything the composer needs to assemble a lesson. The future intent box fills the same struct. */
export interface ComposeIntent {
  goal: GoalTag;
  level: ComposerLevel;
  durationMinutes: 30 | 45 | 60 | 90;
  sourceKind?: 'video' | 'text' | null;
  /** Optional — when known (e.g. selected class), drives class-size-aware swaps. */
  classSize?: AuditedClassSize | null;
}

/**
 * A slot is "undetermined" — decided live, not pre-set — when it's the mission
 * selector or has a pool to pick from. Such slots are masked as "Waypoint" so
 * the specific module isn't revealed (matches the lobby departures board).
 */
export function isUndeterminedModule(m: { key: string; pool?: string[] }): boolean {
  return m.key === 'mission-selector' || (m.pool?.length ?? 0) > 0;
}

export function moduleCountForDuration(minutes: 30 | 45 | 60 | 90): number {
  return { 30: 4, 45: 4, 60: 5, 90: 7 }[minutes];
}

// ─── ID generation (works in browser + node test env) ──────────────────────────
let _idCounter = 0;
function makeId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  return c?.randomUUID?.() ?? `m-${Date.now()}-${_idCounter++}`;
}

function mod(slotType: SlotType, key: string): PlanModule {
  return { id: makeId(), slotType, key, isLocked: false };
}

// ─── Preset anchoring ──────────────────────────────────────────────────────────

const FLAGSHIP_PRESET_ID = 'all-around-flight-60';
const SOURCE_BRIEFING_KEYS = new Set(['video-player', 'read-aloud']);

/**
 * Presets usable as a general lesson skeleton: a full Takeoff→Landing arc with
 * multiple middle slots. Single-module / specialty presets (e.g. Design Studio)
 * are not skeletons and are excluded from anchoring.
 */
function anchorablePresets(): FlightPlanPreset[] {
  return FLIGHT_PLAN_PRESETS.filter((p) => !p.skipTakeoffLanding && p.moduleSequence.length >= 2);
}

/**
 * Pick the preset whose pedagogy best matches the intent. Exact goal match wins;
 * source-grounded intents prefer presets that brief from a source; the flagship
 * all-rounder is the safe default when nothing matches strongly.
 */
export function pickNearestPreset(goal: GoalTag, sourceKind?: 'video' | 'text' | null): FlightPlanPreset {
  const candidates = anchorablePresets();
  const flagship = candidates.find((p) => p.id === FLAGSHIP_PRESET_ID) ?? candidates[0];
  let best = flagship;
  let bestScore = -Infinity;
  for (const p of candidates) {
    let score = 0;
    if (p.goal === goal) score += 3;
    if (sourceKind && !p.skipSourceBriefing) score += 1;
    if (p.id === FLAGSHIP_PRESET_ID) score += 0.5; // gentle default bias
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

function bestLandingKey(goal: GoalTag): string {
  const candidates = FLIGHT_PLAN_ITEMS.filter((i) => i.missionLanding);
  const match = candidates.find((i) => i.goalFit.includes(goal));
  return (match ?? FLIGHT_PLAN_ITEMS.find((i) => i.key === 'final-answer')!).key;
}

/** A pinned module is never trimmed, reordered, or swapped by adaptation. */
function isPinned(m: PlanModule): boolean {
  return m.slotType === 'takeoff' || m.slotType === 'landing' || SOURCE_BRIEFING_KEYS.has(m.key);
}

/**
 * Flatten a preset into a plain, editable module sequence (no flightConfig/pool/
 * micro-event runtime metadata — those belong to the Presets tab, not Build).
 */
function skeletonFromPreset(preset: FlightPlanPreset, sourceKind?: 'video' | 'text' | null): PlanModule[] {
  const takeoffKey = preset.skipTakeoffLanding ? null : (preset.takeoff ?? 'mission-selector');
  const landingKey = preset.skipTakeoffLanding ? null : (preset.landing ?? bestLandingKey(preset.goal));

  const middle = preset.moduleSequence
    .filter((s) => !s.worldFlightOnly) // World-Flight-only checks don't belong in a home build
    .filter((s) => s.key !== takeoffKey)
    .map((s) => mod(s.slotType, s.key));

  const modules: PlanModule[] = [
    ...(takeoffKey ? [mod('takeoff', takeoffKey)] : []),
    ...middle,
    ...(landingKey ? [mod('landing', landingKey)] : []),
  ];

  return injectSourceBriefing(modules, sourceKind, preset);
}

/**
 * Route the source briefing: swap the briefing module to match the source kind,
 * inject one when missing, and drop source-only modules when there is no source.
 */
function injectSourceBriefing(
  modules: PlanModule[],
  sourceKind: 'video' | 'text' | null | undefined,
  preset: FlightPlanPreset,
): PlanModule[] {
  if (preset.skipSourceBriefing) return modules;

  if (!sourceKind) {
    // No source attached — strip modules that genuinely require one (e.g. listening-gap-fill).
    return modules.filter((m) => !getFlightPlanItem(m.key)?.requiresSource);
  }

  const briefingKey = sourceKind === 'video' ? 'video-player' : 'read-aloud';
  const out = modules.map((m) => {
    if (sourceKind === 'video' && m.key === 'read-aloud') return { ...m, key: 'video-player', slotType: 'presentation' as const };
    if (sourceKind === 'text' && m.key === 'video-player') return { ...m, key: 'read-aloud', slotType: 'presentation' as const };
    return m;
  });

  if (!out.some((m) => m.key === briefingKey)) {
    const takeoffIdx = out.findIndex((m) => m.slotType === 'takeoff');
    out.splice(takeoffIdx >= 0 ? takeoffIdx + 1 : 0, 0, mod('presentation', briefingKey));
  }
  return out;
}

// ─── Candidate scoring ─────────────────────────────────────────────────────────

function scoreCandidate(item: FlightPlanItem, slotType: SlotType, intent: ComposeIntent, prevKey?: string | null): number {
  let s = 0;
  if (!item.slotFit.includes(slotType)) s -= 10;
  if (item.goalFit.includes(intent.goal)) s += 3;
  if (item.levelFit.includes(intent.level)) s += 2;
  if (intent.classSize && item.idealClassSizes.includes(intent.classSize)) s += 1;
  if (item.requiresSource) s += item.requiresSource === intent.sourceKind ? 0 : -10;
  if (prevKey) {
    const prev = getFlightPlanItem(prevKey);
    if (prev?.avoidAfter.includes(item.key)) s -= 4;
    if (prev?.strongWith.includes(item.key)) s += 1;
    if (item.strongWith.includes(prevKey)) s += 1;
    if (prev && prev.energy === 'high' && item.energy === 'high') s -= 2;
  }
  return s;
}

/** Does this item satisfy the hard constraints for its slot under this intent? */
function acceptableItem(item: FlightPlanItem, slotType: SlotType, intent: ComposeIntent): boolean {
  if (!item.slotFit.includes(slotType)) return false;
  if (!item.levelFit.includes(intent.level)) return false;
  if (item.requiresSource && item.requiresSource !== intent.sourceKind) return false;
  if (intent.classSize && !item.idealClassSizes.includes(intent.classSize)) return false;
  return true;
}

/** Constraint check by key; unknown keys (e.g. source briefing) are left alone. */
function acceptable(key: string, slotType: SlotType, intent: ComposeIntent): boolean {
  const item = getFlightPlanItem(key);
  if (!item) return true;
  return acceptableItem(item, slotType, intent);
}

function pickBestCandidate(
  slotType: SlotType,
  intent: ComposeIntent,
  usedKeys: Set<string>,
  prevKey?: string | null,
  forbid?: (item: FlightPlanItem) => boolean,
): FlightPlanItem | null {
  let best: FlightPlanItem | null = null;
  let bestScore = -Infinity;
  for (const item of FLIGHT_PLAN_ITEMS) {
    if (usedKeys.has(item.key)) continue;
    if (!acceptableItem(item, slotType, intent)) continue; // enforce hard constraints
    if (forbid?.(item)) continue;
    const score = scoreCandidate(item, slotType, intent, prevKey);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

// ─── Adaptation pipeline ───────────────────────────────────────────────────────

function usedKeysOf(modules: PlanModule[]): Set<string> {
  return new Set(modules.map((m) => m.key));
}

/** Resize the adaptable (non-pinned) middle to hit the duration's target module count. */
function resizeToTarget(modules: PlanModule[], intent: ComposeIntent): PlanModule[] {
  const target = moduleCountForDuration(intent.durationMinutes);
  const mods = [...modules];

  // Trim: drop the lowest-fit non-pinned middle modules first.
  while (mods.length > target) {
    let worstIdx = -1;
    let worstScore = Infinity;
    for (let i = 0; i < mods.length; i++) {
      if (isPinned(mods[i])) continue;
      const item = getFlightPlanItem(mods[i].key);
      const score = item ? scoreCandidate(item, mods[i].slotType, intent) : 0;
      if (score < worstScore) {
        worstScore = score;
        worstIdx = i;
      }
    }
    if (worstIdx === -1) break; // nothing left to trim
    mods.splice(worstIdx, 1);
  }

  // Extend: add best-fit modules before the landing. Prefer a production slot if
  // none exists yet, otherwise practice.
  while (mods.length < target) {
    const used = usedKeysOf(mods);
    const hasProduction = mods.some((m) => m.slotType === 'production');
    const slotType: SlotType = hasProduction ? 'practice' : 'production';
    const landingIdx = mods.findIndex((m) => m.slotType === 'landing');
    const insertAt = landingIdx >= 0 ? landingIdx : mods.length;
    const prevKey = insertAt > 0 ? mods[insertAt - 1].key : null;
    const pick = pickBestCandidate(slotType, intent, used, prevKey);
    if (!pick) break;
    mods.splice(insertAt, 0, mod(slotType, pick.key));
  }

  return mods;
}

/** Replace non-pinned modules that fail constraints, or that miss the goal when a better fit exists. */
function swapForFit(modules: PlanModule[], intent: ComposeIntent): PlanModule[] {
  const mods = [...modules];
  for (let i = 0; i < mods.length; i++) {
    const m = mods[i];
    if (isPinned(m)) continue;
    const item = getFlightPlanItem(m.key);
    const prevKey = i > 0 ? mods[i - 1].key : null;
    const hardFail = !acceptable(m.key, m.slotType, intent);
    const missesGoal = item ? !item.goalFit.includes(intent.goal) : false;
    if (!hardFail && !missesGoal) continue;

    const used = usedKeysOf(mods);
    used.delete(m.key);
    const pick = pickBestCandidate(m.slotType, intent, used, prevKey);
    if (!pick) continue;
    // Only swap on a soft (goal) miss if the replacement is genuinely a better fit.
    if (!hardFail) {
      const curScore = item ? scoreCandidate(item, m.slotType, intent, prevKey) : -Infinity;
      const newScore = scoreCandidate(pick, m.slotType, intent, prevKey);
      if (newScore <= curScore) continue;
    }
    mods[i] = { ...m, key: pick.key };
  }
  return mods;
}

/** Fix adjacency problems: two high-energy modules back-to-back, or avoidAfter pairs. */
function fixAdjacency(modules: PlanModule[], intent: ComposeIntent): PlanModule[] {
  const mods = [...modules];
  for (let i = 1; i < mods.length; i++) {
    const cur = mods[i];
    if (isPinned(cur)) continue;
    const prev = mods[i - 1];
    const prevItem = getFlightPlanItem(prev.key);
    const curItem = getFlightPlanItem(cur.key);
    const doubleHigh = prevItem?.energy === 'high' && curItem?.energy === 'high';
    const avoid = prevItem?.avoidAfter.includes(cur.key) ?? false;
    if (!doubleHigh && !avoid) continue;

    const used = usedKeysOf(mods);
    used.delete(cur.key);
    const pick = pickBestCandidate(cur.slotType, intent, used, prev.key, (item) => {
      if (prevItem?.avoidAfter.includes(item.key)) return true;
      if (prevItem?.energy === 'high' && item.energy === 'high') return true;
      return false;
    });
    if (pick) mods[i] = { ...cur, key: pick.key };
  }
  return mods;
}

/**
 * Compose a lesson from a teacher's intent. Preset-anchored: starts from the
 * nearest hand-tuned preset skeleton, then adapts it (duration, level, goal fit,
 * source, pacing, class size) so the result inherits verified pedagogy.
 */
export function composeLesson(intent: ComposeIntent): PlanModule[] {
  const preset = pickNearestPreset(intent.goal, intent.sourceKind);
  const skeleton = skeletonFromPreset(preset, intent.sourceKind);
  let mods = resizeToTarget(skeleton, intent);
  mods = swapForFit(mods, intent);
  mods = fixAdjacency(mods, intent);
  return mods;
}

/**
 * Opinionated default module list for the given goal, difficulty, and duration.
 * Back-compatible wrapper around the preset-anchored composer.
 */
export function suggestModules(
  goal: GoalTag,
  difficulty: Difficulty,
  durationMinutes: 30 | 45 | 60 | 90,
  sourceKind?: 'video' | 'text' | null,
  classSize?: AuditedClassSize | null,
): PlanModule[] {
  return composeLesson({
    goal,
    level: difficultyToComposerLevel(difficulty),
    durationMinutes,
    sourceKind,
    classSize,
  });
}

import { FLIGHT_PLAN_ITEMS, type GoalTag, type SlotType } from './flight-plan-config';
import type { Difficulty } from './difficulty';

export interface PlanModule {
  id: string;
  slotType: SlotType;
  key: string;
  isLocked: boolean;
}

export function moduleCountForDuration(minutes: 30 | 45 | 60 | 90): number {
  return { 30: 3, 45: 4, 60: 5, 90: 7 }[minutes];
}

// Middle slot sequences indexed by middle-slot count (total - 2)
const MIDDLE_SEQUENCES: Record<number, SlotType[]> = {
  1: ['practice'],
  2: ['presentation', 'practice'],
  3: ['presentation', 'practice', 'production'],
  5: ['presentation', 'practice', 'production', 'practice', 'production'],
};

/**
 * Opinionated default module list for the given goal, difficulty, and duration.
 * Takeoff (mission-selector) and Landing are locked; middle slots are auto-scored.
 */
export function suggestModules(
  goal: GoalTag,
  difficulty: Difficulty,
  durationMinutes: 30 | 45 | 60 | 90,
): PlanModule[] {
  const total = moduleCountForDuration(durationMinutes);
  const middleCount = total - 2;
  const level = difficulty.toLowerCase() as 'beginner' | 'intermediate' | 'advanced';
  const targetSlots: SlotType[] = MIDDLE_SEQUENCES[middleCount] ?? MIDDLE_SEQUENCES[3];

  const takeoff: PlanModule = {
    id: crypto.randomUUID(),
    slotType: 'takeoff',
    key: 'mission-selector',
    isLocked: true,
  };

  // Best missionLanding item for the goal, fallback to final-answer
  const landingCandidates = FLIGHT_PLAN_ITEMS.filter((item) => item.missionLanding);
  const landingItem =
    pickBest(landingCandidates, goal, level, 'landing') ??
    FLIGHT_PLAN_ITEMS.find((item) => item.key === 'final-answer')!;
  const landing: PlanModule = {
    id: crypto.randomUUID(),
    slotType: 'landing',
    key: landingItem.key,
    isLocked: true,
  };

  // Greedy fill: for each target slot, pick highest-scoring unused item
  const usedKeys = new Set<string>(['mission-selector', landingItem.key]);
  const middle: PlanModule[] = [];
  let prevKey: string | null = null;

  for (const slotType of targetSlots) {
    const prevAvoid = prevKey
      ? (FLIGHT_PLAN_ITEMS.find((i) => i.key === prevKey)?.avoidAfter ?? [])
      : [];
    const candidates = FLIGHT_PLAN_ITEMS.filter(
      (item) => !usedKeys.has(item.key) && !prevAvoid.includes(item.key),
    );
    const best = pickBest(candidates, goal, level, slotType);
    if (!best) continue;

    usedKeys.add(best.key);
    prevKey = best.key;
    middle.push({ id: crypto.randomUUID(), slotType, key: best.key, isLocked: false });
  }

  return [takeoff, ...middle, landing];
}

function pickBest(
  candidates: typeof FLIGHT_PLAN_ITEMS,
  goal: GoalTag,
  level: 'beginner' | 'intermediate' | 'advanced',
  targetSlot: SlotType,
): (typeof FLIGHT_PLAN_ITEMS)[0] | null {
  let best: (typeof FLIGHT_PLAN_ITEMS)[0] | null = null;
  let bestScore = -Infinity;

  for (const item of candidates) {
    let score = 0;
    if (item.goalFit.includes(goal)) score += 2;
    if (item.levelFit.includes(level)) score += 1;
    if (!item.slotFit.includes(targetSlot)) score -= 10;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return best;
}

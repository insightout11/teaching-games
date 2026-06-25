import type { FlightPlanStep } from '@/components/ui/flight-plan';
import type { LessonSlot } from '@/hooks/use-lesson-session';
import type { LessonPhase } from '@/hooks/use-lesson-session';
import { getGame } from '@/games/registry';
import { getActivity } from '@/activities/registry';

/**
 * Look up pppStage from game or activity registry by key (used for slot time-budget weights,
 * NOT for display — route labels use the flight-consistent Takeoff/Stage/Check/Landing).
 */
function getPppStage(key: string): string | null {
  const game = getGame(key);
  if (game) return game.pppStage;
  const activity = getActivity(key);
  if (activity) return activity.pppStage;
  return null;
}

/**
 * Transform runtime LessonSlot[] into FlightPlanStep[].
 * lessonSlots already includes takeoff (slot 0) and landing (last slot).
 */
/**
 * THE single builder for the runtime flight path — used by both curated presets
 * (FlightSessionView) and composed lessons. Curated slots carry a `stageLabel`
 * (the journey job, e.g. "Briefing"); composed slots fall back to the module name.
 * Defining type/kind here once means the two flight paths can never drift apart.
 */
export function buildRuntimeFlightPlanSteps(slots: LessonSlot[]): FlightPlanStep[] {
  return slots.map((slot, i) => {
    const isTerminal = i === 0 || i === slots.length - 1;
    return {
      id: `slot-${i}`,
      type: i === 0 ? 'Takeoff' : i === slots.length - 1 ? 'Landing' : slot.isMicroEvent ? 'Check' : 'Stage',
      name: slot.stageLabel ?? slot.name,
      // Micro-events render as small checkpoint dots; main stages as full nodes.
      kind: isTerminal ? 'terminal' : slot.isMicroEvent ? 'checkpoint' : 'module',
    };
  });
}

/**
 * Map lesson phase + currentSlotIndex to the flight plan activeIndex.
 * Since lessonSlots[0] = takeoff = flight plan node 0, they map 1:1.
 */
export function getFlightPlanActiveIndex(
  phase: LessonPhase,
  currentSlotIndex: number,
  totalSlots: number,
): number {
  if (phase === 'idle' || phase === 'lobby') return 0;
  if (phase === 'ended') return totalSlots - 1;
  // mission-select, live, landing: use currentSlotIndex directly
  return Math.min(currentSlotIndex, totalSlots - 1);
}

// ─── Altitude utilities ──────────────────────────────────────────────────────

export type EarthState = 'takeoff' | 'flight' | 'landing';

/**
 * Returns a 0–1 altitude value following the lesson arc bell curve.
 * 0 = ground (takeoff/landing), 1 = cruise peak (middle slot).
 */
export function computeAltitude(currentSlotIndex: number, totalSlots: number): number {
  if (totalSlots <= 2) return 0;
  return 1 - Math.pow(2 * currentSlotIndex / (totalSlots - 1) - 1, 2);
}

/**
 * Returns what the earth layer should show based on lesson position.
 */
export function computeEarthState(currentSlotIndex: number, totalSlots: number): EarthState {
  if (currentSlotIndex === 0) return 'takeoff';
  if (currentSlotIndex >= totalSlots - 1) return 'landing';
  return 'flight';
}

// ─── Pacing utilities ────────────────────────────────────────────────────────

const SLOT_TYPE_WEIGHTS: Record<string, number> = {
  presentation: 0.8,
  practice: 1.0,
  production: 1.4,
};
// Micro-events are quick beats (a single round), not full stages — budget them short
// regardless of their underlying PPP stage so they don't read as ~13-min modules.
const MICRO_EVENT_WEIGHT = 0.4;
const TAKEOFF_MIN = 3;
const LANDING_MIN = 4;

/** Infer lesson duration from slot count when stored value is unavailable. */
export function inferLessonDuration(slotCount: number): number {
  return ({ 4: 45, 5: 60, 7: 90 } as Record<number, number>)[slotCount] ?? 60;
}

/**
 * Calculate per-slot time budgets in minutes.
 * Takeoff and landing are fixed; middle slots are weighted by PPP stage.
 */
export function calculateSlotBudgets(lessonDurationMinutes: number, slots: LessonSlot[]): number[] {
  if (slots.length === 0) return [];
  if (slots.length === 1) return [lessonDurationMinutes];
  if (slots.length === 2) return [TAKEOFF_MIN, lessonDurationMinutes - TAKEOFF_MIN];

  const middleSlots = slots.slice(1, -1);
  const remaining = Math.max(0, lessonDurationMinutes - TAKEOFF_MIN - LANDING_MIN);
  const weights = middleSlots.map((s) =>
    s.isMicroEvent ? MICRO_EVENT_WEIGHT : (SLOT_TYPE_WEIGHTS[getPppStage(s.key) ?? 'practice'] ?? 1.0),
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const middleBudgets = weights.map((w) => Math.max(1, Math.round((w / totalWeight) * remaining)));
  return [TAKEOFF_MIN, ...middleBudgets, LANDING_MIN];
}

/**
 * Return fractional pacing index (same float convention as activeIndex in flight-plan.tsx).
 * e.g. 2.35 = "35% through slot 2's time budget".
 * Returns null if session not yet started.
 */
export function getExpectedPacingIndex(
  sessionStartTime: number | null,
  slotBudgets: number[],
): number | null {
  if (sessionStartTime === null || slotBudgets.length === 0) return null;
  const elapsedMin = (Date.now() - sessionStartTime) / 60000;
  let cumulative = 0;
  for (let i = 0; i < slotBudgets.length; i++) {
    const budget = slotBudgets[i];
    if (elapsedMin < cumulative + budget) {
      return Math.min(i + (elapsedMin - cumulative) / budget, slotBudgets.length - 1);
    }
    cumulative += budget;
  }
  return slotBudgets.length - 1;
}

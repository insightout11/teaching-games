import type { FlightPlanStep } from '@/components/ui/flight-plan';
import type { PlanModule } from '@/lib/planner-utils';
import { getModuleDisplayInfo } from '@/lib/planner-utils';
import type { LessonSlot } from '@/hooks/use-lesson-session';
import type { LessonPhase } from '@/hooks/use-lesson-session';
import { getGame } from '@/games/registry';
import { getActivity } from '@/activities/registry';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Transform planner PlanModule[] into FlightPlanStep[].
 * PlanModule[] already includes takeoff/landing entries, so we map directly.
 */
export function buildPlannerFlightPlanSteps(modules: PlanModule[]): FlightPlanStep[] {
  return modules.map((mod) => ({
    id: mod.id,
    type: capitalize(mod.slotType),
    name: getModuleDisplayInfo(mod.key)?.name ?? capitalize(mod.slotType),
    kind: (mod.slotType === 'takeoff' || mod.slotType === 'landing') ? 'terminal' : 'module',
  }));
}

/**
 * Look up pppStage from game or activity registry by key.
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
export function buildRuntimeFlightPlanSteps(slots: LessonSlot[]): FlightPlanStep[] {
  return slots.map((slot, i) => ({
    id: `slot-${i}`,
    type:
      i === 0
        ? 'Takeoff'
        : i === slots.length - 1
          ? 'Landing'
          : capitalize(getPppStage(slot.key) ?? 'Module'),
    name: slot.name,
    kind: (i === 0 || i === slots.length - 1) ? 'terminal' : 'module',
  }));
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

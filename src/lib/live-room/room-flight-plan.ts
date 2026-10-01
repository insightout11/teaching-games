import type { Difficulty } from '@/lib/difficulty';
import type { GrammarTarget } from '@/lib/grammar';
import type { SourceMaterial } from '@/types/source-material';
import type { LessonPlanPayload } from '@/lib/lesson-plan-payload';
import type { LessonSlot } from '@/lib/course';
import { FLIGHT_PLAN_PRESETS, type FlightPlanPreset } from '@/lib/flight-plan-presets';
import { buildLessonSlots } from '@/lib/planner-utils';
import { buildFlightConfigForSlots, buildModulesFromPreset, getSourceKind } from '@/stores/planner-store';

/**
 * Flights launched from inside the Live Room: the same preset → slots building as the planner,
 * but prefilled from the room (topic, source on screen, level, grammar focus) and flown in the
 * running session. The room keeps the journey (origin/destination), so no route goes in here.
 */

/** Presets offered in the room. Travel needs its city trip pack, and Design is World Flight's capstone. */
export function roomFlightPresets(): FlightPlanPreset[] {
  return FLIGHT_PLAN_PRESETS.filter((p) => p.id !== 'design-studio-60' && p.id !== 'travel-60');
}

/** Rough minutes per stage, for sizing a plan to the time left in class. */
function stageMinutes(slot: LessonSlot, i: number, total: number): number {
  if (slot.isMicroEvent) return 3;
  if (i === 0) return 4;
  if (i === total - 1) return 6;
  return 9;
}

export function estimatePlanMinutes(slots: LessonSlot[]): number {
  return slots.reduce((n, sl, i) => n + stageMinutes(sl, i, slots.length), 0);
}

/** The heart of each flight: never trimmed (the main event, the source, the grammar teaching). */
const KEEP = new Set(['production', 'briefing', 'conversation', 'debate', 'produce', 'clarify', 'scene']);

/**
 * Fit a plan into the minutes left (a flight plan started mid-air from free flight). Drops, in
 * order: breaks, then the review game, then supporting stages from the end. The opening, the
 * main event and the landing stay.
 */
export function trimSlotsToMinutes(slots: LessonSlot[], minutes: number): LessonSlot[] {
  let out = [...slots];
  const fits = () => estimatePlanMinutes(out) <= minutes;
  const dropWhere = (pred: (sl: LessonSlot, i: number) => boolean) => {
    for (let i = out.length - 2; i >= 1 && !fits(); i--) {
      if (pred(out[i], i)) out = out.filter((_, j) => j !== i);
    }
  };
  dropWhere((sl) => !!sl.isMicroEvent);
  dropWhere((sl) => sl.stageId === 'end-game');
  dropWhere((sl) => !KEEP.has(sl.stageId ?? ''));
  // Very little time left: the opening goes too (the main event and the landing remain).
  if (!fits() && out.length > 2 && !KEEP.has(out[0].stageId ?? '')) out = out.slice(1);
  return out;
}

export function buildRoomFlightPlan(opts: {
  preset: FlightPlanPreset;
  topic: string;
  difficulty: Difficulty;
  sourceMaterial?: SourceMaterial | null;
  grammarTarget?: GrammarTarget | null;
  /** Mid-air: fit the plan into the minutes left in class. */
  minutesLeft?: number | null;
}): LessonPlanPayload {
  const { preset, topic, difficulty, sourceMaterial, grammarTarget, minutesLeft } = opts;
  const modules = buildModulesFromPreset(preset, getSourceKind(sourceMaterial ?? null)).filter((m) => !m.worldFlightOnly);
  const full = buildLessonSlots(modules);
  const slots = minutesLeft != null ? trimSlotsToMinutes(full, minutesLeft) : full;
  const flightConfig = buildFlightConfigForSlots(preset.flightConfig, slots);
  return {
    customTopic: topic.trim() || sourceMaterial?.title || 'General',
    callsign: `LC-${Math.floor(1000 + Math.random() * 9000)}`,
    difficulty,
    goal: preset.goal,
    lessonDurationMinutes: minutesLeft != null ? Math.min(preset.lessonDurationMinutes, Math.max(15, Math.round(minutesLeft))) : preset.lessonDurationMinutes,
    ...(preset.scoringMode ? { scoringMode: preset.scoringMode } : {}),
    ...(grammarTarget ? { grammarTarget } : {}),
    ...(sourceMaterial ? { sourceMaterial } : {}),
    ...(flightConfig ? { flightPresetId: preset.id, flightConfig } : {}),
    slots,
    generatedContent: {},
    generatedGameContent: {},
  };
}

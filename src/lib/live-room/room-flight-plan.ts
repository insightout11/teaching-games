import type { Difficulty } from '@/lib/difficulty';
import type { GrammarTarget } from '@/lib/grammar';
import type { SourceMaterial } from '@/types/source-material';
import type { LessonPlanPayload } from '@/lib/lesson-plan-payload';
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

export function buildRoomFlightPlan(opts: {
  preset: FlightPlanPreset;
  topic: string;
  difficulty: Difficulty;
  sourceMaterial?: SourceMaterial | null;
  grammarTarget?: GrammarTarget | null;
}): LessonPlanPayload {
  const { preset, topic, difficulty, sourceMaterial, grammarTarget } = opts;
  const modules = buildModulesFromPreset(preset, getSourceKind(sourceMaterial ?? null)).filter((m) => !m.worldFlightOnly);
  const slots = buildLessonSlots(modules);
  const flightConfig = buildFlightConfigForSlots(preset.flightConfig, slots);
  return {
    customTopic: topic.trim() || sourceMaterial?.title || 'General',
    callsign: `LC-${Math.floor(1000 + Math.random() * 9000)}`,
    difficulty,
    goal: preset.goal,
    lessonDurationMinutes: preset.lessonDurationMinutes,
    ...(preset.scoringMode ? { scoringMode: preset.scoringMode } : {}),
    ...(grammarTarget ? { grammarTarget } : {}),
    ...(sourceMaterial ? { sourceMaterial } : {}),
    ...(flightConfig ? { flightPresetId: preset.id, flightConfig } : {}),
    slots,
    generatedContent: {},
    generatedGameContent: {},
  };
}

import type { SourceType } from '@/types/source-material';
import type { GoalTag, SlotType } from '@/lib/flight-plan-config';
import { FLIGHT_PLAN_ITEMS } from '@/lib/flight-plan-config';
import { FLIGHT_PLAN_PRESETS, type FlightPlanPreset, type FlightPresetConfig } from '@/lib/flight-plan-presets';
import type { PlanModule } from '@/lib/planner-compose';
import type { LessonSlot } from '@/lib/course';

type CourseSourceKind = 'video' | 'text' | null;

const TEXT_SOURCE_TYPES = new Set<SourceType>(['text', 'pdf', 'image', 'lyrics', 'stories', 'voa', 'picture-books']);

const COURSE_GOAL_PRESET_IDS: Record<GoalTag, string> = {
  'speaking-fluency': 'speak-60',
  'discussion-debate': 'debate-60',
  'vocabulary-building': 'all-around-flight-60',
  'grammar-reinforcement': 'grammar-60',
  collaboration: 'all-around-flight-60',
  creativity: 'all-around-flight-60',
  'critical-thinking': 'all-around-flight-60',
  'confidence-building': 'all-around-flight-60',
  'functional-english': 'speak-60',
};

export function getCourseFlightPreset(goal: GoalTag): FlightPlanPreset {
  const presetId = COURSE_GOAL_PRESET_IDS[goal];
  return FLIGHT_PLAN_PRESETS.find((preset) => preset.id === presetId) ?? FLIGHT_PLAN_PRESETS[0];
}

export function getCourseSourceKind(source: { kind: 'video' | 'reading'; sourceType: SourceType } | null | undefined): CourseSourceKind {
  if (!source) return null;
  if (source.kind === 'video') return 'video';
  if (source.kind === 'reading' || TEXT_SOURCE_TYPES.has(source.sourceType)) return 'text';
  return null;
}

function withFlightMeta(
  preset: FlightPlanPreset,
  key: string,
  overrides?: { stageId?: string; stageLabel?: string; isMicroEvent?: boolean },
): Pick<PlanModule, 'stageId' | 'stageLabel' | 'isMicroEvent'> {
  const stageId = overrides?.stageId ?? preset.flightConfig?.stageByKey[key];
  const stage = stageId ? preset.flightConfig?.stages.find((candidate) => candidate.stageId === stageId) : undefined;
  return {
    ...(stageId ? { stageId } : {}),
    ...(overrides?.stageLabel || stage?.label ? { stageLabel: overrides?.stageLabel ?? stage?.label } : {}),
    ...((overrides?.isMicroEvent ?? stage?.kind === 'micro-event') ? { isMicroEvent: true } : {}),
  };
}

function makePresetModule(
  preset: FlightPlanPreset,
  slotType: SlotType,
  key: string,
  overrides?: { stageId?: string; stageLabel?: string; isMicroEvent?: boolean; pool?: string[]; worldFlightOnly?: boolean },
): PlanModule {
  return {
    id: crypto.randomUUID(),
    slotType,
    key,
    isLocked: false,
    ...withFlightMeta(preset, key, overrides),
    ...(overrides?.pool ? { pool: overrides.pool } : {}),
    ...(overrides?.worldFlightOnly ? { worldFlightOnly: true } : {}),
  };
}

function applySourceRouting(modules: PlanModule[], preset: FlightPlanPreset, sourceKind: CourseSourceKind): PlanModule[] {
  if (preset.id === 'all-around-flight-60' && sourceKind === 'video') {
    return modules.map((module) =>
      module.stageId === 'briefing' || module.key === 'read-aloud'
        ? { ...module, key: 'video-player', slotType: 'presentation', ...withFlightMeta(preset, 'video-player') }
        : module,
    );
  }

  const allowSourceBriefing = preset.id !== 'all-around-flight-60' && !preset.skipSourceBriefing;
  if (!allowSourceBriefing || !sourceKind) return modules;

  const briefingKey = sourceKind === 'video' ? 'video-player' : 'read-aloud';
  const firstPresentationIndex = modules.findIndex(
    (module) => module.slotType === 'presentation' && !module.isMicroEvent,
  );
  if (firstPresentationIndex === -1 || modules.some((module) => module.key === briefingKey)) return modules;

  return modules.map((module, index) =>
    index === firstPresentationIndex
      ? { ...module, key: briefingKey, slotType: 'presentation', pool: undefined, worldFlightOnly: undefined }
      : module,
  );
}

export function buildCourseModulesFromPreset(preset: FlightPlanPreset, sourceKind: CourseSourceKind): PlanModule[] {
  const takeoffKey = preset.skipTakeoffLanding ? null : (preset.takeoff ?? 'mission-selector');
  const middle: PlanModule[] = preset.moduleSequence
    .filter(({ key }) => key !== takeoffKey)
    .map(({ slotType, key, stageId, stageLabel, isMicroEvent, pool, worldFlightOnly }) =>
      makePresetModule(preset, slotType, key, { stageId, stageLabel, isMicroEvent, pool, worldFlightOnly }),
    );

  let modules: PlanModule[];
  if (preset.skipTakeoffLanding) {
    modules = middle;
  } else {
    const takeoff = makePresetModule(preset, 'takeoff', preset.takeoff ?? 'mission-selector');
    const landingKey =
      preset.landing ??
      FLIGHT_PLAN_ITEMS.filter((item) => item.missionLanding).find((item) => item.goalFit.includes(preset.goal))?.key ??
      'final-answer';
    const landing = makePresetModule(preset, 'landing', landingKey);
    modules = [takeoff, ...middle, landing];
  }

  return applySourceRouting(modules, preset, sourceKind).filter((module) => !module.worldFlightOnly);
}

export function buildFlightConfigForCourseSlots(
  flightConfig: FlightPresetConfig | undefined,
  slots: LessonSlot[],
): FlightPresetConfig | undefined {
  if (!flightConfig) return undefined;

  const activeStageIds = new Set(slots.map((slot) => slot.stageId).filter(Boolean));
  const stageLabelOverrides = new Map<string, string>();
  slots.forEach((slot) => {
    if (slot.stageId && slot.stageLabel) stageLabelOverrides.set(slot.stageId, slot.stageLabel);
  });

  return {
    ...flightConfig,
    stages: flightConfig.stages
      .filter((stage) => activeStageIds.has(stage.stageId))
      .map((stage) => ({
        ...stage,
        label: stageLabelOverrides.get(stage.stageId) ?? stage.label,
      })),
  };
}

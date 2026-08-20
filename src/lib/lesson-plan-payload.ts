import type { ActivityGeneratedContent, GameGeneratedContent } from '@/activities/types';
import type { CourseLessonContext } from '@/lib/course-context';
import type { Difficulty } from '@/lib/difficulty';
import type { FlightPresetConfig } from '@/lib/flight-plan-presets';
import { GrammarTarget } from '@/lib/grammar';
import type { WorldFlightDesignMissionContext } from '@/lib/world-flight/investigations';
import type { WorldFlightSessionContext } from '@/lib/world-flight/journey';
import type { ScoringMode } from '@/stores/session-store';
import type { SourceMaterial } from '@/types/source-material';

export type LessonSlot = {
  type: 'activity' | 'game';
  key: string;
  name: string;
  category?: string;
  stageId?: string;
  stageLabel?: string;
  isMicroEvent?: boolean;
  pool?: string[];
};

export interface LessonPlanPayload {
  customTopic: string;
  callsign?: string;
  slots: LessonSlot[];
  generatedContent: Record<string, ActivityGeneratedContent>;
  generatedGameContent: Record<string, GameGeneratedContent>;
  flightPresetId?: string;
  flightConfig?: FlightPresetConfig;
  goal?: string;
  scoringMode?: ScoringMode;
  isMissionBased?: boolean;
  lessonDurationMinutes?: number;
  difficulty?: Difficulty;
  grammarTarget?: GrammarTarget | null;
  directLaunch?: boolean;
  sourceMaterial?: SourceMaterial;
  courseContext?: CourseLessonContext;
  stageSources?: Record<string, SourceMaterial>;
  worldFlightContext?: WorldFlightSessionContext;
  worldFlightDesignMissionContext?: WorldFlightDesignMissionContext;
  originId?: string;
  destinationId?: string;
}

const DIFFICULTIES = new Set<Difficulty>(['Beginner', 'Easy', 'Intermediate', 'Advanced', 'Expert']);
const SCORING_MODES = new Set<ScoringMode>(['participation', 'accuracy', 'competitive']);
const GRAMMAR_TARGETS = new Set<GrammarTarget>(Object.values(GrammarTarget));

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

/**
 * Boundary validation for lesson plans crossing from the browser into durable
 * session state. Nested source/generated content is already consumed by the
 * lesson runtime, but the routing fields and collection sizes are constrained
 * here so a malformed request cannot become a broken teacher session.
 */
export function parseLessonPlanPayload(value: unknown): LessonPlanPayload | null {
  if (!isRecord(value)) return null;

  const sourceTitle = isRecord(value.sourceMaterial)
    ? cleanString(value.sourceMaterial.title, 200)
    : '';
  const customTopic = cleanString(value.customTopic, 200) || sourceTitle || 'General';
  const rawSlots = Array.isArray(value.slots) ? value.slots : [];
  if (rawSlots.length === 0 || rawSlots.length > 64) return null;

  const slots: LessonSlot[] = [];
  for (const rawSlot of rawSlots) {
    if (!isRecord(rawSlot) || (rawSlot.type !== 'activity' && rawSlot.type !== 'game')) return null;
    const key = cleanString(rawSlot.key, 100);
    const name = cleanString(rawSlot.name, 140);
    if (!key || !name) return null;

    const pool = Array.isArray(rawSlot.pool)
      ? rawSlot.pool.map((entry) => cleanString(entry, 100)).filter(Boolean).slice(0, 50)
      : undefined;
    slots.push({
      type: rawSlot.type,
      key,
      name,
      ...(cleanString(rawSlot.category, 80) ? { category: cleanString(rawSlot.category, 80) } : {}),
      ...(cleanString(rawSlot.stageId, 80) ? { stageId: cleanString(rawSlot.stageId, 80) } : {}),
      ...(cleanString(rawSlot.stageLabel, 100) ? { stageLabel: cleanString(rawSlot.stageLabel, 100) } : {}),
      ...(rawSlot.isMicroEvent === true ? { isMicroEvent: true } : {}),
      ...(pool?.length ? { pool } : {}),
    });
  }

  const difficulty = DIFFICULTIES.has(value.difficulty as Difficulty)
    ? value.difficulty as Difficulty
    : undefined;
  const scoringMode = SCORING_MODES.has(value.scoringMode as ScoringMode)
    ? value.scoringMode as ScoringMode
    : undefined;

  return {
    customTopic,
    slots,
    generatedContent: isRecord(value.generatedContent)
      ? value.generatedContent as Record<string, ActivityGeneratedContent>
      : {},
    generatedGameContent: isRecord(value.generatedGameContent)
      ? value.generatedGameContent as Record<string, GameGeneratedContent>
      : {},
    ...(cleanString(value.callsign, 40) ? { callsign: cleanString(value.callsign, 40) } : {}),
    ...(cleanString(value.flightPresetId, 100) ? { flightPresetId: cleanString(value.flightPresetId, 100) } : {}),
    ...(isRecord(value.flightConfig) ? { flightConfig: value.flightConfig as unknown as FlightPresetConfig } : {}),
    ...(cleanString(value.goal, 200) ? { goal: cleanString(value.goal, 200) } : {}),
    ...(scoringMode ? { scoringMode } : {}),
    ...(value.isMissionBased === true ? { isMissionBased: true } : {}),
    ...(typeof value.lessonDurationMinutes === 'number' && value.lessonDurationMinutes > 0
      ? { lessonDurationMinutes: Math.min(Math.round(value.lessonDurationMinutes), 240) }
      : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(value.grammarTarget === null || GRAMMAR_TARGETS.has(value.grammarTarget as GrammarTarget)
      ? { grammarTarget: value.grammarTarget as GrammarTarget | null }
      : {}),
    ...(value.directLaunch === true ? { directLaunch: true } : {}),
    ...(isRecord(value.sourceMaterial) ? { sourceMaterial: value.sourceMaterial as unknown as SourceMaterial } : {}),
    ...(isRecord(value.courseContext) ? { courseContext: value.courseContext as unknown as CourseLessonContext } : {}),
    ...(isRecord(value.stageSources) ? { stageSources: value.stageSources as Record<string, SourceMaterial> } : {}),
    ...(isRecord(value.worldFlightContext)
      ? { worldFlightContext: value.worldFlightContext as unknown as WorldFlightSessionContext }
      : {}),
    ...(isRecord(value.worldFlightDesignMissionContext)
      ? { worldFlightDesignMissionContext: value.worldFlightDesignMissionContext as unknown as WorldFlightDesignMissionContext }
      : {}),
    ...(cleanString(value.originId, 100) ? { originId: cleanString(value.originId, 100) } : {}),
    ...(cleanString(value.destinationId, 100) ? { destinationId: cleanString(value.destinationId, 100) } : {}),
  };
}

export function lessonPlanStorageKey(sessionId: string): string {
  return `lessonPlanContent:${sessionId}`;
}

function parseSerializedLessonPlan(value: string | null | undefined): LessonPlanPayload | null {
  if (!value) return null;
  try {
    return parseLessonPlanPayload(JSON.parse(value));
  } catch {
    return null;
  }
}

/** Scoped browser state may intentionally override a persisted route in the
 * current tab (for example, "continue session" from Browse). A fresh tab has
 * no scoped state and therefore hydrates from the durable server copy. */
export function resolveLessonPlanPayload(
  persistedContent: unknown,
  scopedContent?: string | null,
  legacyContent?: string | null,
): LessonPlanPayload | null {
  return parseSerializedLessonPlan(scopedContent)
    ?? parseLessonPlanPayload(persistedContent)
    ?? parseSerializedLessonPlan(legacyContent);
}

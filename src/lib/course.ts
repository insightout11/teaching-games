// Course Builder types (v1). Pure — no registry/React imports, safe on server + client.
// The slot/payload builders live in planner-utils (registry-aware); these are just the shapes.

import type { SourceMaterial, SourceType } from '@/types/source-material';
import type { Difficulty } from '@/lib/difficulty';
import type { GoalTag } from '@/lib/flight-plan-config';
import type { ScoringMode } from '@/stores/session-store';
import type { GrammarTarget } from '@/lib/grammar';
import type { FlightPresetConfig } from '@/lib/flight-plan-presets';

/** A launchable lesson slot — mirrors the runtime LessonSlot consumed by use-lesson-session. */
export interface LessonSlot {
  type: 'activity' | 'game';
  key: string;
  name: string;
  category?: string;
  stageId?: string;
  stageLabel?: string;
  isMicroEvent?: boolean;
  pool?: string[];
}

/** What a course lesson is anchored to. */
export type CourseSourceRef =
  | { kind: 'library'; sourceType: SourceType; id: string; title: string }
  | { kind: 'custom' | 'generated'; material: SourceMaterial }
  | null;

/**
 * The launch payload for a course lesson — the same shape `use-lesson-session` reads from
 * sessionStorage['lessonPlanContent'], minus ephemeral/world-flight fields. Stored per lesson.
 */
export interface CourseLessonPayload {
  customTopic: string;
  difficulty: Difficulty;
  goal?: GoalTag;
  lessonDurationMinutes?: 30 | 45 | 60 | 90;
  scoringMode?: ScoringMode;
  isMissionBased?: boolean;
  grammarTarget?: GrammarTarget | null;
  sourceMaterial?: SourceMaterial;
  flightPresetId?: string;
  flightConfig?: FlightPresetConfig;
  slots: LessonSlot[];
  generatedContent: Record<string, unknown>;
  generatedGameContent: Record<string, unknown>;
}

export interface CourseLesson {
  id: string;
  courseId: string;
  orderIndex: number;
  title: string;
  sourceRef: CourseSourceRef;
  lessonPayload: CourseLessonPayload;
  status: 'planned' | 'launched' | 'completed';
  sessionId: string | null;
}

export interface Course {
  id: string;
  teacherId: string | null;
  title: string;
  theme: string;
  description: string | null;
  isTemplate: boolean;
  lessons: CourseLesson[];
}

// ─── AI outline (from /api/course/outline) — pre-composition ──────────────────

export interface CourseOutlineLesson {
  title: string;
  topic: string;
  goal: GoalTag;
  /** Best library match for this lesson's topic (from recommendSources), if any. */
  suggestedSource?: { kind: 'video' | 'reading'; sourceType: SourceType; id: string; title: string } | null;
}

export interface CourseOutline {
  title: string;
  theme: string;
  difficulty: Difficulty;
  lessons: CourseOutlineLesson[];
}

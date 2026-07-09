import * as fs from 'fs';
import * as path from 'path';
import { createServiceClient } from '../src/lib/supabase/service';
import type { CourseLessonPayload, CourseSourceRef } from '../src/lib/course';
import type { GoalTag } from '../src/lib/flight-plan-config';
import { buildCourseLessonPayload } from '../src/lib/planner-utils';
import {
  buildCourseModulesFromPreset,
  buildFlightConfigForCourseSlots,
  getCourseFlightPreset,
  getCourseSourceKind,
} from '../src/lib/course-flight-preset';

(function loadEnvLocal() {
  const envFile = path.join(path.resolve('.'), '.env.local');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const raw = t.slice(eq + 1).trim();
    const val = raw.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
})();

type DbLesson = {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  source_ref: CourseSourceRef;
  lesson_payload: CourseLessonPayload;
};

type DbCourse = {
  id: string;
  title: string;
  is_template: boolean;
};

const VALID_GOALS = new Set<GoalTag>([
  'speaking-fluency',
  'discussion-debate',
  'vocabulary-building',
  'grammar-reinforcement',
  'collaboration',
  'creativity',
  'critical-thinking',
  'confidence-building',
  'functional-english',
]);

function isGoal(value: unknown): value is GoalTag {
  return typeof value === 'string' && VALID_GOALS.has(value as GoalTag);
}

function rebuildPayload(lesson: DbLesson): CourseLessonPayload | null {
  const current = lesson.lesson_payload;
  if (!current || !isGoal(current.goal)) return null;

  const preset = getCourseFlightPreset(current.goal);
  const sourceKind =
    lesson.source_ref?.kind === 'library'
      ? getCourseSourceKind({
          kind: lesson.source_ref.sourceType === 'text' || lesson.source_ref.sourceType === 'voa' ? 'reading' : 'video',
          sourceType: lesson.source_ref.sourceType,
        })
      : null;
  const modules = buildCourseModulesFromPreset(preset, sourceKind);
  const next = buildCourseLessonPayload(
    {
      topic: current.customTopic,
      difficulty: current.difficulty,
      goal: current.goal,
      durationMinutes: (current.lessonDurationMinutes ?? 60) as 30 | 45 | 60 | 90,
      scoringMode: current.scoringMode,
      grammarTarget: current.grammarTarget,
      sourceMaterial: current.sourceMaterial,
    },
    modules,
  );
  const flightConfig = buildFlightConfigForCourseSlots(preset.flightConfig, next.slots);

  return {
    ...next,
    ...(flightConfig ? { flightPresetId: preset.id, flightConfig } : {}),
  };
}

function routeSignature(payload: CourseLessonPayload): string {
  return JSON.stringify({
    flightPresetId: payload.flightPresetId ?? null,
    slots: payload.slots.map((slot) => ({
      type: slot.type,
      key: slot.key,
      name: slot.name,
      category: slot.category ?? null,
      stageId: slot.stageId ?? null,
      stageLabel: slot.stageLabel ?? null,
      isMicroEvent: slot.isMicroEvent ?? false,
      pool: slot.pool ?? null,
    })),
    flightStages: payload.flightConfig?.stages.map((stage) => ({
      stageId: stage.stageId,
      label: stage.label,
      kind: stage.kind,
      phase: stage.phase,
    })) ?? null,
  });
}

async function main() {
  const write = process.argv.includes('--write');
  const supabase = createServiceClient();

  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id,title,is_template')
    .order('created_at', { ascending: false });
  if (courseError) throw courseError;

  const courseById = new Map((courses as DbCourse[] | null ?? []).map((course) => [course.id, course]));
  const { data: lessons, error: lessonError } = await supabase
    .from('course_lessons')
    .select('id,course_id,title,order_index,source_ref,lesson_payload')
    .order('course_id')
    .order('order_index');
  if (lessonError) throw lessonError;

  let changed = 0;
  let skipped = 0;

  for (const lesson of (lessons as DbLesson[] | null) ?? []) {
    const nextPayload = rebuildPayload(lesson);
    if (!nextPayload) {
      skipped += 1;
      continue;
    }

    const beforePreset = lesson.lesson_payload.flightPresetId ?? 'none';
    const afterPreset = nextPayload.flightPresetId ?? 'none';
    const beforeLabels = lesson.lesson_payload.slots.map((slot) => slot.stageLabel ?? slot.name).join(' > ');
    const afterLabels = nextPayload.slots.map((slot) => slot.stageLabel ?? slot.name).join(' > ');
    const needsUpdate = routeSignature(lesson.lesson_payload) !== routeSignature(nextPayload);

    if (!needsUpdate) continue;
    changed += 1;

    const course = courseById.get(lesson.course_id);
    console.log(
      `${write ? 'Updating' : 'Would update'} ${course?.title ?? lesson.course_id} / ${lesson.order_index + 1}. ${lesson.title}: ${beforePreset} -> ${afterPreset}`,
    );
    console.log(`  before: ${beforeLabels}`);
    console.log(`  after:  ${afterLabels}`);

    if (write) {
      const { error } = await supabase
        .from('course_lessons')
        .update({ lesson_payload: nextPayload })
        .eq('id', lesson.id);
      if (error) throw error;
    }
  }

  console.log(`${write ? 'Updated' : 'Would update'} ${changed} lesson payload(s). Skipped ${skipped} without a valid goal.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

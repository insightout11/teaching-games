'use client';

import type { Difficulty } from '@/lib/difficulty';
import type { CourseLessonPayload, CourseOutlineLesson } from '@/lib/course';
import type { SourceMaterial } from '@/types/source-material';
import { buildCourseLessonPayload } from '@/lib/planner-utils';
import { buildCourseModulesFromPreset, buildFlightConfigForCourseSlots, getCourseFlightPreset, getCourseSourceKind } from '@/lib/course-flight-preset';
import { lessonTypeById, type LessonTypeId } from '@/lib/course-lesson-types';
import { lessonPlanStorageKey } from '@/lib/lesson-plan-payload';
import { createClient } from '@/lib/supabase/client';
import type { GrammarTarget } from '@/lib/grammar';

/**
 * Prepare the next lesson (Oct 2026, replaces the old planner): one prepared lesson per class (classes.next_lesson),
 * shown on Home as the class's next flight. Board launches it and clears it.
 * - A typed lesson (Speak, Reading…) carries its lesson plan payload, built like a course lesson.
 * - Free talk carries only a topic: the room opens with it as the Focus.
 */
export type PreparedType = LessonTypeId | 'free';

export interface PreparedLesson {
  type: PreparedType;
  topic: string;
  /** Shown on Home: "Speak · Animals in the rainforest". */
  title: string;
  materialTitle?: string;
  /** Typed lessons: the lesson plan the room flies. */
  payload?: CourseLessonPayload;
  /** Free talk: the room's Focus when it opens (title, optional text such as last lesson's words). */
  focus?: { title: string; text?: string };
  preparedAt: string;
  /** "Get it ready now" made the first stage's content. */
  ready?: boolean;
}

export const PREPARED_TYPE_LABEL: Record<PreparedType, string> = {
  speak: 'Speak', reading: 'Reading', listening: 'Listening', debate: 'Debate', grammar: 'Grammar', mix: 'Mix', free: 'Free talk',
};

/** What students will do, in plain words, for the sheet's preview. */
export const PREPARED_TYPE_PREVIEW: Record<PreparedType, string[]> = {
  speak: ['A real situation to talk through, first try', 'Learn the phrases that help', 'Second and third tries', 'Landing: hear how much better the last try was'],
  reading: ['Predict from the title and pictures', 'Read aloud in turns, phones follow along', 'Talk about it and check what really happened', 'Retell it together'],
  listening: ['Listen to a short clip for the main idea', 'Listen again for details', 'Word games with what you heard', 'Landing: how much more you catch now'],
  debate: ['Vote on a question', 'Read evidence cards', 'Argue in teams, switch sides', 'See how the room changed its mind'],
  grammar: ['Meet one grammar point in examples', 'Spot the mistakes', 'Build sentences with it', 'Prove it in a final round'],
  mix: ['A warm-up question on every phone', 'Words for the topic', 'Two or three games and activities', 'A short landing to finish'],
  free: ['The room opens on this topic', 'A short briefing, questions and words on the phones', 'You choose activities as you go'],
};

export function buildPreparedLesson(input: {
  type: PreparedType;
  topic: string;
  level: Difficulty;
  /** Library item or the teacher's own text. */
  source?: CourseOutlineLesson['suggestedSource'];
  sourceMaterial?: SourceMaterial | null;
  ownText?: { title: string; text: string } | null;
  focusText?: string;
  /** Grammar lessons: the grammar point (the flight's activities need it). */
  grammarTarget?: GrammarTarget | null;
}): PreparedLesson {
  const topic = input.topic.trim();
  const now = new Date().toISOString();
  if (input.type === 'free') {
    return { type: 'free', topic, title: `Free talk · ${topic}`, focus: { title: topic, ...(input.focusText ? { text: input.focusText } : {}) }, preparedAt: now };
  }
  const type = lessonTypeById(input.type)!;
  const preset = getCourseFlightPreset(type.goal, type.flightPresetId);
  const sourceKind = input.ownText ? 'text' : getCourseSourceKind(input.source ?? null);
  const modules = buildCourseModulesFromPreset(preset, sourceKind);
  const material: SourceMaterial | undefined = input.ownText
    ? { sourceType: 'text', title: input.ownText.title, summary: input.ownText.text.slice(0, 500), rawText: input.ownText.text, originalText: input.ownText.text }
    : input.sourceMaterial ?? undefined;
  const payload = buildCourseLessonPayload({ topic, difficulty: input.level, goal: type.goal, durationMinutes: 60, ...(material ? { sourceMaterial: material } : {}), ...(input.type === 'grammar' && input.grammarTarget ? { grammarTarget: input.grammarTarget } : {}) }, modules);
  const flightConfig = buildFlightConfigForCourseSlots(preset.flightConfig, payload.slots);
  if (flightConfig) {
    payload.flightPresetId = preset.id;
    payload.flightConfig = flightConfig;
  }
  return {
    type: input.type,
    topic,
    title: input.type === 'grammar' && input.grammarTarget ? `Grammar · ${input.grammarTarget} · ${topic}` : `${type.label} · ${topic}`,
    ...(input.ownText ? { materialTitle: input.ownText.title } : input.source ? { materialTitle: input.source.title } : {}),
    payload,
    preparedAt: now,
  };
}

export async function savePreparedLesson(classId: string, lesson: PreparedLesson | null): Promise<void> {
  const { error } = await createClient().from('classes').update({ next_lesson: lesson }).eq('id', classId);
  if (error) throw new Error('Could not save the lesson. Please try again.');
}

/** Launch the prepared lesson into a new session (counted like any lesson), clear it from the class, return the session id. */
export async function launchPreparedLesson(classId: string, lesson: PreparedLesson): Promise<string> {
  const res = await fetch('/api/session/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classId, ...(lesson.payload ? { lessonPlanContent: lesson.payload } : {}) }),
  });
  const data = (await res.json().catch(() => ({}))) as { sessionId?: string; error?: string };
  if (!res.ok || !data.sessionId) throw new Error(data.error ?? 'Could not start the class. Please try again.');
  try {
    if (lesson.payload) {
      const serialized = JSON.stringify(lesson.payload);
      sessionStorage.setItem(lessonPlanStorageKey(data.sessionId), serialized);
      sessionStorage.setItem('lessonPlanContent', serialized);
    } else {
      sessionStorage.removeItem('lessonPlanContent');
    }
    if (lesson.focus) sessionStorage.setItem(preparedFocusKey(data.sessionId), JSON.stringify(lesson.focus));
  } catch { /* storage unavailable: the room opens without the prepared topic */ }
  await savePreparedLesson(classId, null).catch(() => {});
  return data.sessionId;
}

/**
 * "Get it ready now": make the first stage's content at prepare time, so Board opens without the first wait (the
 * room already prepares each next stage while the current one runs). Best effort: on failure the room makes it
 * on the day as usual. Skips games (they make their own content), landings and stages seeded from the room.
 */
export async function prepareFirstStage(lesson: PreparedLesson, studentCount: number): Promise<PreparedLesson> {
  const first = lesson.payload?.slots[0];
  if (!lesson.payload || !first || first.type !== 'activity' || ['speak-reveal', 'trip-recap', 'final-answer'].includes(first.key)) return lesson;
  try {
    const res = await fetch('/api/lesson-plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customTopic: lesson.payload.customTopic,
        difficulty: lesson.payload.difficulty,
        activities: [first.key],
        studentCount: Math.max(1, studentCount),
        ...(lesson.payload.sourceMaterial ? { sourceMaterial: lesson.payload.sourceMaterial } : {}),
        ...(lesson.payload.grammarTarget ? { grammarTarget: lesson.payload.grammarTarget } : {}),
      }),
    });
    const data = (await res.json().catch(() => null)) as { success?: boolean; content?: Record<string, unknown> } | null;
    const content = data?.content?.[first.key];
    if (!res.ok || !content) return lesson;
    return { ...lesson, payload: { ...lesson.payload, generatedContent: { ...lesson.payload.generatedContent, [first.key]: content } }, ready: true };
  } catch {
    return lesson;
  }
}

/** The room reads this once at the gate and opens with the prepared topic as its Focus. */
export function preparedFocusKey(sessionId: string): string {
  return `lc-prepared-focus-${sessionId}`;
}

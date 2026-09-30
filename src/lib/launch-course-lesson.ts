'use client';

import type { CourseLesson } from '@/lib/course';
import { lessonPlanStorageKey } from '@/lib/lesson-plan-payload';

/**
 * Launch a single course lesson into a live session — the same path the planner uses:
 * create the session, hand the lesson payload to the runtime via sessionStorage, link the
 * lesson to its session, then navigate. Content generates lazily on the session page.
 */
/**
 * Course carry-over: the phrases the last two completed lessons actually taught go to the
 * front of this lesson's review terms, which every stage generator already recycles.
 */
export function withCarryOver(lesson: CourseLesson, courseLessons: CourseLesson[] = []): CourseLesson['lessonPayload'] {
  const payload = lesson.lessonPayload;
  const ctx = payload.courseContext;
  if (!ctx) return payload;
  const carried = courseLessons
    .filter((l) => l.orderIndex < lesson.orderIndex && l.status === 'completed' && l.lessonMemory?.phrases?.length)
    .sort((a, b) => b.orderIndex - a.orderIndex)
    .slice(0, 2)
    .flatMap((l) => l.lessonMemory!.phrases!);
  if (!carried.length) return payload;
  const seen = new Set<string>();
  const reviewTerms = [...carried, ...ctx.reviewTerms].filter((t) => {
    const k = t.trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 8);
  return { ...payload, courseContext: { ...ctx, reviewTerms } };
}

export async function launchCourseLesson(lesson: CourseLesson, classId: string, courseLessons: CourseLesson[] = []): Promise<void> {
  const lessonPayload = withCarryOver(lesson, courseLessons);
  const res = await fetch('/api/session/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classId, lessonPlanContent: lessonPayload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create session' }));
    throw new Error(err.error ?? 'Failed to create session');
  }
  const { sessionId } = (await res.json()) as { sessionId: string };

  // use-lesson-session reads this on the session page.
  const serializedLessonPlan = JSON.stringify(lessonPayload);
  sessionStorage.setItem(lessonPlanStorageKey(sessionId), serializedLessonPlan);
  sessionStorage.setItem('lessonPlanContent', serializedLessonPlan);

  // Record the launch on the course lesson (best-effort — don't block takeoff on it).
  fetch(`/api/course/lesson/${lesson.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'launched', sessionId }),
  }).catch(() => {});

  window.location.href = `/sessions/${sessionId}`;
}

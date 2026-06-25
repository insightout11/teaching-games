'use client';

import type { CourseLesson } from '@/lib/course';

/**
 * Launch a single course lesson into a live session — the same path the planner uses:
 * create the session, hand the lesson payload to the runtime via sessionStorage, link the
 * lesson to its session, then navigate. Content generates lazily on the session page.
 */
export async function launchCourseLesson(lesson: CourseLesson, classId: string): Promise<void> {
  const res = await fetch('/api/session/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create session' }));
    throw new Error(err.error ?? 'Failed to create session');
  }
  const { sessionId } = (await res.json()) as { sessionId: string };

  // use-lesson-session reads this on the session page.
  sessionStorage.setItem('lessonPlanContent', JSON.stringify(lesson.lessonPayload));

  // Record the launch on the course lesson (best-effort — don't block takeoff on it).
  fetch(`/api/course/lesson/${lesson.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'launched', sessionId }),
  }).catch(() => {});

  window.location.href = `/sessions/${sessionId}`;
}

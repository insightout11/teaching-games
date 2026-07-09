// DB-row → API-shape mappers for courses. Kept out of the route files because Next.js
// route modules may only export HTTP handlers (GET/POST/…) + config.

import type { Course, CourseLesson, CourseLessonPayload, CourseSourceRef } from '@/lib/course';
import { getLibrarySourceMaterial } from '@/lib/library-source-material';

export interface DbCourse {
  id: string;
  teacher_id: string | null;
  title: string;
  theme: string;
  description: string | null;
  is_template: boolean;
}
export interface DbLesson {
  id: string;
  course_id: string;
  order_index: number;
  title: string;
  source_ref: CourseSourceRef;
  lesson_payload: CourseLessonPayload;
  status: 'planned' | 'launched' | 'completed';
  session_id: string | null;
}

export function hydrateLessonPayload(sourceRef: CourseSourceRef, payload: CourseLessonPayload): CourseLessonPayload {
  if (payload.sourceMaterial) return payload;
  const sourceMaterial = getLibrarySourceMaterial(sourceRef);
  return sourceMaterial ? { ...payload, sourceMaterial } : payload;
}

export function toLesson(l: DbLesson): CourseLesson {
  const sourceRef = l.source_ref ?? null;
  return {
    id: l.id,
    courseId: l.course_id,
    orderIndex: l.order_index,
    title: l.title,
    sourceRef,
    lessonPayload: hydrateLessonPayload(sourceRef, l.lesson_payload),
    status: l.status,
    sessionId: l.session_id,
  };
}

export function toCourse(c: DbCourse, lessons: DbLesson[] = []): Course {
  return {
    id: c.id,
    teacherId: c.teacher_id,
    title: c.title,
    theme: c.theme,
    description: c.description,
    isTemplate: c.is_template,
    lessons: lessons.map(toLesson),
  };
}

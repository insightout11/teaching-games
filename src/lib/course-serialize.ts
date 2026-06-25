// DB-row → API-shape mappers for courses. Kept out of the route files because Next.js
// route modules may only export HTTP handlers (GET/POST/…) + config.

import type { Course, CourseLesson, CourseLessonPayload, CourseSourceRef } from '@/lib/course';

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

export function toLesson(l: DbLesson): CourseLesson {
  return {
    id: l.id,
    courseId: l.course_id,
    orderIndex: l.order_index,
    title: l.title,
    sourceRef: l.source_ref ?? null,
    lessonPayload: l.lesson_payload,
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

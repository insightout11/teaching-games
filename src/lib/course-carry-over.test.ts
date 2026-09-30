import { describe, expect, it } from 'vitest';
import { withCarryOver } from './launch-course-lesson';
import type { CourseLesson } from './course';

function lesson(orderIndex: number, over: Partial<CourseLesson> = {}): CourseLesson {
  return {
    id: `l${orderIndex}`,
    courseId: 'c',
    orderIndex,
    title: `Lesson ${orderIndex}`,
    sourceRef: null as unknown as CourseLesson['sourceRef'],
    lessonPayload: {
      courseContext: { courseTitle: 'T', courseTheme: 'x', lessonNumber: orderIndex + 1, totalLessons: 4, previousLessons: [], reviewTerms: ['outline word', 'shared'] },
    } as unknown as CourseLesson['lessonPayload'],
    status: 'planned',
    sessionId: null,
    ...over,
  };
}

describe('course carry-over', () => {
  it('puts the last two completed lessons’ phrases first, deduped, max 8', () => {
    const lessons = [
      lesson(0, { status: 'completed', lessonMemory: { phrases: ['old one'] } }),
      lesson(1, { status: 'completed', lessonMemory: { phrases: ['boarding pass', 'Shared'] } }),
      lesson(2, { status: 'completed', lessonMemory: { phrases: ['delayed'] } }),
      lesson(3),
    ];
    const payload = withCarryOver(lessons[3], lessons);
    expect(payload.courseContext?.reviewTerms).toEqual(['delayed', 'boarding pass', 'Shared', 'outline word']);
  });

  it('leaves the payload alone when nothing was carried', () => {
    const l = lesson(1);
    expect(withCarryOver(l, [lesson(0), l])).toBe(l.lessonPayload);
  });
});

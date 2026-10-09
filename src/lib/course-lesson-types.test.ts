import { describe, expect, it } from 'vitest';
import { LESSON_TYPES, lessonTypeBlocker, lessonTypeOf } from './course-lesson-types';
import { buildCourseContinuityPrompt, buildCourseLessonContext } from './course-context';

const type = (id: string) => LESSON_TYPES.find((t) => t.id === id)!;

describe('course lesson types', () => {
  it('maps stored lessons to their type', () => {
    expect(lessonTypeOf({ flightPresetId: 'reading-60', goal: 'vocabulary-building' }).id).toBe('reading');
    expect(lessonTypeOf({ goal: 'speaking-fluency' }).id).toBe('speak');
    expect(lessonTypeOf({ goal: 'creativity' }).id).toBe('mix');
  });
  it('needs a text for Reading and a clip for Listening', () => {
    expect(lessonTypeBlocker(type('reading'), null)).toBe('Needs a book or text');
    expect(lessonTypeBlocker(type('reading'), { kind: 'reading', sourceType: 'books', id: 'x' })).toBeNull();
    expect(lessonTypeBlocker(type('reading'), null, true)).toBeNull();
    expect(lessonTypeBlocker(type('listening'), { kind: 'video', sourceType: 'ted', id: 'x' })).toBe('Needs a listening clip');
    expect(lessonTypeBlocker(type('listening'), { kind: 'video', sourceType: 'ted', id: 'x', listening: true })).toBeNull();
    expect(lessonTypeBlocker(type('speak'), null)).toBeNull();
  });
});

describe('course arc', () => {
  const lessons = [
    { title: 'A', topic: 'a', goal: 'speaking-fluency' as const, arcRole: 'baseline' as const },
    { title: 'B', topic: 'b', goal: 'speaking-fluency' as const },
    { title: 'C', topic: 'c', goal: 'speaking-fluency' as const, arcRole: 'compare' as const },
  ];
  it('puts the course task in the first and last lessons only', () => {
    const ctx = (i: number) => buildCourseLessonContext({ courseTitle: 'T', courseTheme: 'th', lessons, index: i, arcTask: 'Say three things' });
    expect(buildCourseContinuityPrompt(ctx(0))).toContain('opens the course');
    expect(buildCourseContinuityPrompt(ctx(1))).not.toContain('Say three things');
    expect(buildCourseContinuityPrompt(ctx(2))).toContain('repeat the task from lesson 1');
  });
});

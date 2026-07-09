import { describe, expect, it } from 'vitest';
import { hydrateLessonPayload, toLesson, type DbLesson } from './course-serialize';
import type { CourseLessonPayload, CourseSourceRef } from './course';

const basePayload: CourseLessonPayload = {
  customTopic: 'street food and public space',
  difficulty: 'Intermediate',
  slots: [],
  generatedContent: {},
  generatedGameContent: {},
};

const worldFlightRef: CourseSourceRef = {
  kind: 'library',
  sourceType: 'world-flight',
  id: 'world-flight-singapore-hawker-culture-video',
  title: 'Singapore - Why Hawker Culture Matters',
};

describe('course serialization source hydration', () => {
  it('hydrates missing lesson source material from a library source ref', () => {
    const hydrated = hydrateLessonPayload(worldFlightRef, basePayload);

    expect(hydrated.sourceMaterial).toMatchObject({
      sourceType: 'world-flight',
      sourceKey: 'world-flight-singapore-hawker-culture-video',
      title: expect.stringContaining('Singapore - Why Hawker Culture Matters'),
    });
  });

  it('does not overwrite existing source material in the saved payload', () => {
    const payload: CourseLessonPayload = {
      ...basePayload,
      sourceMaterial: {
        sourceType: 'text',
        title: 'Teacher Edited Source',
        summary: 'Teacher-edited briefing text.',
      },
    };

    expect(hydrateLessonPayload(worldFlightRef, payload).sourceMaterial?.title).toBe('Teacher Edited Source');
  });

  it('returns hydrated lessons through toLesson', () => {
    const row: DbLesson = {
      id: 'lesson-1',
      course_id: 'course-1',
      order_index: 0,
      title: 'Shared Food Spaces',
      source_ref: worldFlightRef,
      lesson_payload: basePayload,
      status: 'planned',
      session_id: null,
    };

    const lesson = toLesson(row);

    expect(lesson.sourceRef).toEqual(worldFlightRef);
    expect(lesson.lessonPayload.sourceMaterial?.sourceKey).toBe('world-flight-singapore-hawker-culture-video');
  });
});

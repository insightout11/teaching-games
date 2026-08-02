import { describe, expect, it } from 'vitest';
import { getCourseBriefingPreview } from './course-briefing';
import type { CourseLesson } from './course';

function lesson(overrides: Partial<CourseLesson['lessonPayload']> = {}): CourseLesson {
  return {
    id: 'lesson-1',
    courseId: 'course-1',
    orderIndex: 0,
    title: 'Lesson One',
    sourceRef: null,
    lessonPayload: {
      customTopic: 'animal migration',
      difficulty: 'Intermediate',
      slots: [],
      generatedContent: {},
      generatedGameContent: {},
      ...overrides,
    },
    status: 'planned',
    sessionId: null,
  };
}

describe('getCourseBriefingPreview', () => {
  it('summarizes video source grounding', () => {
    const preview = getCourseBriefingPreview(lesson({
      sourceMaterial: {
        sourceType: 'bbc',
        sourceKey: 'bbc_animals',
        title: 'Animal Migration',
        summary: 'A short video about how animals migrate across long distances and adapt to changing habitats.',
      },
    }));

    expect(preview.kind).toBe('video');
    expect(preview.label).toBe('Video briefing');
    expect(preview.title).toBe('Animal Migration');
    expect(preview.preview).toContain('animals migrate');
  });

  it('prefers student-facing briefing text and carries review terms', () => {
    const preview = getCourseBriefingPreview(lesson({
      courseContext: {
        courseTitle: 'Animals & Nature',
        courseTheme: 'wildlife',
        lessonNumber: 3,
        totalLessons: 6,
        previousLessons: [],
        reviewTerms: ['migration', 'habitat', 'predators', 'ecosystems', 'wildlife', 'extra'],
      },
      sourceMaterial: {
        sourceType: 'voa',
        sourceKey: 'voa-animals',
        title: 'A Reading About Wildlife',
        summary: 'Generic summary.',
        briefingText: 'Student-facing reading text about ecosystems.',
        briefingMode: 'adapted',
      },
    }));

    expect(preview.kind).toBe('reading');
    expect(preview.label).toBe('Reading briefing (adapted)');
    expect(preview.preview).toBe('Student-facing reading text about ecosystems.');
    expect(preview.reviewTerms).toEqual(['migration', 'habitat', 'predators', 'ecosystems', 'wildlife']);
  });

  it('explains topic-grounded lessons without a source', () => {
    const preview = getCourseBriefingPreview(lesson());

    expect(preview.kind).toBe('topic');
    expect(preview.label).toBe('Topic-based');
    expect(preview.title).toBe('animal migration');
    expect(preview.preview).toContain('No library source attached');
  });
});

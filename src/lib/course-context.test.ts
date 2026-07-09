import { describe, expect, it } from 'vitest';
import { buildCourseContinuityPrompt, buildCourseLessonContext } from './course-context';
import type { CourseOutlineLesson } from './course';

const lessons: CourseOutlineLesson[] = [
  {
    title: 'Street Food Stories',
    topic: 'street food and everyday city life',
    keywords: ['street food', 'vendors', 'city life'],
    goal: 'speaking-fluency',
    suggestedSource: null,
  },
  {
    title: 'Restaurant Language',
    topic: 'ordering food at a restaurant',
    keywords: ['restaurants', 'menus', 'ordering food', 'Street Food'],
    goal: 'functional-english',
    suggestedSource: null,
  },
  {
    title: 'Future Food',
    topic: 'future food and food security',
    keywords: ['future food', 'food security'],
    goal: 'discussion-debate',
    suggestedSource: null,
  },
];

describe('course continuity context', () => {
  it('builds previous lesson context and deduplicated review terms', () => {
    const context = buildCourseLessonContext({
      courseTitle: 'Food Around the World',
      courseTheme: 'World cuisine and restaurants',
      lessons,
      index: 2,
    });

    expect(context.lessonNumber).toBe(3);
    expect(context.totalLessons).toBe(3);
    expect(context.previousLessons).toEqual([
      { title: 'Street Food Stories', topic: 'street food and everyday city life' },
      { title: 'Restaurant Language', topic: 'ordering food at a restaurant' },
    ]);
    expect(context.reviewTerms).toEqual([
      'street food',
      'vendors',
      'city life',
      'restaurants',
      'menus',
      'ordering food',
    ]);
  });

  it('renders a bounded prompt block that preserves source-grounding priority', () => {
    const prompt = buildCourseContinuityPrompt(
      buildCourseLessonContext({
        courseTitle: 'Food Around the World',
        courseTheme: 'World cuisine and restaurants',
        lessons,
        index: 1,
      }),
    );

    expect(prompt).toContain('Course continuity context');
    expect(prompt).toContain('Lesson 2 of 3');
    expect(prompt).toContain('Review terms from earlier lessons: street food, vendors, city life');
    expect(prompt).toContain('if source material is provided, do not add facts that are not supported by that source');
  });
});

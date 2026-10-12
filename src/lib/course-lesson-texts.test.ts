import { describe, expect, it } from 'vitest';
import { READY_COURSE_PRESETS } from '@/lib/course-presets';
import { courseLessonTexts } from '@/lib/course-lesson-texts';

describe('ready-course lesson texts', () => {
  it('gives every ready-course lesson without library material a text of its own', () => {
    for (const preset of READY_COURSE_PRESETS) {
      const texts = courseLessonTexts(preset.id);
      preset.lessons.forEach((lesson, i) => {
        const text = texts.get(i);
        if (lesson.suggestedSource) expect(text, `${preset.id} #${i} has a source and a text`).toBeUndefined();
        else {
          expect(text, `${preset.id} #${i} has no text`).toBeTruthy();
          expect(text!.title).toBe(lesson.title);
          expect(text!.text.length).toBeGreaterThan(200);
        }
      });
    }
  });
});

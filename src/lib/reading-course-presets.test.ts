import { describe, expect, it } from 'vitest';
import { READING_COURSE_PRESETS } from './course-presets';
import { getCourseFlightPreset } from './course-flight-preset';
import { getLibrarySourceMaterial } from './library-source-material';

describe('reading course presets', () => {
  it('one course per library book, lessons in order, all on the Reading flight with a real book lesson', () => {
    expect(READING_COURSE_PRESETS).toHaveLength(14);
    READING_COURSE_PRESETS.forEach((c) => {
      expect(c.lessons.length).toBeGreaterThanOrEqual(4);
      c.lessons.forEach((l) => {
        expect(getCourseFlightPreset(l.goal, l.flightPresetId).id).toBe('reading-60');
        const src = l.suggestedSource!;
        expect(getLibrarySourceMaterial({ kind: 'library', sourceType: src.sourceType, id: src.id, title: src.title })).not.toBeNull();
      });
    });
  });
});

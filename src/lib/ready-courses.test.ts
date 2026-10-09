import { describe, expect, it } from 'vitest';
import { READY_COURSE_PRESETS } from './course-presets';
import { getLibraryEntry } from './library-source-material';
import { lessonTypeBlocker, lessonTypeOf } from './course-lesson-types';

describe('ready courses (Codex round 24)', () => {
  it('loads 24 courses with real sources and usable lesson types', () => {
    expect(READY_COURSE_PRESETS).toHaveLength(24);
    for (const c of READY_COURSE_PRESETS) {
      for (const l of c.lessons) {
        if (l.suggestedSource) expect(getLibraryEntry(l.suggestedSource.sourceType, l.suggestedSource.id), `${c.id}: ${l.title}`).not.toBeNull();
        expect(lessonTypeBlocker(lessonTypeOf(l), l.suggestedSource), `${c.id}: ${l.title}`).toBeNull();
      }
      expect(c.audience).toBeTruthy();
    }
  });
});

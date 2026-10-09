import { describe, expect, it } from 'vitest';
import { COURSE_PRESETS, READING_COURSE_PRESETS, READY_COURSE_PRESETS } from './course-presets';
import { bankSituationFor } from './speak-check';

describe('course tasks', () => {
  it('every ready course has a course task', () => {
    const missing = [...COURSE_PRESETS, ...READING_COURSE_PRESETS, ...READY_COURSE_PRESETS].filter((p) => !p.arcTask).map((p) => p.id);
    expect(missing).toEqual([]);
  });
});

describe('Junior speak situations', () => {
  it('junior classes always get a junior situation with pictures', () => {
    const s = bankSituationFor('quantum physics', 'Beginner', true);
    expect(s?.pictures?.length).toBeGreaterThan(0);
    expect(s?.before.replies.every((r) => r.split(/\s+/).length <= 6)).toBe(true);
  });
  it('other classes never get junior situations', () => {
    expect(bankSituationFor('quantum physics', 'Beginner')).toBeNull();
  });
});

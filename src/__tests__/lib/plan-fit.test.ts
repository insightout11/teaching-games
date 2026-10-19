import { describe, expect, it } from 'vitest';
import { keyFitMarks, planFitNote } from '@/lib/plan-fit';

describe('plan fit', () => {
  it('a plan that fits has no note', () => {
    expect(planFitNote(['vocab-sprint'], { students: 8, screens: 'all' })).toBeNull();
  });
  it('counts stages that need phones in a no-phones class', () => {
    const note = planFitNote(['flash-quiz', 'vocab-sprint'], { students: 8, screens: 'none' });
    expect(note).toMatch(/1 stage needs phones/);
  });
  it('flags group stages in a 1-on-1 class', () => {
    expect(planFitNote(['imposter'], { students: 1 })).toMatch(/more students/);
  });
  it('unknown keys are ignored', () => {
    expect(keyFitMarks('not-a-real-key', { students: 1, screens: 'none' })).toEqual([]);
  });
});

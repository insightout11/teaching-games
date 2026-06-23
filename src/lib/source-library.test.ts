import { describe, it, expect } from 'vitest';
import { recommendSources } from './source-library';

describe('recommendSources', () => {
  it('returns nothing for empty or stopword-only topics', () => {
    expect(recommendSources('')).toEqual([]);
    expect(recommendSources('the and of a to')).toEqual([]);
  });

  it('finds relevant library items for a topic that exists in the catalog', () => {
    const results = recommendSources('minecraft');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.score > 0)).toBe(true);
  });

  it('ranks by score, highest first', () => {
    const results = recommendSources('minecraft');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('respects the limit', () => {
    expect(recommendSources('minecraft', { limit: 2 }).length).toBeLessThanOrEqual(2);
  });

  it('restricts to a single kind when asked', () => {
    expect(recommendSources('minecraft', { kind: 'video' }).every((r) => r.kind === 'video')).toBe(true);
    expect(recommendSources('minecraft', { kind: 'reading' }).every((r) => r.kind === 'reading')).toBe(true);
  });

  it('every recommendation carries the fields the extract flow needs', () => {
    const [first] = recommendSources('minecraft');
    expect(first).toBeDefined();
    expect(typeof first.id).toBe('string');
    expect(typeof first.sourceType).toBe('string');
    expect(['video', 'reading']).toContain(first.kind);
  });
});

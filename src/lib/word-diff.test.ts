import { describe, expect, it } from 'vitest';
import { isUnchanged, wordDiff } from './word-diff';

describe('wordDiff', () => {
  it('marks replaced and inserted words', () => {
    const parts = wordDiff('Yesterday I go to school', 'Yesterday I went to school.');
    expect(parts.filter((p) => p.kind === 'removed').map((p) => p.text)).toEqual(['go']);
    expect(parts.filter((p) => p.kind === 'added').map((p) => p.text)).toEqual(['went']);
  });

  it('ignores punctuation and case when matching', () => {
    expect(isUnchanged('she has lived here', 'She has lived here.')).toBe(true);
    expect(isUnchanged('she have lived here', 'She has lived here.')).toBe(false);
  });

  it('handles missing words', () => {
    const parts = wordDiff('If I would have time', 'If I had time');
    expect(parts.filter((p) => p.kind === 'added').map((p) => p.text)).toEqual(['had']);
    expect(parts.filter((p) => p.kind === 'removed').map((p) => p.text)).toEqual(['would', 'have']);
  });
});

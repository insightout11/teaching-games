import { describe, expect, it } from 'vitest';
import { findGrammarClip } from './grammar-clips';

describe('findGrammarClip', () => {
  it('finds a tagged clip for every built-in grammar target', () => {
    ['present simple', 'past simple', 'past continuous', 'present perfect', 'past perfect', 'future (will)', 'future (going to)',
      'conditional', 'passive voice', 'relative clause', 'reported speech', 'comparatives & superlatives', 'question forms']
      .forEach((t) => expect(findGrammarClip(t), t).not.toBeNull());
  });

  it('matches free-text targets by keyword and returns null when nothing fits', () => {
    expect(findGrammarClip('should')?.title).toMatch(/Should/i);
    expect(findGrammarClip('zzz nonsense')).toBeNull();
    expect(findGrammarClip('')).toBeNull();
  });
});

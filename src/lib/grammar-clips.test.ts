import { describe, expect, it } from 'vitest';
import { findGrammarClip } from './grammar-clips';

describe('findGrammarClip', () => {
  it('maps known targets to their Gameshow episode', () => {
    expect(findGrammarClip('comparatives & superlatives')?.title).toMatch(/Comparatives/);
    expect(findGrammarClip('future (going to)')?.title).toMatch(/Going To/);
    expect(findGrammarClip('past continuous')?.title).toMatch(/Past Continuous/);
    expect(findGrammarClip('passive voice')?.title).toMatch(/Passives/);
  });

  it('matches free-text targets by keyword and returns null when nothing fits', () => {
    expect(findGrammarClip('should')?.title).toMatch(/Should/);
    expect(findGrammarClip('reported speech')).toBeNull();
    expect(findGrammarClip('')).toBeNull();
  });
});

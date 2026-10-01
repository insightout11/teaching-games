import { describe, expect, it } from 'vitest';
import { grammarFamily } from './grammar';

describe('grammarFamily', () => {
  it('maps every built-in target to its family', () => {
    expect(grammarFamily('past simple')).toBe('tenses');
    expect(grammarFamily('future (going to)')).toBe('tenses');
    expect(grammarFamily('present perfect continuous')).toBe('tenses');
    expect(grammarFamily('comparatives & superlatives')).toBe('comparisons');
    expect(grammarFamily('question forms')).toBe('questions');
    expect(grammarFamily('conditional')).toBe('conditionals');
    expect(grammarFamily('passive voice')).toBe('passive');
    expect(grammarFamily('reported speech')).toBe('reported');
  });

  it('handles free-text targets', () => {
    expect(grammarFamily('Superlatives')).toBe('comparisons');
    expect(grammarFamily('question tags')).toBe('questions');
    expect(grammarFamily('second conditional')).toBe('conditionals');
    expect(grammarFamily('should and must')).toBe('modals');
    expect(grammarFamily('prepositions of place')).toBe('prepositions');
    expect(grammarFamily('')).toBe('other');
  });
});

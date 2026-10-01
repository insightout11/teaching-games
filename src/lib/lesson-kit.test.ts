import { describe, expect, it } from 'vitest';
import { buildKitContext, hasLessonKit } from './source-context';

describe('Lesson Kit context', () => {
  it('is empty without a kit', () => {
    expect(buildKitContext(null)).toBe('');
    expect(hasLessonKit({})).toBe(false);
  });

  it('carries phrases, scene, target and struggles to every generator', () => {
    const ctx = buildKitContext({
      phrases: ['boarding pass', 'delayed'],
      scene: { title: 'The Missing Suitcase', context: 'At a tiny airport.', characters: ['Maya'] },
      grammarTarget: 'past simple',
      struggles: [{ text: 'Yesterday we fly over the Alps.', fix: 'flew' }],
    });
    expect(ctx).toContain('boarding pass, delayed');
    expect(ctx).toContain('The Missing Suitcase');
    expect(ctx).toContain('past simple');
    expect(ctx).toContain('STRUGGLED');
    expect(ctx).toContain('(correct: flew)');
    expect(hasLessonKit({ struggles: [{ text: 'x' }] })).toBe(true);
  });
});

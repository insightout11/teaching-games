import { describe, expect, it } from 'vitest';
import { packBlackBox, packStaticRounds, packWordCards } from './listening-pack';

describe('pack-based listening activities', () => {
  it('keeps only valid Static rounds and needs at least 4', () => {
    const good = { sentence: 'I live in New York.', spoken: 'I work in New York.', target: 'live', swap: 'work', options: ['I', 'live', 'New', 'York'], correctIndex: 1 };
    const bad = { ...good, correctIndex: 0 };
    expect(packStaticRounds([good, good, good])).toBeNull();
    expect(packStaticRounds([good, good, good, good, bad])).toHaveLength(4);
  });

  it('builds a Black Box passage from the clip: content-word gaps, decoys not in the text', () => {
    const bb = packBlackBox({ passage: 'it gave us the chance to get to know each other better when they offered me a permanent job i couldn\'t believe it', start: 96.5, end: 103.4, decoys: ['accent', 'opportunity', 'chance', 'parents', 'actor'] });
    expect(bb?.text.startsWith('It gave')).toBe(true);
    expect(bb?.text).toContain("job I couldn't");
    expect(bb?.gaps.length).toBeGreaterThanOrEqual(3);
    bb?.gaps.forEach((g) => expect(bb.text.includes(g)).toBe(true));
    expect(bb?.decoys).toEqual(['accent', 'opportunity', 'parents', 'actor']);
    expect(bb?.clip).toEqual({ start: 96.5, end: 103.4 });
    expect(packBlackBox({ passage: 'yes it is', start: 1, end: 2, decoys: [] })).toBeNull();
  });

  it('gives each word the clip line it is said in', () => {
    const pack = { segments: [], words: [{ word: 'accent', meaning: 'the way a person sounds' }, { word: 'visa', meaning: 'a travel document' }] };
    expect(packWordCards(pack, ['People love my accent here.'])).toEqual([
      { term: 'accent', meaning: 'the way a person sounds', example: 'People love my accent here.' },
      { term: 'visa', meaning: 'a travel document', example: '' },
    ]);
  });
});

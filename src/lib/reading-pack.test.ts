import { describe, expect, it } from 'vitest';
import { bookLevelFor, caughtChapter, fallbackPassages, validReadingPack } from './reading-pack';

const text = 'Mowgli lived with wolves. He was happy. Shere Khan wanted him. The wolves met at the Council Rock.';

describe('reading packs', () => {
  it('accepts a pack whose passages rebuild the text, rejects one that does not', () => {
    const pack = {
      passages: [{ text: 'Mowgli lived with wolves. He was happy.', gist: { q: 'Who did Mowgli live with?', options: ['Wolves', 'Bears', 'People'], correctIndex: 0 } }, { text: 'Shere Khan wanted him. The wolves met at the Council Rock.' }],
      predict: { q: 'What will the wolves do?', options: ['Keep him', 'Leave', 'Sleep'], outcomeIndex: 0 },
      check: [{ q: 'Who wanted Mowgli?', options: ['Shere Khan', 'Baloo', 'Kaa'], correctIndex: 0 }],
      words: [{ word: 'council', meaning: 'a meeting to decide' }],
      cast: [{ name: 'Mowgli', who: 'a boy raised by wolves' }],
      talk: 'Should Mowgli stay with the wolves?',
    };
    const v = validReadingPack(pack, text)!;
    expect(v.passages).toHaveLength(2);
    expect(v.predict?.outcomeIndex).toBe(0);
    expect(validReadingPack({ ...pack, passages: [pack.passages[0], { text: 'Something else.' }] }, text)).toBeNull();
  });

  it('falls back to whole-sentence passages', () => {
    expect(fallbackPassages(text, 2).map((p) => p.text)).toEqual(['Mowgli lived with wolves. He was happy.', 'Shere Khan wanted him. The wolves met at the Council Rock.']);
  });

  it('picks the retelling level and counts who caught the chapter', () => {
    expect(bookLevelFor('Easy')).toBe('A2');
    expect(bookLevelFor('Advanced')).toBe('B1');
    expect(bookLevelFor('Advanced', ['B1', 'B2'])).toBe('B2');
    expect(bookLevelFor('Easy', ['B1', 'B2'])).toBe('B1');
    const check = [{ q: 'a', options: ['x', 'y'], correctIndex: 0 }, { q: 'b', options: ['x', 'y'], correctIndex: 1 }, { q: 'c', options: ['x', 'y'], correctIndex: 0 }];
    expect(caughtChapter({ s1: { 1: 0, 2: 1, 3: 0 }, s2: { 1: 1, 2: 0, 3: 1 } }, check, 1)).toEqual({ caught: 1, of: 2 });
  });
});

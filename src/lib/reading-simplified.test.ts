import { describe, expect, it } from 'vitest';
import { validPrevious, validSimplified } from './reading-pack';

const original = 'Alice was beginning to get very tired of sitting by her sister on the bank. Suddenly a White Rabbit with pink eyes ran close by her. '.repeat(6);

describe('validSimplified', () => {
  it('accepts a faithful, shorter retelling', () => {
    const s = 'Alice was tired. She sat with her sister by the river. Then a White Rabbit ran past her. It had pink eyes. '.repeat(4);
    expect(validSimplified(original, s)).toBe(s.trim());
  });
  it('rejects new names, commentary, and too-short text', () => {
    expect(validSimplified(original, 'Alice was tired. Then Captain Smollett came by the bank with her sister. '.repeat(6))).toBeNull();
    expect(validSimplified(original, `${'Alice was tired by the bank. '.repeat(10)}\n\nThis chapter shows that Alice is curious.`)).toBeNull();
    expect(validSimplified(original, 'Alice was tired.')).toBeNull();
  });
});


describe('validPrevious', () => {
  const prev = { title: 'Chapter 1', text: 'Alice saw a White Rabbit with a watch. She followed it down a deep hole and fell for a long time.' };
  it('keeps a faithful recap, and only cast and words from the previous part', () => {
    const r = validPrevious({ summary: 'Alice saw a White Rabbit with a watch. She fell down a deep hole.', words: ['watch', 'hole', 'dragon'], cast: [{ name: 'Alice', who: 'a curious girl' }, { name: 'Smollett', who: 'a captain' }] }, prev);
    expect(r.previously?.summary).toContain('White Rabbit');
    expect(r.previously?.words).toEqual(['watch', 'hole']);
    expect(r.cast.map((c) => c.name)).toEqual(['Alice']);
  });
  it('drops a recap with names not in the previous part', () => {
    expect(validPrevious({ summary: 'Alice met the Queen of Hearts and they played a long game together.', words: [], cast: [] }, prev).previously).toBeUndefined();
  });
});

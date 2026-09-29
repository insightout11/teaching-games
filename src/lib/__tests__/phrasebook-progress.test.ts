import { describe, expect, it } from 'vitest';
import { markSeen, markUsed, newWordCount, phraseState } from '@/lib/phrasebook-progress';
import { normalizeReferenceVocab, withPhraseSource } from '@/lib/reference-materials';

describe('phrasebook progress', () => {
  it('walks new → seen → used → mastered across two classes', () => {
    let progress = {};
    let history = {};
    expect(phraseState(progress, history, 'Delta', 's1')).toBe('new');
    progress = markSeen(progress, 'Delta', 1);
    expect(phraseState(progress, history, 'delta', 's1')).toBe('seen');
    ({ progress, history } = markUsed(progress, history, 'Delta', 's1', 2));
    expect(phraseState(progress, history, 'Delta', 's1')).toBe('used');
    // Using it again in the same class doesn't master it
    ({ progress, history } = markUsed(progress, history, 'Delta', 's1', 3));
    expect(phraseState(progress, history, 'Delta', 's1')).toBe('used');
    // Next class: fresh session progress, used again → mastered
    let next = {};
    ({ progress: next, history } = markUsed(next, history, 'delta', 's2', 4));
    expect(phraseState(next, history, 'Delta', 's2')).toBe('mastered');
  });

  it('counts unseen words for the action-bar badge', () => {
    const progress = markSeen({}, 'canal');
    expect(newWordCount(progress, ['canal', 'delta', 'upstream'])).toBe(2);
  });
});

describe('phrasebook card fields', () => {
  it('keeps old two-field vocab unchanged', () => {
    expect(normalizeReferenceVocab([{ word: 'delta', definition: 'Where a river meets the sea.' }]))
      .toEqual([{ word: 'delta', definition: 'Where a river meets the sea.' }]);
  });

  it('keeps example, starter, part of speech and a valid source', () => {
    const [item] = normalizeReferenceVocab([{
      word: 'delta', definition: 'd', example: 'Bangkok is near a delta.', starter: 'A delta is…', partOfSpeech: 'Noun', source: 'reading',
    }]);
    expect(item).toEqual({ word: 'delta', definition: 'd', example: 'Bangkok is near a delta.', starter: 'A delta is…', partOfSpeech: 'noun', source: 'reading' });
    const [bad] = normalizeReferenceVocab([{ word: 'x', definition: 'y', source: 'hacker' }]);
    expect(bad.source).toBeUndefined();
  });

  it('tags a source without overwriting an existing one', () => {
    const tagged = withPhraseSource([{ word: 'a', definition: '' }, { word: 'b', definition: '', source: 'teacher' }], 'topic');
    expect(tagged.map((t) => t.source)).toEqual(['topic', 'teacher']);
  });
});

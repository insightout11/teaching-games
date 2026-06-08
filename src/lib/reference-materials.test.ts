import { describe, expect, it } from 'vitest';
import { normalizeReferenceExpressions, normalizeReferenceVocab } from './reference-materials';

describe('reference material normalization', () => {
  it('unwraps expression arrays returned inside items or data objects', () => {
    expect(normalizeReferenceExpressions({
      items: [{ phrase: 'In my opinion...', example: 'In my opinion, trains are better.' }],
    })).toEqual([
      { phrase: 'In my opinion...', example: 'In my opinion, trains are better.' },
    ]);

    expect(normalizeReferenceExpressions({
      data: [{ expression: 'I agree because...', exampleSentence: 'I agree because it saves time.' }],
    })).toEqual([
      { phrase: 'I agree because...', example: 'I agree because it saves time.' },
    ]);
  });

  it('drops invalid rows instead of passing crash-prone shapes to the UI', () => {
    expect(normalizeReferenceExpressions({ items: [{ example: 'Missing phrase' }] })).toEqual([]);
    expect(normalizeReferenceVocab({ items: [{ term: 'sustainable', meaning: 'Able to continue.' }] })).toEqual([
      { word: 'sustainable', definition: 'Able to continue.' },
    ]);
  });
});

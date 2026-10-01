import { describe, expect, it } from 'vitest';
import { grammarAnchorItems, grammarBoardKey, grammarBoardPreset } from './grammar-board';

const rule = (examples: string[]) => ({ form: 'pattern', whenToUse: 'use', pitfall: 'wrong -> right', examples });

describe('grammar anchor chart', () => {
  it('picks the family template', () => {
    expect(grammarBoardPreset('past simple')).toBe('grammar-tenses');
    expect(grammarBoardPreset('comparatives & superlatives')).toBe('grammar-comparisons');
    expect(grammarBoardPreset('question forms')).toBe('grammar-questions');
    expect(grammarBoardPreset('reported speech')).toBe('grammar-anchor');
  });

  it('puts the rule in the rule zone and sorts examples into family zones', () => {
    const tense = grammarAnchorItems('future (going to)', rule(['We are going to fly.']));
    expect(tense.items.filter((i) => i.zoneKey === 'rule')).toHaveLength(3);
    expect(tense.items.find((i) => i.category === 'example')?.zoneKey).toBe('future');

    const cmp = grammarAnchorItems('comparatives & superlatives', rule(['Tokyo is bigger than Paris.', 'It is the biggest city.']));
    expect(cmp.items.filter((i) => i.category === 'example').map((i) => i.zoneKey)).toEqual(['comparative', 'superlative']);

    const q = grammarAnchorItems('question forms', rule(['Where do you live?', 'Have you been to Rome?']));
    expect(q.items.filter((i) => i.category === 'example').map((i) => i.zoneKey)).toEqual(['wh', 'yesno']);
  });

  it('uses the same board key as the free Class Board widget', () => {
    expect(grammarBoardKey('grammar-tenses')).toBe('class-board-grammar-tenses');
  });
});

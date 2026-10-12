import { describe, expect, it } from 'vitest';
import { bankSituationFor } from '@/lib/speak-check';
import { bankMotionFor } from '@/lib/debate-motion';
import { coversTopic, topicWords } from '@/lib/topic-match';

describe('matching a topic to the banks', () => {
  it('ignores filler words', () => {
    expect(topicWords('The burial practices of Trunyan in Kintamani, Bali')).toEqual(['burial', 'trunyan', 'kintamani', 'bali']);
    expect(topicWords('The best way to use your time')).toEqual([]);
  });

  it('needs the whole topic, not one word in passing', () => {
    expect(coversTopic(1, ['food', 'chain'])).toBe(false);
    expect(coversTopic(2, ['food', 'chain'])).toBe(true);
    expect(coversTopic(1, ['volcano'])).toBe(true);
    expect(coversTopic(0, [])).toBe(false);
  });

  it('gives an unrelated topic no bank item, so the AI writes it for the real topic', () => {
    // Was: a bus-shelter situation (matched on "the") and a team-projects motion (matched on "practices").
    expect(bankSituationFor('The burial practices of Trunyan in Kintamani, Bali', 'Advanced')).toBeNull();
    expect(bankMotionFor('The burial practices of Trunyan in Kintamani, Bali', 'Advanced')).toBeNull();
    // Was: a compost motion on the strength of "food".
    expect(bankMotionFor('Food chains', 'Intermediate')).toBeNull();
  });
});

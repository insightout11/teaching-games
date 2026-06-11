import { describe, expect, it } from 'vitest';
import { splitReadingTurns } from './read-aloud';

const paragraph = Array.from(
  { length: 8 },
  (_, index) => `Sentence ${index + 1} gives the class another factual detail about the city and its people.`,
).join(' ');

describe('splitReadingTurns', () => {
  it('creates multiple turns from a single long paragraph', () => {
    const turns = splitReadingTurns(paragraph, 8);

    expect(turns.length).toBeGreaterThan(2);
    expect(turns.join(' ')).toBe(paragraph);
  });

  it('does not create tiny turns just to include a very large class', () => {
    const turns = splitReadingTurns('One short factual sentence about Vancouver.', 30);

    expect(turns).toHaveLength(1);
  });

  it('removes asterisk vocabulary markup', () => {
    expect(splitReadingTurns('A *public route* follows the water.', 2)).toEqual([
      'A public route follows the water.',
    ]);
  });
});

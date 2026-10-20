import { describe, expect, it } from 'vitest';
import { cardsFromFacts, cleanFactCards, factCardsPrompt } from '@/lib/live-room/fact-cards';

describe('fact cards', () => {
  it('keeps real cards, drops empty and repeated ones, at most two questions', () => {
    const cards = cleanFactCards([
      { headline: 'Tokyo is the largest city in the world.', detail: 'About 37 million people live there.', questions: ['Would you like to live there?', 'Why so big?', 'Third?'] },
      { headline: 'tokyo is the largest city in the world.', detail: 'dup', questions: [] },
      { headline: '', detail: 'no headline', questions: ['x'] },
      'junk',
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0].questions).toHaveLength(2);
  });

  it('never returns more than six cards', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ headline: `Fact number ${i} is here`, detail: '', questions: [] }));
    expect(cleanFactCards(many)).toHaveLength(6);
  });

  it('turns a ready-bank topic’s facts into cards', () => {
    const cards = cardsFromFacts(['Cats sleep a lot.', 'Cats can jump high.'], ['Do you have a pet?']);
    expect(cards.map((c) => c.headline)).toEqual(['Cats sleep a lot.', 'Cats can jump high.']);
    expect(cards[1].questions).toEqual(['Do you have a pet?']);
  });

  it('asks young classes for fewer, shorter cards', () => {
    expect(factCardsPrompt(true)).toContain('exactly 4');
    expect(factCardsPrompt(false)).toContain('exactly 5');
  });
});

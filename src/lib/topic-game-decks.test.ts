import { describe, expect, it } from 'vitest';
import { deckHotSeatCards, deckSecret, deckTabooRounds } from '@/lib/topic-game-decks';

describe('topic game decks', () => {
  it('gives a banked topic Taboo cards with four forbidden words, at the class level first', () => {
    const rounds = deckTabooRounds('Rain', 'Beginner', 6)!;
    expect(rounds).toHaveLength(6);
    for (const round of rounds) {
      expect(round.word).toBeTruthy();
      expect(round.forbiddenWords).toHaveLength(4);
      expect(round.forbiddenWords.map((w) => w.toLowerCase())).not.toContain(round.word.toLowerCase());
    }
  });

  it('gives Hot Seat words and a fresh Twenty Questions secret', () => {
    expect(deckHotSeatCards('Rain', 'Easy')!.length).toBeGreaterThan(3);
    const first = deckSecret('Rain', 'Easy')!;
    const used: string[] = [];
    for (let i = 0; i < 8; i++) {
      const next = deckSecret('Rain', 'Easy', used);
      expect(next).toBeTruthy();
      expect(used).not.toContain(next!.secret);
      used.push(next!.secret);
    }
    expect(deckSecret('Rain', 'Easy', used)).toBeNull();
    expect(['person', 'place', 'thing', 'concept']).toContain(first.category);
  });

  it('returns null for a topic with no deck', () => {
    expect(deckTabooRounds('quarterly tax accounting for dentists')).toBeNull();
    expect(deckSecret('quarterly tax accounting for dentists')).toBeNull();
  });
});

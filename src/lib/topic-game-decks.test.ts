import { describe, expect, it } from 'vitest';
import { deckHotSeatCards, deckSecret, deckTabooRounds } from '@/lib/topic-game-decks';

describe('topic game decks', () => {
  it('gives a banked topic Taboo cards with four forbidden words, at the class level first', () => {
    const rounds = deckTabooRounds('Rain', 'Beginner', 6)!;
    expect(rounds).toHaveLength(6);
    for (const round of rounds) {
      expect(round.word).toBeTruthy();
      expect(round.description.length).toBeGreaterThan(8);
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

describe('stand-ins from the decks', () => {
  it('builds a word-and-meaning quiz with the right answer among four different words', async () => {
    const { deckMeaningQuiz } = await import('@/lib/topic-game-decks');
    const quiz = deckMeaningQuiz('Rain', 'Easy', 5)!;
    expect(quiz).toHaveLength(5);
    for (const q of quiz) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.question.startsWith('Which word means: ')).toBe(true);
      expect(q.explanation).toContain(q.options[q.correctIndex]);
    }
    expect(deckMeaningQuiz('quarterly tax accounting for dentists')).toBeNull();
  });

  it('gives Imposter real rounds for a banked topic', async () => {
    const { deckImposterRounds } = await import('@/lib/topic-game-decks');
    const rounds = deckImposterRounds('Rain', 'Easy')!;
    expect(rounds).toHaveLength(3);
    rounds.forEach((r) => { expect(r.word && r.description && r.hint && r.crewQuestion && r.imposterQuestion).toBeTruthy(); });
  });
});

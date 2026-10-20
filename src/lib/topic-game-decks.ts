import decks from '@/data/topic-game-decks.json';
import type { ImposterRound, TabooRound } from '@/activities/types';
import { findTopicBriefing } from '@/lib/topic-briefings';
import { bankedPictureQuery } from '@/data/banked-picture-queries';

/**
 * Ready card decks for the spoken games, one per banked topic (Codex round 31): the games start at once, stay on
 * the lesson's topic and fit the class level, with no AI wait.
 *
 * SERVER ONLY: the bank is ~780 KB. Import this from API routes, never from client components.
 */
interface Deck {
  topicId: string;
  ageBand: string;
  taboo: Array<{ word: string; forbidden: string[]; level: string; description?: string }>;
  hotSeat: Array<{ word: string; level: string; description?: string }>;
  twentyQuestions: Array<{ secret: string; kind: string; level: string }>;
  imposter?: Array<{ word: string; level: string; description?: string; hint?: string; crewQuestion?: string; imposterQuestion?: string }>;
}

const DECKS = new Map((decks as unknown as Deck[]).map((deck) => [deck.topicId, deck]));
const LEVEL_CEFR: Record<string, string[]> = { Beginner: ['A1'], Easy: ['A1', 'A2'], Intermediate: ['A2', 'B1'], Advanced: ['B1', 'B2'], Expert: ['B1', 'B2'] };

function deckFor(topic: string): Deck | null {
  const id = findTopicBriefing(topic)?.id;
  return (id && DECKS.get(id)) || null;
}

/** Cards at the class level first; easier or harder ones only fill the gap. Shuffled so repeat lessons differ. */
function pick<T extends { level: string }>(cards: T[], difficulty: string | undefined, count: number): T[] {
  const levels = (difficulty && LEVEL_CEFR[difficulty]) || [];
  const shuffle = (list: T[]) => list.map((card) => ({ card, key: Math.random() })).sort((a, b) => a.key - b.key).map((entry) => entry.card);
  const fit = shuffle(cards.filter((card) => levels.includes(card.level)));
  const rest = shuffle(cards.filter((card) => !levels.includes(card.level)));
  return [...fit, ...rest].slice(0, count);
}

/** Taboo Sprint cards for a banked topic, or null when the topic has no deck. */
export function deckTabooRounds(topic: string, difficulty?: string, count = 8): TabooRound[] | null {
  const deck = deckFor(topic);
  if (!deck?.taboo.length) return null;
  return pick(deck.taboo, difficulty, count).map((card) => ({ word: card.word, description: card.description ?? '', forbiddenWords: card.forbidden.slice(0, 4), picture: bankedPictureQuery(card.word) }));
}

/** Hot Seat words for a banked topic (the whole class gives clues, so there are no forbidden words). */
export function deckHotSeatCards(topic: string, difficulty?: string, count = 8): TabooRound[] | null {
  const deck = deckFor(topic);
  if (!deck?.hotSeat.length) return null;
  return pick(deck.hotSeat, difficulty, count).map((card) => ({ word: card.word, description: card.description ?? '', forbiddenWords: [], picture: bankedPictureQuery(card.word) }));
}

/** Imposter rounds for a banked topic. Used as the stand-in when the AI cannot write them (never classroom filler). */
export function deckImposterRounds(topic: string, difficulty?: string, count = 3): ImposterRound[] | null {
  const deck = deckFor(topic);
  const usable = (deck?.imposter ?? []).filter((card) => card.description && card.hint && card.crewQuestion && card.imposterQuestion);
  if (!usable.length) return null;
  return pick(usable, difficulty, count).map((card) => ({ word: card.word, description: card.description!, hint: card.hint!, crewQuestion: card.crewQuestion!, imposterQuestion: card.imposterQuestion! }));
}

/** A word-and-meaning quiz for a banked topic ("Which word means…?"), built from its Taboo and Hot Seat cards. */
export function deckMeaningQuiz(topic: string, difficulty?: string, count = 5): Array<{ question: string; options: string[]; correctIndex: number; explanation: string }> | null {
  const deck = deckFor(topic);
  const cards = [...(deck?.taboo ?? []), ...(deck?.hotSeat ?? [])].filter((card) => card.description);
  if (cards.length < 4) return null;
  return pick(cards, difficulty, count).map((card) => {
    const others = cards.filter((other) => other.word !== card.word).map((other) => ({ other, key: Math.random() })).sort((a, b) => a.key - b.key).slice(0, 3).map((entry) => entry.other.word);
    const correctIndex = Math.floor(Math.random() * 4);
    const options = [...others];
    options.splice(correctIndex, 0, card.word);
    return { question: `Which word means: ${card.description}?`, options, correctIndex, explanation: `"${card.word}" means ${card.description}.` };
  });
}

const KIND_CATEGORY: Record<string, 'person' | 'place' | 'thing' | 'concept'> = { job: 'person', place: 'place', activity: 'concept' };

/** A Twenty Questions secret for a banked topic that hasn't been used this lesson, or null. */
export function deckSecret(topic: string, difficulty?: string, avoid: string[] = []): { secret: string; category: 'person' | 'place' | 'thing' | 'concept' } | null {
  const deck = deckFor(topic);
  if (!deck?.twentyQuestions.length) return null;
  const used = new Set(avoid.map((entry) => entry.trim().toLowerCase()));
  const fresh = pick(deck.twentyQuestions.filter((card) => !used.has(card.secret.toLowerCase())), difficulty, 1)[0];
  return fresh ? { secret: fresh.secret, category: KIND_CATEGORY[fresh.kind] ?? 'thing' } : null;
}

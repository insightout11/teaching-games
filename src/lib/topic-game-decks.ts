import decks from '@/data/topic-game-decks.json';
import type { TabooRound } from '@/activities/types';
import { findTopicBriefing } from '@/lib/topic-briefings';

/**
 * Ready card decks for the spoken games, one per banked topic (Codex round 31): the games start at once, stay on
 * the lesson's topic and fit the class level, with no AI wait.
 *
 * SERVER ONLY: the bank is ~780 KB. Import this from API routes, never from client components.
 */
interface Deck {
  topicId: string;
  ageBand: string;
  taboo: Array<{ word: string; forbidden: string[]; level: string }>;
  hotSeat: Array<{ word: string; level: string }>;
  twentyQuestions: Array<{ secret: string; kind: string; level: string }>;
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
  return pick(deck.taboo, difficulty, count).map((card) => ({ word: card.word, description: '', forbiddenWords: card.forbidden.slice(0, 4) }));
}

/** Hot Seat words for a banked topic (the whole class gives clues, so there are no forbidden words). */
export function deckHotSeatCards(topic: string, difficulty?: string, count = 8): TabooRound[] | null {
  const deck = deckFor(topic);
  if (!deck?.hotSeat.length) return null;
  return pick(deck.hotSeat, difficulty, count).map((card) => ({ word: card.word, description: '', forbiddenWords: [] }));
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

/**
 * The facts board (Oct 2026): before a class discusses a topic, the shared screen presents it as 4-6 big fact cards,
 * revealed one at a time. Each card has a short headline fact, a few more sentences when opened, and two questions
 * the teacher can send to Talk. Written at the class's level; for named things, from Wikipedia (never made up).
 */

import type { AISchema } from '@/lib/ai';

export interface FactCard {
  /** One short, striking fact: what the card shows before it is opened. */
  headline: string;
  /** 2-4 more sentences when the card is opened (empty for a ready-bank topic). */
  detail: string;
  /** Two questions about this fact, to send to Talk. */
  questions: string[];
  /** A short search for a free photo of exactly what this card shows ("Three Sisters Blue Mountains"); '' if none. */
  picture: string;
}

export const FACT_CARDS_SCHEMA: AISchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      headline: { type: 'string' },
      detail: { type: 'string' },
      questions: { type: 'array', items: { type: 'string' } },
      picture: { type: 'string' },
    },
    required: ['headline', 'detail', 'questions', 'picture'],
  },
};

/** The prompt lines for the cards (added to the topic briefing prompt). */
export function factCardsPrompt(junior: boolean): string {
  return junior
    ? `- "cards": exactly 4 fact cards that present this topic to young children before they talk about it, in order from the basics to the most surprising. Each: "headline" (one very short fact, at most 8 easy words), "detail" (2 very short, easy sentences), "questions" (2 very easy questions a child can answer about it), "picture" (2-5 words to search for a real photo of exactly this thing, with the topic's name; "" if nothing can be photographed). Only true facts; if material is given, take the facts from it.`
    : `- "cards": exactly 5 fact cards that present this topic to the class before they discuss it, in order from the basics to the most surprising. Each: "headline" (one striking fact, at most 14 words), "detail" (3 sentences that explain it, with real names, numbers and examples), "questions" (2 open questions about that fact the class could discuss), "picture" (2-5 words to search for a real photo of exactly this thing, with the topic's name, e.g. "Three Sisters Blue Mountains"; "" if nothing can be photographed). Only true facts; if material is given, take the facts from it.`;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

/** Clean the model's cards: real headlines only, at most 6, two questions each at most. */
export function cleanFactCards(raw: unknown): FactCard[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const cards: FactCard[] = [];
  for (const c of raw) {
    const o = (c ?? {}) as Record<string, unknown>;
    const headline = str(o.headline, 160);
    if (headline.length < 6 || seen.has(headline.toLowerCase())) continue;
    seen.add(headline.toLowerCase());
    const questions = (Array.isArray(o.questions) ? o.questions : []).map((q) => str(q, 200)).filter((q) => q.length > 5).slice(0, 2);
    cards.push({ headline, detail: str(o.detail, 700), questions, picture: str(o.picture, 60) });
    if (cards.length === 6) break;
  }
  return cards;
}

/** A ready-bank topic has facts but no cards: each fact becomes a card, the topic's questions shared out. */
export function cardsFromFacts(facts: string[], angles: string[]): FactCard[] {
  return facts.slice(0, 6).map((f, i) => ({
    headline: f,
    detail: '',
    questions: angles.length ? [angles[i % angles.length]] : [],
    picture: '',
  }));
}

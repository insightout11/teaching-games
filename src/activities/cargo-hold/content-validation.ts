/**
 * Cargo Hold â€” content contract enforcement.
 *
 * A generated deck is never trusted just because it parsed. Everything here runs on
 * both the generator output and the cached content before a deck reaches a classroom.
 */

import { isProfane } from '@/lib/profanity';
import type { CargoCard, CargoCardFamily, CargoPrompt } from './types';
import { CARGO_CARD_FAMILIES, } from './types';
import { composeSentence, isCardCompatible } from './deal';

export const MIN_CARDS = 24;
export const MIN_PROMPTS = 5;
export const MIN_FAMILIES = 3;
/** Keeps a card readable on a 390x844 student viewport without wrapping to a wall. */
export const MAX_CARD_TEXT_LENGTH = 72;
export const MAX_PROMPT_TEXT_LENGTH = 120;

export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
  cards: CargoCard[];
  prompts: CargoPrompt[];
}

function isFamily(value: unknown): value is CargoCardFamily {
  return typeof value === 'string' && (CARGO_CARD_FAMILIES as string[]).includes(value);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * A small set of unambiguous sentence-frame cues that generated metadata is not
 * allowed to contradict. This is intentionally conservative: it catches frames we
 * can prove require one family without pretending to be a full grammar parser.
 */
function requiredFamilyForPrompt(textBefore: string): CargoCardFamily | null {
  const cue = normalizeText(textBefore).toLowerCase();
  if (/\b(?:start|started|begin|began)\s+by$/.test(cue)) return 'action';
  if (/\bkept$/.test(cue)) return 'action';
  if (/\bbecause$/.test(cue)) return 'reason';
  if (/\bextremely$/.test(cue)) return 'description';
  return null;
}

/** Drops individually malformed or unsafe cards rather than failing the whole deck. */
export function sanitizeCards(raw: unknown): CargoCard[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const cards: CargoCard[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Record<string, unknown>;
    const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
    const text = typeof candidate.text === 'string' ? normalizeText(candidate.text) : '';
    const targetTerm = typeof candidate.targetTerm === 'string' ? candidate.targetTerm.trim() : '';
    const targetForm = typeof candidate.targetForm === 'string' ? candidate.targetForm.trim() : targetTerm;
    const meaning = typeof candidate.meaning === 'string' ? normalizeText(candidate.meaning) : '';

    if (!id || seen.has(id)) continue;
    if (!text || text.length > MAX_CARD_TEXT_LENGTH) continue;
    if (!targetTerm || !meaning) continue;
    if (!isFamily(candidate.family)) continue;
    if (isProfane(text) || isProfane(meaning)) continue;

    const tags = Array.isArray(candidate.compatiblePromptTags)
      ? candidate.compatiblePromptTags.filter((tag): tag is string => typeof tag === 'string')
      : undefined;
    // Default UNKNOWN provenance to safe-fallback, never to lesson-vocab. Defaulting
    // the other way made the grounding gate vacuous: a wholly generic generated deck
    // omits `source` entirely and would have scored as 100% lesson-grounded.
    const source: CargoCard['source'] =
      candidate.source === 'lesson-vocab'
        || candidate.source === 'lesson-expression'
        || candidate.source === 'safe-fallback'
        ? candidate.source
        : 'safe-fallback';

    seen.add(id);
    cards.push({
      id,
      family: candidate.family,
      text,
      targetTerm,
      targetForm: targetForm || targetTerm,
      meaning,
      ...(tags && tags.length > 0 ? { compatiblePromptTags: tags } : {}),
      ...(typeof candidate.emoji === 'string' && candidate.emoji ? { emoji: candidate.emoji } : {}),
      source,
    });
  }

  return cards;
}

export function sanitizePrompts(raw: unknown): CargoPrompt[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const prompts: CargoPrompt[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Record<string, unknown>;
    const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
    const textBefore = typeof candidate.textBefore === 'string' ? candidate.textBefore : '';
    const textAfter = typeof candidate.textAfter === 'string' ? candidate.textAfter : '';
    const promptTag = typeof candidate.promptTag === 'string' ? candidate.promptTag.trim() : '';
    const previewLabel = typeof candidate.previewLabel === 'string' ? normalizeText(candidate.previewLabel) : '';
    const explanation = typeof candidate.explanation === 'string' ? normalizeText(candidate.explanation) : '';

    if (!id || seen.has(id)) continue;
    if (!textBefore.trim()) continue;
    if ((textBefore + textAfter).length > MAX_PROMPT_TEXT_LENGTH) continue;
    if (!promptTag || !previewLabel) continue;
    if (isProfane(textBefore) || isProfane(textAfter)) continue;

    const families = Array.isArray(candidate.acceptedFamilies)
      ? candidate.acceptedFamilies.filter(isFamily)
      : [];
    if (families.length === 0) continue;

    seen.add(id);
    prompts.push({
      id,
      textBefore,
      ...(textAfter ? { textAfter } : {}),
      acceptedFamilies: families,
      promptTag,
      previewLabel,
      explanation,
    });
  }

  return prompts;
}

/**
 * Full deck contract. Returns the sanitized content alongside the verdict so a caller
 * can fall back wholesale rather than shipping a half-valid deck.
 */
export function validateDeck(rawCards: unknown, rawPrompts: unknown): DeckValidationResult {
  const cards = sanitizeCards(rawCards);
  const prompts = sanitizePrompts(rawPrompts);
  const errors: string[] = [];

  if (cards.length < MIN_CARDS) errors.push(`deck has ${cards.length} cards, needs ${MIN_CARDS}`);
  if (prompts.length < MIN_PROMPTS) errors.push(`deck has ${prompts.length} prompts, needs ${MIN_PROMPTS}`);

  const families = new Set(cards.map((card) => card.family));
  if (families.size < MIN_FAMILIES) {
    errors.push(`deck represents ${families.size} families, needs ${MIN_FAMILIES}`);
  }

  for (const prompt of prompts) {
    const requiredFamily = requiredFamilyForPrompt(prompt.textBefore);
    if (requiredFamily && (
      prompt.acceptedFamilies.length !== 1
      || prompt.acceptedFamilies[0] !== requiredFamily
    )) {
      errors.push(
        `prompt ${prompt.id} contradicts its grammar cue: expected ${requiredFamily}`,
      );
      continue;
    }
    const fitting = cards.filter((card) => isCardCompatible(card, prompt));
    if (fitting.length === 0) {
      errors.push(`prompt ${prompt.id} has no compatible card`);
      continue;
    }
    // Every prompt needs enough playable material for a whole class to choose from,
    // and the composed sentence has to actually read correctly.
    if (fitting.length < 4) errors.push(`prompt ${prompt.id} has only ${fitting.length} compatible cards`);
    const sample = composeSentence(prompt, fitting[0]);
    if (/\s{2,}/.test(sample) || /\s[,.!?]/.test(sample)) {
      errors.push(`prompt ${prompt.id} composes badly: "${sample}"`);
    }
  }

  return { valid: errors.length === 0, errors, cards, prompts };
}

/** Share of the deck that came from the lesson rather than the safe fallback. */
export function lessonGroundedRatio(cards: CargoCard[]): number {
  if (cards.length === 0) return 0;
  const grounded = cards.filter((card) => card.source !== 'safe-fallback').length;
  return grounded / cards.length;
}

/**
 * Cargo Hold â€” dealing, compatibility, hand repair, Repack, and draw.
 *
 * Pure functions only. Every entry point takes an explicit `random` so tests are
 * deterministic and the classroom behaviour stays reproducible.
 */

import type { CargoCard, CargoPrompt, CargoPlayerState } from './types';

export const HAND_SIZE = 6;
export const MIN_VALID_IN_HAND = 2;
export const MIN_FAMILIES_IN_HAND = 3;
export const MAX_REPACK_DISCARDS = 2;

type Random = () => number;

export function shuffle<T>(items: T[], random: Random = Math.random): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * Compatibility is declared metadata only â€” never inferred from the card text and
 * never judged by AI. A wildcard must name the prompt tags it genuinely fits.
 */
export function isCardCompatible(card: CargoCard, prompt: CargoPrompt): boolean {
  if (card.compatiblePromptTags?.includes(prompt.promptTag)) return true;
  if (card.family === 'wildcard') {
    // A wildcard with no declared tags is inert rather than universal.
    return false;
  }
  return prompt.acceptedFamilies.includes(card.family);
}

export function compatibleCards(cards: CargoCard[], prompt: CargoPrompt): CargoCard[] {
  return cards.filter((card) => isCardCompatible(card, prompt));
}

/** Normalizes spacing and punctuation when a card is dropped into a prompt. */
export function composeSentence(prompt: CargoPrompt, card: CargoCard): string {
  const before = prompt.textBefore ?? '';
  const after = prompt.textAfter ?? '';
  const joined = `${before}${card.text}${after}`;
  return joined
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([([])\s+/g, '$1')
    .replace(/\s+([)\]])/g, '$1')
    .trim();
}

function countFamilies(cards: CargoCard[]): number {
  return new Set(cards.map((card) => card.family)).size;
}

/**
 * Build one opening hand: unique cards, at least three families, and at least two
 * cards that fit round 1 â€” one safe choice and one with comic potential where the
 * deck allows it.
 */
export function dealHand(
  deck: CargoCard[],
  firstPrompt: CargoPrompt,
  excludeIds: string[] = [],
  random: Random = Math.random,
): CargoCard[] {
  const available = shuffle(
    deck.filter((card) => !excludeIds.includes(card.id)),
    random,
  );
  const valid = available.filter((card) => isCardCompatible(card, firstPrompt));
  const invalid = available.filter((card) => !isCardCompatible(card, firstPrompt));

  const hand: CargoCard[] = [];
  const take = (card: CargoCard | undefined) => {
    if (card && !hand.some((held) => held.id === card.id)) hand.push(card);
  };

  // Guarantee the playable floor first, then fill for family spread.
  valid.slice(0, MIN_VALID_IN_HAND).forEach(take);

  for (const card of available) {
    if (hand.length >= HAND_SIZE) break;
    if (countFamilies(hand) >= MIN_FAMILIES_IN_HAND) break;
    if (hand.some((held) => held.family === card.family)) continue;
    take(card);
  }

  // Keep a deliberate mix of fitting and non-fitting cards so the choice has stakes.
  for (const card of invalid) {
    if (hand.length >= HAND_SIZE - 1) break;
    take(card);
  }
  for (const card of available) {
    if (hand.length >= HAND_SIZE) break;
    take(card);
  }

  return hand.slice(0, HAND_SIZE);
}

export interface DealAllResult {
  hands: Record<string, CargoCard[]>;
}

export function dealAllHands(
  clientIds: string[],
  deck: CargoCard[],
  firstPrompt: CargoPrompt,
  random: Random = Math.random,
): DealAllResult {
  const hands: Record<string, CargoCard[]> = {};
  for (const clientId of clientIds) {
    // Hands may legitimately repeat card definitions across students; only a single
    // student holding a duplicate ID is disallowed.
    hands[clientId] = dealHand(deck, firstPrompt, [], random);
  }
  return { hands };
}

export interface CustomsRepairResult {
  hand: CargoCard[];
  refreshed: boolean;
}

/**
 * Round-start repair. Player choices make an up-front guarantee impossible, so every
 * hand is inspected at the start of each round: if fewer than two cards fit the new
 * prompt, swap the least useful cards out until two do.
 *
 * This is free â€” it never consumes the student's Repack and never moves points.
 */
export function repairHandForPrompt(
  hand: CargoCard[],
  deck: CargoCard[],
  prompt: CargoPrompt,
  random: Random = Math.random,
): CustomsRepairResult {
  const fitting = compatibleCards(hand, prompt);
  if (fitting.length >= MIN_VALID_IN_HAND) return { hand, refreshed: false };

  const heldIds = new Set(hand.map((card) => card.id));
  const replacements = shuffle(
    deck.filter((card) => !heldIds.has(card.id) && isCardCompatible(card, prompt)),
    random,
  );
  if (replacements.length === 0) return { hand, refreshed: false };

  const next = [...hand];
  const nonFitting = next
    .map((card, index) => ({ card, index }))
    .filter((entry) => !isCardCompatible(entry.card, prompt));

  let needed = MIN_VALID_IN_HAND - fitting.length;
  let swapped = false;
  for (const entry of nonFitting) {
    if (needed <= 0) break;
    const replacement = replacements.shift();
    if (!replacement) break;
    next[entry.index] = replacement;
    needed -= 1;
    swapped = true;
  }

  return { hand: next, refreshed: swapped };
}

/** After the result phase: the played card leaves and exactly one card is drawn. */
export function drawReplacement(
  hand: CargoCard[],
  playedCardId: string,
  deck: CargoCard[],
  nextPrompt: CargoPrompt | null,
  random: Random = Math.random,
): CargoCard[] {
  const remaining = hand.filter((card) => card.id !== playedCardId);
  const heldIds = new Set(remaining.map((card) => card.id));
  const pool = deck.filter((card) => !heldIds.has(card.id) && card.id !== playedCardId);
  if (pool.length === 0) return remaining;

  // Lean toward the previewed next family, but never so hard that the next choice
  // becomes deterministic â€” the student should still have a real decision.
  const preferred = nextPrompt
    ? pool.filter((card) => isCardCompatible(card, nextPrompt))
    : [];
  const alreadyFits = nextPrompt ? compatibleCards(remaining, nextPrompt).length : 0;
  const usePreferred = preferred.length > 0 && alreadyFits < MIN_VALID_IN_HAND;

  const source = usePreferred ? preferred : pool;
  const drawn = shuffle(source, random)[0];
  return drawn ? [...remaining, drawn] : remaining;
}

export interface RepackResult {
  hand: CargoCard[];
  applied: boolean;
}

/**
 * One Repack per student per game: discard up to two cards and draw replacements.
 * Idempotent â€” a repeated action for a player who has already repacked is a no-op,
 * which is what makes it safe to replay after a refresh.
 */
export function applyRepack(
  player: CargoPlayerState,
  hand: CargoCard[],
  discardCardIds: string[],
  deck: CargoCard[],
  prompt: CargoPrompt,
  random: Random = Math.random,
): RepackResult {
  if (player.repackUsed) return { hand, applied: false };

  const discards = discardCardIds
    .filter((id, index) => discardCardIds.indexOf(id) === index)
    .filter((id) => hand.some((card) => card.id === id))
    .slice(0, MAX_REPACK_DISCARDS);
  if (discards.length === 0) return { hand, applied: false };

  const kept = hand.filter((card) => !discards.includes(card.id));
  const heldIds = new Set(kept.map((card) => card.id));
  const pool = shuffle(
    deck.filter((card) => !heldIds.has(card.id) && !discards.includes(card.id)),
    random,
  );

  const next = [...kept];
  for (let i = 0; i < discards.length; i += 1) {
    const drawn = pool.shift();
    if (drawn) next.push(drawn);
  }

  // A Repack must never strand the student â€” repair applies afterwards too.
  const repaired = repairHandForPrompt(next, deck, prompt, random);
  return { hand: repaired.hand, applied: true };
}

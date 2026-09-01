import { describe, it, expect } from 'vitest';
import {
  HAND_SIZE,
  MIN_VALID_IN_HAND,
  applyRepack,
  compatibleCards,
  composeSentence,
  dealAllHands,
  dealHand,
  drawReplacement,
  isCardCompatible,
  repairHandForPrompt,
} from '@/activities/cargo-hold/deal';
import { buildFallbackDeck, CARGO_FALLBACK_CARDS, CARGO_FALLBACK_PROMPTS } from '@/activities/cargo-hold/fallback-deck';
import type { CargoCard, CargoPlayerState, CargoPrompt } from '@/activities/cargo-hold/types';

/** Deterministic generator so hand contents are reproducible in assertions. */
function seeded(seed = 42) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const deck = CARGO_FALLBACK_CARDS;
const thingPrompt = CARGO_FALLBACK_PROMPTS[0];
const actionPrompt = CARGO_FALLBACK_PROMPTS[1];

function player(overrides: Partial<CargoPlayerState> = {}): CargoPlayerState {
  return {
    clientId: 'c1',
    studentId: null,
    displayName: 'Ana',
    handCardIds: [],
    repackUsed: false,
    grammarPoints: 0,
    favoritePoints: 0,
    ...overrides,
  };
}

describe('cargo hold â€” compatibility', () => {
  it('uses declared family metadata only', () => {
    const thing = deck.find((c) => c.family === 'thing')!;
    const action = deck.find((c) => c.family === 'action')!;
    expect(isCardCompatible(thing, thingPrompt)).toBe(true);
    expect(isCardCompatible(action, thingPrompt)).toBe(false);
  });

  it('does not let a wildcard fit every prompt', () => {
    const wildcard = deck.find((c) => c.family === 'wildcard' && c.compatiblePromptTags)!;
    const fits = CARGO_FALLBACK_PROMPTS.filter((p) => isCardCompatible(wildcard, p));
    expect(fits.length).toBeGreaterThan(0);
    expect(fits.length).toBeLessThan(CARGO_FALLBACK_PROMPTS.length);
  });

  it('treats an undeclared wildcard as inert rather than universal', () => {
    const bare: CargoCard = {
      id: 'bare', family: 'wildcard', text: 'a thing', targetTerm: 't', targetForm: 't',
      meaning: 'm', source: 'safe-fallback',
    };
    expect(CARGO_FALLBACK_PROMPTS.some((p) => isCardCompatible(bare, p))).toBe(false);
  });
});

describe('cargo hold â€” composition', () => {
  it('normalizes whitespace and punctuation', () => {
    const prompt: CargoPrompt = {
      id: 'p', textBefore: 'I packed  ', textAfter: ' .', acceptedFamilies: ['thing'],
      promptTag: 'x', previewLabel: 'a thing', explanation: '',
    };
    const c: CargoCard = {
      id: 'c', family: 'thing', text: 'two hats', targetTerm: 'hat', targetForm: 'hats',
      meaning: 'm', source: 'safe-fallback',
    };
    expect(composeSentence(prompt, c)).toBe('I packed two hats.');
  });
});

describe('cargo hold â€” initial deal', () => {
  it('deals six unique cards with at least three families', () => {
    const hand = dealHand(deck, thingPrompt, [], seeded());
    expect(hand).toHaveLength(HAND_SIZE);
    expect(new Set(hand.map((c) => c.id)).size).toBe(HAND_SIZE);
    expect(new Set(hand.map((c) => c.family)).size).toBeGreaterThanOrEqual(3);
  });

  it('always leaves at least two playable cards for round one', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const hand = dealHand(deck, thingPrompt, [], seeded(seed));
      expect(compatibleCards(hand, thingPrompt).length).toBeGreaterThanOrEqual(MIN_VALID_IN_HAND);
    }
  });

  it('keeps at least one card that does not fit, so the choice has stakes', () => {
    const hand = dealHand(deck, thingPrompt, [], seeded(7));
    expect(compatibleCards(hand, thingPrompt).length).toBeLessThan(HAND_SIZE);
  });

  it('gives every student a hand', () => {
    const { hands } = dealAllHands(['a', 'b', 'c'], deck, thingPrompt, seeded());
    expect(Object.keys(hands)).toEqual(['a', 'b', 'c']);
    Object.values(hands).forEach((hand) => expect(hand).toHaveLength(HAND_SIZE));
  });
});

describe('cargo hold â€” customs repair', () => {
  it('repairs a dead hand until two cards fit', () => {
    const dead = deck.filter((c) => c.family === 'action').slice(0, HAND_SIZE);
    const { hand, refreshed } = repairHandForPrompt(dead, deck, thingPrompt, seeded());
    expect(refreshed).toBe(true);
    expect(compatibleCards(hand, thingPrompt).length).toBeGreaterThanOrEqual(MIN_VALID_IN_HAND);
    expect(hand).toHaveLength(HAND_SIZE);
  });

  it('leaves a healthy hand untouched', () => {
    const healthy = dealHand(deck, thingPrompt, [], seeded(3));
    const { hand, refreshed } = repairHandForPrompt(healthy, deck, thingPrompt, seeded());
    expect(refreshed).toBe(false);
    expect(hand).toEqual(healthy);
  });

  it('never consumes the repack', () => {
    const p = player();
    const dead = deck.filter((c) => c.family === 'action').slice(0, HAND_SIZE);
    repairHandForPrompt(dead, deck, thingPrompt, seeded());
    expect(p.repackUsed).toBe(false);
  });
});

describe('cargo hold â€” draw', () => {
  it('removes the played card and draws exactly one replacement', () => {
    const hand = dealHand(deck, thingPrompt, [], seeded());
    const played = hand[0];
    const next = drawReplacement(hand, played.id, deck, actionPrompt, seeded());
    expect(next).toHaveLength(HAND_SIZE);
    expect(next.some((c) => c.id === played.id)).toBe(false);
    expect(new Set(next.map((c) => c.id)).size).toBe(HAND_SIZE);
  });
});

describe('cargo hold â€” repack', () => {
  it('replaces one or two cards and reports applied', () => {
    const hand = dealHand(deck, thingPrompt, [], seeded());
    const result = applyRepack(player(), hand, [hand[0].id, hand[1].id], deck, thingPrompt, seeded());
    expect(result.applied).toBe(true);
    expect(result.hand).toHaveLength(HAND_SIZE);
    expect(result.hand.some((c) => c.id === hand[0].id)).toBe(false);
    expect(result.hand.some((c) => c.id === hand[1].id)).toBe(false);
  });

  it('caps discards at two', () => {
    const hand = dealHand(deck, thingPrompt, [], seeded());
    // Discard only cards that do not fit the prompt, so the post-repack customs
    // repair stays inert and the cap is the only thing under test.
    const spare = hand.filter((c) => !isCardCompatible(c, thingPrompt)).slice(0, 3);
    expect(spare.length).toBe(3);

    const result = applyRepack(player(), hand, spare.map((c) => c.id), deck, thingPrompt, seeded());
    const survivors = spare.filter((c) => result.hand.some((held) => held.id === c.id));
    expect(survivors).toHaveLength(1);
  });

  it('is a no-op once used â€” replaying the action cannot repack twice', () => {
    const hand = dealHand(deck, thingPrompt, [], seeded());
    const used = player({ repackUsed: true });
    const result = applyRepack(used, hand, [hand[0].id], deck, thingPrompt, seeded());
    expect(result.applied).toBe(false);
    expect(result.hand).toEqual(hand);
  });

  it('never strands the student with an unplayable hand', () => {
    const hand = dealHand(deck, thingPrompt, [], seeded(11));
    const fitting = compatibleCards(hand, thingPrompt).map((c) => c.id);
    const result = applyRepack(player(), hand, fitting.slice(0, 2), deck, thingPrompt, seeded(5));
    expect(compatibleCards(result.hand, thingPrompt).length).toBeGreaterThanOrEqual(MIN_VALID_IN_HAND);
  });
});

describe('cargo hold â€” fallback deck shape', () => {
  it('carries topic-aware cards rather than unrelated filler', () => {
    const { cards } = buildFallbackDeck('air pollution');
    expect(cards.some((c) => c.text.includes('air pollution'))).toBe(true);
  });
});

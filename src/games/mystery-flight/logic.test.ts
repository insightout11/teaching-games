import { describe, expect, it } from 'vitest';
import { buildClueDeck, distancePoints, earlyBonus, haversineKm, mostDistantPair, pickDestinations } from './logic';

const clues = [
  { order: 6, kind: 'giveaway', text: 'The capital of Thailand.' },
  { order: 1, kind: 'weather', text: 'Warm all year.' },
  { order: 2, kind: 'food', text: 'Noodles.' },
  { order: 3, kind: 'culture', text: 'A wai greeting.' },
];
const photos = [{ url: 'spoiler.jpg', alt: 'Temple sign', spoilerRisk: 'high' as const }, { url: 'street.jpg', alt: 'Street' }];

describe('Mystery Flight logic', () => {
  it('orders clues: first text, photo, rest, giveaway last (mixed)', () => {
    const deck = buildClueDeck(clues, photos, 'mixed');
    expect(deck.map((c) => (c.kind === 'photo' ? `photo:${c.url}` : c.category))).toEqual(['weather', 'photo:street.jpg', 'food', 'culture', 'giveaway']);
  });

  it('skips the photo in text mode and skips high-spoiler photos', () => {
    expect(buildClueDeck(clues, photos, 'text').some((c) => c.kind === 'photo')).toBe(false);
    expect(buildClueDeck(clues, [photos[0]], 'photo-first').some((c) => c.kind === 'photo')).toBe(false);
  });

  it('scores distance and only rewards early pins that are close', () => {
    expect(distancePoints(100)).toBe(5);
    expect(distancePoints(2500)).toBe(1);
    expect(earlyBonus(1, 6, 100)).toBe(5);
    expect(earlyBonus(4, 6, 800)).toBe(2);
    expect(earlyBonus(1, 6, 5000)).toBe(0); // wild early guess
  });

  it('finds the most distant pair', () => {
    const pins = [{ id: 'a', lat: 51.5, lng: -0.1 }, { id: 'b', lat: 48.9, lng: 2.3 }, { id: 'c', lat: -33.9, lng: 151.2 }];
    const pair = mostDistantPair(pins)!;
    expect(pair.map((p) => p.id).sort()).toEqual(['a', 'c']);
    expect(Math.round(haversineKm(pins[0], pins[1]))).toBeGreaterThan(300);
  });

  it('prefers destinations not used recently', () => {
    const picked = pickDestinations(['x', 'y', 'z'], 2, ['x'], () => 0.5);
    expect(picked).not.toContain('x');
    expect(picked).toHaveLength(2);
  });
});

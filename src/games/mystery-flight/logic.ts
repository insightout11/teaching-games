/**
 * Mystery Flight: pure game logic (no React, no data imports) so it can be tested.
 * The class's plane flies toward a secret city; clues arrive one at a time; each
 * student pins once, and pinning early (and close) scores a bonus.
 */

export type ClueStyle = 'mixed' | 'text' | 'photo-first';

export type MysteryClue =
  | { kind: 'photo'; url: string; alt: string; credit?: string }
  | { kind: 'text'; category: string; text: string; giveaway?: boolean };

export interface PackClue { order: number; kind: string; text: string }
export interface PhotoOption { url: string; alt: string; credit?: string; spoilerRisk?: 'low' | 'medium' | 'high' }

/**
 * Clue order: an optional low-spoiler photo first (mixed / photo-first), then the
 * pack's text clues in order, and the giveaway ("the capital of…") always last.
 */
export function buildClueDeck(packClues: PackClue[], photos: PhotoOption[], style: ClueStyle): MysteryClue[] {
  const sorted = [...packClues].sort((a, b) => a.order - b.order);
  const text = sorted.filter((c) => c.kind !== 'giveaway').map((c): MysteryClue => ({ kind: 'text', category: c.kind, text: c.text }));
  const giveaway = sorted.filter((c) => c.kind === 'giveaway').map((c): MysteryClue => ({ kind: 'text', category: c.kind, text: c.text, giveaway: true }));
  const photo = photos.find((p) => p.spoilerRisk !== 'high');
  const photoClue: MysteryClue[] = style !== 'text' && photo ? [{ kind: 'photo', url: photo.url, alt: photo.alt, credit: photo.credit }] : [];
  // Mixed: the photo arrives after the first text clue (a picture straight away is often too easy).
  if (style === 'mixed' && photoClue.length && text.length) return [text[0], ...photoClue, ...text.slice(1), ...giveaway];
  return [...photoClue, ...text, ...giveaway];
}

/** Distance points: 5 very close, 3 close, 1 same part of the world, 0 far. */
export function distancePoints(km: number, easy = false): number {
  const [standout, close, region] = easy ? [300, 1500, 4000] : [150, 1000, 3000];
  if (!Number.isFinite(km) || km < 0) return 0;
  if (km <= standout) return 5;
  if (km <= close) return 3;
  if (km <= region) return 1;
  return 0;
}

/**
 * Early-pin bonus: one point per clue still unseen when you pinned (max 5), but
 * only for a close pin, so a wild early guess never pays.
 */
export function earlyBonus(cluesSeen: number, totalClues: number, km: number, easy = false): number {
  if (distancePoints(km, easy) < 3) return 0;
  return Math.max(0, Math.min(5, totalClues - cluesSeen));
}

/** Great-circle distance in km. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "Hear both sides": the two pins furthest apart (the most interesting disagreement). */
export function mostDistantPair<T extends { lat: number; lng: number }>(pins: T[]): [T, T] | null {
  let best: [T, T] | null = null;
  let bestKm = -1;
  for (let i = 0; i < pins.length; i++) {
    for (let j = i + 1; j < pins.length; j++) {
      const km = haversineKm(pins[i], pins[j]);
      if (km > bestKm) { bestKm = km; best = [pins[i], pins[j]]; }
    }
  }
  return best;
}

/** Pick N destinations, avoiding recently used ones when possible. */
export function pickDestinations(ids: string[], count: number, recent: string[], rand: () => number = Math.random): string[] {
  const fresh = ids.filter((id) => !recent.includes(id));
  const pool = fresh.length >= count ? fresh : ids;
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, count);
}

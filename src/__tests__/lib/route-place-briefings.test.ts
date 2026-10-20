import { describe, expect, it } from 'vitest';
import places from '@/data/route-place-briefings.json';
import audit from '../../../docs/route-places.json';
import { cleanFactCards } from '@/lib/live-room/fact-cards';
import { findRoutePlaceBriefing, findTopicBriefing, routePlaceKey, topicBriefingLevel } from '@/lib/topic-briefings';

const words = (s: string) => s.trim().split(/\s+/).length;
// Decimal points in heights are not sentence boundaries.
const sentences = (s: string) => s.split(/[.!?](?:\s+|$)/).filter(s => s.trim());

describe('checked route-place cards', () => {
  it.each(places.map(p => [p.title, p] as const))('%s has complete level cards without runtime truncation', (_title, place) => {
    expect(Object.keys(place.levels).sort()).toEqual(['A1', 'B1']);
    expect(place.id).toMatch(/^route-place-/);
    expect(place.sources.length).toBeGreaterThan(0);
    for (const level of ['A1', 'B1'] as const) {
      const cards = place.levels[level].cards;
      expect(cards).toHaveLength(level === 'A1' ? 4 : 5);
      expect(cleanFactCards(cards)).toEqual(cards);
      for (const card of cards) {
        expect(words(card.headline)).toBeLessThanOrEqual(level === 'A1' ? 8 : 14);
        expect(sentences(card.detail)).toHaveLength(level === 'A1' ? 2 : 3);
        if (level === 'A1') sentences(card.detail).forEach(s => expect(words(s)).toBeLessThanOrEqual(18));
        expect(card.questions).toHaveLength(2);
        card.questions.forEach(q => { expect(q.length).toBeGreaterThan(5); expect(q).toMatch(/\?$/); });
        expect(words(card.picture)).toBeGreaterThanOrEqual(2);
        expect(words(card.picture)).toBeLessThanOrEqual(5);
      }
    }
  });

  it('has no IDs or title/alias identities shared by different entries', () => {
    const ids = new Set<string>(), identities = new Map<string, string>();
    for (const place of places) {
      expect(ids.has(place.id), place.id).toBe(false);
      ids.add(place.id);
      for (const alias of [place.title, ...place.aliases]) {
        const key = routePlaceKey(alias);
        expect(identities.get(key) ?? place.id, alias).toBe(place.id);
        identities.set(key, place.id);
        expect(findRoutePlaceBriefing(`THE ${alias.replace(/^the /i, '').toUpperCase()}`)?.id).toBe(place.id);
      }
    }
  });

  it('covers the audit selection, all destinations and every crossed outline', () => {
    expect(audit.places.length).toBeGreaterThan(0);
    for (const place of audit.places) {
      if (place.selected || place.kinds.includes('country') || place.kinds.includes('destination city')) {
        expect(findRoutePlaceBriefing(place.title), place.title).not.toBeNull();
        place.aliases.forEach(alias => expect(findRoutePlaceBriefing(alias), alias).not.toBeNull());
      }
    }
    for (const entry of places) expect(audit.places.some(p => p.selected && findRoutePlaceBriefing(p.title)?.id === entry.id)).toBe(true);
    for (const ambiguous of audit.metadata.ambiguousExcluded) expect(findRoutePlaceBriefing(ambiguous)).toBeNull();
  });

  it('matches only explicit titles/aliases, case and a leading article', () => {
    expect(findRoutePlaceBriefing('  THE aNdEs ')?.title).toBe('Andes');
    for (const title of ['Andes!', 'Ande', 'Paris suburbs', 'Pariss', 'the the Andes', '']) {
      expect(findRoutePlaceBriefing(title), title).toBeNull();
    }
    expect(findTopicBriefing('Paris suburbs')).toBeNull();
    expect(findTopicBriefing('Paris', [])).toBeNull();
  });

  it('uses A1 only for A1 classes and B1 for every other difficulty', () => {
    const place = findRoutePlaceBriefing('Paris')!;
    for (const level of ['Beginner', 'A1']) expect(topicBriefingLevel(place, level)).toBe(place.levels.A1);
    for (const level of ['Easy', 'Intermediate', 'Advanced', 'Expert', 'B1', 'unknown']) expect(topicBriefingLevel(place, level)).toBe(place.levels.B1);
  });

  it('qualifies ambiguous city and country photo names', () => {
    expect(findRoutePlaceBriefing('Lagos')?.levels.A1.cards?.[0].picture).toBe('Lagos Nigeria');
    expect(findRoutePlaceBriefing('Santiago')?.levels.A1.cards?.[0].picture).toBe('Santiago Chile');
    expect(findRoutePlaceBriefing('Georgia')?.levels.A1.cards?.[0].picture).toBe('Georgia Caucasus landscape');
  });
});

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
        if (level === 'A1') expect(sentences(card.detail)).toHaveLength(2);
        else {
          expect(sentences(card.detail).length).toBeGreaterThanOrEqual(2);
          expect(sentences(card.detail).length).toBeLessThanOrEqual(3);
        }
        expect(card.detail.toLowerCase().startsWith(card.headline.toLowerCase())).toBe(false);
        expect(card.headline + ' ' + card.detail).not.toMatch(/is a city here|degrees (north|south)|estimated population|dated estimate|people lived here/i);
        if (level === 'A1') sentences(card.detail).forEach(s => expect(words(s)).toBeLessThanOrEqual(12));
        expect(card.questions).toHaveLength(2);
        card.questions.forEach(q => { expect(q.length).toBeGreaterThan(5); expect(q).toMatch(/\?$/); });
        expect(words(card.picture)).toBeGreaterThanOrEqual(2);
        expect(words(card.picture)).toBeLessThanOrEqual(5);
        expect(card.picture).not.toMatch(/\blandscape\b/i);
      }
      expect(new Set(cards.map(c => c.picture.trim().toLowerCase())).size).toBe(cards.length);
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

  it('limits identical question text to three places, counting both levels together', () => {
    const used = new Map<string, Set<string>>();
    for (const place of places) for (const level of ['A1', 'B1'] as const) for (const card of place.levels[level].cards) {
      for (const text of card.questions) {
        const key = text.toLowerCase().replace(/[’']/g, '').replace(/[?!.:,;]/g, '').replace(/\s+/g, ' ').trim();
        const titles = used.get(key) ?? new Set<string>();
        titles.add(place.title); used.set(key, titles);
      }
    }
    used.forEach((titles, question) => expect(titles.size, question).toBeLessThanOrEqual(3));
  });

  it('contains no replacement characters in the bank or its editable input', async () => {
    const { readFileSync } = await import('node:fs');
    expect(JSON.stringify(places)).not.toContain('\uFFFD');
    expect(readFileSync('scripts/dev/data/route-place-editorial.tsv', 'utf8')).not.toContain('\uFFFD');
  });

  it('uses subject searches for cultural and geographic cards', () => {
    const songkran = findRoutePlaceBriefing('Thailand')!.levels.A1.cards!.find(c => c.headline.includes('Songkran'))!;
    expect(songkran.picture).toBe('Songkran water festival Thailand');
    expect(songkran.questions).toContain('Do you like Songkran water games?');
    const yushan = findRoutePlaceBriefing('Taiwan')!.levels.B1.cards!.find(c => c.headline.includes('Yushan'))!;
    expect(yushan.picture).toBe('Yushan summit Taiwan');
  });

  it('qualifies photos when a regional fact is used for a particular country', () => {
    for (const [place, query] of [
      ['Pakistan', 'Indus Pakistan floodplain sediment'],
      ['Greece', 'Crete Mediterranean island coast'],
      ['Uruguay', 'Montevideo Uruguay tango dancers'],
      ['Switzerland', 'Matterhorn Zermatt Switzerland summit'],
      ['Equatorial Guinea', 'Pico Basile Bioko volcano'],
    ]) {
      expect(findRoutePlaceBriefing(place)!.levels.B1.cards!.some(card => card.picture === query), place).toBe(true);
    }
  });
});

import { describe, expect, it } from 'vitest';
import places from '@/data/route-place-briefings.json';
import audit from '../../../docs/route-places.json';
import { cleanFactCards } from '@/lib/live-room/fact-cards';
import { findRoutePlaceBriefing, findTopicBriefing, routePlaceKey, topicBriefingLevel } from '@/lib/topic-briefings';
import basics from '../../../scripts/dev/data/route-place-country-basics.json';
import photoSources from '../../../scripts/dev/data/route-place-photo-sources.json';
import { hasRepeatedDetailSentence, isSimpleA1Question } from '../../../scripts/dev/build-route-place-cards';

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
      // Room integration handles the new static photo fields separately. The
      // existing cleaner must still preserve all authored prose and searches.
      expect(cleanFactCards(cards)).toEqual(cards.map(({ headline, detail, questions, picture }) => ({ headline, detail, questions, picture })));
      for (const card of cards) {
        expect(words(card.headline)).toBeLessThanOrEqual(level === 'A1' ? 8 : 14);
        if (level === 'A1') expect(sentences(card.detail)).toHaveLength(2);
        else {
          expect(sentences(card.detail).length).toBeGreaterThanOrEqual(2);
          expect(sentences(card.detail).length).toBeLessThanOrEqual(3);
          expect(hasRepeatedDetailSentence(card.detail), `${place.title}: ${card.detail}`).toBe(false);
        }
        expect(card.detail.toLowerCase().startsWith(card.headline.toLowerCase())).toBe(false);
        expect(card.headline + ' ' + card.detail).not.toMatch(/is a city here|degrees (north|south)|estimated population|dated estimate|people lived here/i);
        if (level === 'A1') sentences(card.detail).forEach(s => expect(words(s)).toBeLessThanOrEqual(12));
        expect(card.questions).toHaveLength(2);
        card.questions.forEach(q => { expect(q.length).toBeGreaterThan(5); expect(q).toMatch(/\?$/); });
        if (level === 'A1') for (const question of card.questions) {
          expect(words(question), question).toBeLessThanOrEqual(8);
          expect(question).not.toMatch(/how could|why might/i);
          expect(isSimpleA1Question(question), question).toBe(true);
        }
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

  it.each(places)('$title has valid optional exact photos, shared only by the same card at both levels', place => {
    const owners = new Map<string, number>();
    const headlines = new Map<string, string>();
    for (const level of ['A1', 'B1'] as const) place.levels[level].cards.forEach((card, index) => {
      expect(typeof card.pictureFile).toBe('string');
      expect(typeof card.pictureLicense).toBe('string');
      if (!card.pictureFile) {
        expect(card.pictureLicense).toBe('');
        return;
      }
      expect(card.pictureFile.startsWith('File:')).toBe(true);
      expect(card.pictureFile).toMatch(/\.(?:jpe?g|png)$/i);
      expect(card.pictureFile).toBe(card.pictureFile.trim());
      expect(card.pictureLicense).toMatch(/^(?:CC0|Public domain|CC BY(?:-SA)? (?:1\.0|2\.0|2\.5|3\.0|4\.0)(?: [a-z]{2})?)$/);
      const file = card.pictureFile.normalize('NFC').replace(/_/g, ' ').replace(/\s+/g, ' ').toLowerCase();
      expect(owners.get(file) ?? index).toBe(index);
      owners.set(file, index);
      expect(headlines.get(card.headline) ?? file).toBe(file);
      headlines.set(card.headline, file);
    });
  });

  it('uses one exact photo pair for a shared headline throughout the bank, including blanks', () => {
    const shared = new Map<string, readonly string[]>();
    for (const place of places) for (const level of ['A1', 'B1'] as const) for (const card of place.levels[level].cards) {
      const headline = card.headline.toLowerCase().replace(/[’']/g, '').replace(/[?!.,:;]+/g, '').trim().replace(/\s+/g, ' ');
      const pair = [card.pictureFile, card.pictureLicense] as const;
      expect(shared.get(headline) ?? pair, `${place.title}: ${headline}`).toEqual(pair);
      shared.set(headline, pair);
    }
  });

  it('keeps a Commons source and matching licence for every selected photograph', () => {
    const sources = new Map(photoSources.photos.map(photo => [photo.pictureFile, photo]));
    expect(sources.size).toBe(photoSources.photos.length);
    const used = new Set<string>();
    for (const place of places) for (const level of ['A1', 'B1'] as const) for (const card of place.levels[level].cards) {
      if (!card.pictureFile) continue;
      used.add(card.pictureFile);
      const source = sources.get(card.pictureFile);
      expect(source, `${place.title}: ${card.headline}`).toBeDefined();
      expect(source?.pictureLicense).toBe(card.pictureLicense);
      const url = new URL(source!.filePage);
      expect(url.origin).toBe('https://commons.wikimedia.org');
      expect(decodeURIComponent(url.pathname).replace(/_/g, ' ')).toBe(`/wiki/${card.pictureFile}`);
      expect(source!.reviewNote.trim().length).toBeGreaterThan(0);
    }
    expect(Array.from(sources.keys()).sort()).toEqual(Array.from(used).sort());
  });

  it('records a reason for every editorial card left without an exact photo', () => {
    const expected = places.flatMap(place => place.levels.B1.cards.flatMap((card, index) => card.pictureFile ? [] : [{ place: place.title, card: index + 1, headline: card.headline }]));
    expect(photoSources.omissions.map(({ place, card, headline }) => ({ place, card, headline }))).toEqual(expected);
    for (const omitted of photoSources.omissions) expect(omitted.reason.trim().length).toBeGreaterThan(0);
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
    const songkran = findRoutePlaceBriefing('Thailand')!.levels.B1.cards!.find(c => c.headline.includes('Songkran'))!;
    expect(songkran.picture).toBe('Songkran water festival Thailand');
    expect(songkran.questions).toContain('How do people celebrate New Year where you live?');
    const yushan = findRoutePlaceBriefing('Taiwan')!.levels.B1.cards!.find(c => c.headline.includes('Yushan'))!;
    expect(yushan.picture).toBe('Yushan summit Taiwan');
  });

  it.each(basics.places)('$title keeps its reviewed capital or qualified place role at both levels', entry => {
    const place = findRoutePlaceBriefing(entry.title)!;
    for (const level of ['A1', 'B1'] as const) {
      const prose = place.levels[level].cards!.map(c => c.headline + ' ' + c.detail).join(' ').toLowerCase();
      expect(entry.capital.terms.some(term => prose.includes(term.toLowerCase())), `${entry.title} ${level}`).toBe(true);
    }
  });

  it('teaches Beijing and pandas in China, including the beginner cards', () => {
    for (const level of ['A1', 'B1'] as const) {
      const cards = findRoutePlaceBriefing('China')!.levels[level].cards!;
      const prose = cards.map(c => c.headline + ' ' + c.detail).join(' ');
      expect(prose).toContain('Beijing');
      expect(prose).toMatch(/panda/i);
      expect(prose).toMatch(/jiaozi/i);
      expect(prose).toContain('Great Wall');
    }
  });

  it('uses the 2026 Equatorial Guinea capital without turning polar outlines into countries', () => {
    for (const level of ['A1', 'B1'] as const) {
      const text = (title: string) => findRoutePlaceBriefing(title)!.levels[level].cards!.map(c => c.headline + ' ' + c.detail).join(' ');
      expect(text('Equatorial Guinea')).toContain('Ciudad de la Paz is the capital');
      expect(text('Antarctica')).toContain('Antarctica has no capital city');
      expect(text('French Southern and Antarctic Lands')).toContain('Island offices are in Saint-Pierre');
    }
  });

  it('keeps capital declarations distinct from government locations', () => {
    for (const level of ['A1', 'B1'] as const) {
      const prose = (title: string) => findRoutePlaceBriefing(title)!.levels[level].cards!.map(c => c.headline + ' ' + c.detail).join(' ');
      expect(prose('Palestine')).toContain('Palestine names East Jerusalem as its capital');
      expect(prose('Palestine')).toContain('Ramallah');
      expect(prose('Israel')).toContain('Israel names Jerusalem as its capital');
      expect(prose('South Africa')).toContain('Pretoria is an administrative capital');
      expect(prose('Eswatini')).toContain('Mbabane is an administrative capital');
      expect(prose('Western Sahara')).toContain('Laayoune is a major desert city');
    }
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

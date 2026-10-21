import { describe, expect, it } from 'vitest';
import { icons } from 'lucide-react';
import { LENS_BRIEFS } from '@/data/lenses/briefs';
import { LENS_VOCABULARY } from '@/data/lenses/vocab';
import { LENS_WHERE_NEXT } from '@/data/lenses/where-next';
import places from '@/data/lenses/place-cards.json';
import audit from '../../../docs/route-places.json';
import { cleanFactCards } from '@/lib/live-room/fact-cards';

const words = (text: string) => text.trim().split(/\s+/).length;
const sentences = (text: string) => text.split(/[.!?](?:\s+|$)/).filter(s => s.trim());
// Match the route-place bank's normalisation, including curly apostrophes.
const key = (text: string) => text.toLowerCase().replace(/[’']/g, '').replace(/[?!.:,;]/g, '').replace(/\s+/g, ' ').trim();
const adultLabels = ['Films and TV', 'Music', 'Sport', 'Food', 'News', 'Politics and society', 'Science and tech', 'History', 'Art and design', 'Nature and environment', 'Money and business', 'Games', 'Travel'];
const kidLabels = ['Animals', 'Space', 'Dinosaurs and fossils', 'Cartoons and stories', 'Yummy food', 'Sport and games', 'Inventions and robots', 'Weather and nature'];

describe('lens writer content', () => {
  it('covers every concept lens with stable, unique identities', () => {
    expect(LENS_BRIEFS.filter(l => !l.kid).map(l => l.label).sort()).toEqual(adultLabels.slice().sort());
    expect(LENS_BRIEFS.filter(l => l.kid).map(l => l.label).sort()).toEqual(kidLabels.slice().sort());
    expect(new Set(LENS_BRIEFS.map(l => l.id)).size).toBe(LENS_BRIEFS.length);
    expect(Object.keys(LENS_VOCABULARY).sort()).toEqual(LENS_BRIEFS.map(l => l.id).sort());
    expect(Object.keys(LENS_WHERE_NEXT).sort()).toEqual(LENS_BRIEFS.map(l => l.id).sort());
  });

  it.each(LENS_BRIEFS)('$id has a complete writer brief and a real Lucide icon', lens => {
    expect(lens.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
    expect(lens.label.trim().length).toBeGreaterThan(0);
    expect(Object.prototype.hasOwnProperty.call(icons, lens.icon), lens.icon).toBe(true);
    expect(typeof lens.kid).toBe('boolean');
    expect(lens.perClass).toBe(lens.id === 'news' || lens.id === 'politics');
    expect(sentences(lens.brief).length).toBeGreaterThanOrEqual(3);
    expect(sentences(lens.brief).length).toBeLessThanOrEqual(5);
    expect(lens.goodExample).not.toBe(lens.badExample);
    for (const example of [lens.goodExample, lens.badExample]) {
      expect(example.trim().length).toBeGreaterThan(5);
      expect(words(example)).toBeLessThanOrEqual(18);
    }
    if (lens.kid) {
      for (const instruction of ['short', 'friendly', 'picture-first', 'A1', 'never ranked', 'one student at a time', 'news, politics, war or disasters']) {
        expect(lens.brief).toContain(instruction);
      }
    }
    if (lens.perClass) {
      for (const instruction of ['teens only', 'teacher enables', 'off by default', 'neutral', 'more than one viewpoint', 'nothing graphic', 'no election predictions', 'do not tell students what to think', 'jokes about living politicians']) {
        expect(lens.brief).toContain(instruction);
      }
    }
  });

  it('requires dated news rather than pretending an old report is live', () => {
    const news = LENS_BRIEFS.find(l => l.id === 'news')!;
    expect(news.brief).toContain('show its source date on the card');
    expect(news.brief).toContain('never presenting an old report as live');
  });

  it.each(LENS_BRIEFS)('$id has levelled vocabulary, definitions, examples and speaking stems', lens => {
    const vocabulary = LENS_VOCABULARY[lens.id];
    expect(Object.keys(vocabulary).sort()).toEqual(lens.kid ? ['A1'] : ['A1', 'B1']);
    for (const level of [vocabulary.A1, vocabulary.B1].filter(l => l !== undefined)) {
      expect(level!.words.length).toBeGreaterThanOrEqual(16);
      expect(level!.words.length).toBeLessThanOrEqual(20);
      expect(new Set(level!.words.map(w => key(w.word))).size).toBe(level!.words.length);
      expect(level!.stems).toHaveLength(6);
      expect(new Set(level!.stems.map(key)).size).toBe(level!.stems.length);
      level!.stems.forEach(stem => expect(stem).toMatch(/…$/));
      for (const word of level!.words) {
        expect(word.word.trim().length).toBeGreaterThan(0);
        expect(word.definition.trim().length).toBeGreaterThan(3);
        expect(word.definition).not.toMatch(/[\r\n]/);
        expect(word.example.trim().length).toBeGreaterThan(8);
        expect(word.example).toMatch(/[.?!]$/);
        if (lens.kid) {
          expect(words(word.picture!)).toBeGreaterThanOrEqual(2);
          expect(words(word.picture!)).toBeLessThanOrEqual(4);
          expect(word.picture).not.toMatch(/poster|screenshot|fan art|disaster|war|election/i);
        } else expect(word.picture).toBeUndefined();
      }
    }
    if (!lens.kid) {
      expect(vocabulary.B1!.stems).not.toEqual(vocabulary.A1.stems);
      expect(vocabulary.B1!.words.map(w => w.definition)).not.toEqual(vocabulary.A1.words.map(w => w.definition));
    }
  });

  it.each(LENS_BRIEFS)('$id has distinct, explained follow-on topics', lens => {
    const seeds = LENS_WHERE_NEXT[lens.id];
    expect(seeds.length).toBeGreaterThanOrEqual(lens.kid ? 15 : 25);
    expect(new Set(seeds.map(s => key(s.topic))).size).toBe(seeds.length);
    for (const seed of seeds) {
      expect(seed.topic.trim().length).toBeGreaterThan(2);
      expect(seed.reason.trim().length).toBeGreaterThan(8);
      expect(seed.reason).not.toMatch(/[\r\n]/);
      if (lens.kid) expect(seed.topic + ' ' + seed.reason).not.toMatch(/\b(news|politics|election|war|disaster|ranking|pairwork)\b/i);
    }
  });
});

describe('lens place cards', () => {
  it('covers the highest-ranked eligible countries and cities in audit order', () => {
    const selected = audit.places
      .filter(p => p.kinds.some(k => ['country', 'destination city', 'nearby city'].includes(k)))
      .sort((a, b) => a.rank - b.rank).slice(0, 40);
    expect(selected.length).toBeGreaterThan(0);
    expect(places.map(p => p.title)).toEqual(selected.map(p => p.title));
    selected.forEach((p, index) => expect(places[index].aliases).toEqual(p.aliases));
    const ids = new Set<string>(), names = new Map<string, string>();
    for (const place of places) {
      expect(place.id).toMatch(/^lens-place-/);
      expect(ids.has(place.id)).toBe(false);
      ids.add(place.id);
      expect(place.category).toBe('geography');
      for (const name of [place.title, ...place.aliases]) {
        expect(names.get(key(name)) ?? place.id, name).toBe(place.id);
        names.set(key(name), place.id);
      }
    }
  });

  it.each(places.map(p => [p.title, p] as const))('%s has complete cards that survive the existing cleaner unchanged', (_title, place) => {
    expect(Object.keys(place.lenses).sort()).toEqual(['animals-kid', 'films', 'food', 'music', 'sport']);
    const pictures: string[] = [], questions: string[] = [];
    for (const [id, lens] of Object.entries(place.lenses)) {
      const kid = id === 'animals-kid';
      expect(lens.level).toBe(kid ? 'A1' : 'B1');
      expect(lens.cards).toHaveLength(4);
      expect(cleanFactCards(lens.cards)).toEqual(lens.cards);
      expect(lens.sources.length).toBeGreaterThan(0);
      lens.sources.forEach(source => expect(new URL(source).protocol).toBe('https:'));
      for (const card of lens.cards) {
        expect(Object.keys(card).sort()).toEqual(['detail', 'headline', 'picture', 'questions']);
        expect(words(card.headline)).toBeLessThanOrEqual(kid ? 8 : 14);
        expect(sentences(card.detail)).toHaveLength(kid ? 2 : 3);
        expect(key(card.detail).startsWith(key(card.headline))).toBe(false);
        expect(card.headline + ' ' + card.detail).not.toMatch(/is a city here|degrees (north|south)|estimated population|dated estimate|people lived here/i);
        if (kid) {
          sentences(card.detail).forEach(s => expect(words(s)).toBeLessThanOrEqual(12));
          expect(card.headline + ' ' + card.detail).not.toMatch(/\b(election|war|disaster|politics|news)\b/i);
        }
        expect(card.questions).toHaveLength(2);
        for (const question of card.questions) {
          expect(question.length).toBeGreaterThan(5);
          expect(question.length).toBeLessThanOrEqual(200);
          expect(question).toMatch(/\?$/);
          questions.push(key(question));
        }
        expect(words(card.picture)).toBeGreaterThanOrEqual(2);
        expect(words(card.picture)).toBeLessThanOrEqual(5);
        expect(card.picture).not.toMatch(/\blandscape\b|poster|screenshot|fan art/i);
        pictures.push(key(card.picture));
      }
    }
    // Check all lenses together, not merely four cards at a time.
    expect(new Set(pictures).size).toBe(pictures.length);
    expect(new Set(questions).size).toBe(questions.length);
  });

  it('uses no identical question on more than three places across the whole bank', () => {
    const used = new Map<string, Set<string>>();
    for (const place of places) for (const lens of Object.values(place.lenses)) for (const card of lens.cards) {
      for (const question of card.questions) {
        const titles = used.get(key(question)) ?? new Set<string>();
        titles.add(place.title);
        used.set(key(question), titles);
      }
    }
    expect(used.size).toBeGreaterThan(0);
    used.forEach((titles, question) => expect(titles.size, question).toBeLessThanOrEqual(3));
  });

  it('keeps all content free of broken replacement characters', () => {
    for (const content of [LENS_BRIEFS, LENS_VOCABULARY, LENS_WHERE_NEXT, places]) {
      expect(JSON.stringify(content)).not.toMatch(/\uFFFD|â€™|â€¦|ï¿½/);
    }
  });
});

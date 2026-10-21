import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { QUIZ_COUNTRIES } from '@/lib/world-quiz/countries';
import { COUNTRY_FACTS } from './country-facts';
import { FLAG_SOURCES } from './flag-sources';
import { WHICH_IS_BIGGER } from './which-is-bigger';
import { CAPITAL_QUESTIONS } from './capitals';
import { HELLO_QUESTIONS } from './hello';
import { PIN_DROP_PLACES } from './pin-drop';
import { LANDMARK_QUESTIONS } from './landmarks';
import { FOOD_QUESTIONS } from './food';
import { ANIMAL_QUESTIONS } from './animals';

const key = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[\s.,!?'’]/g, '');
const ids = QUIZ_COUNTRIES.map(c => c.iso2).sort();
const https = (s: string) => expect(new URL(s).protocol, s).toBe('https:');
const languageGroup = (s: string) => ({ 'Swiss German': 'German', Dari: 'Persian' }[s] ?? s);

describe('World Quiz country facts', () => {
  it('covers precisely the approved playable countries', () => {
    expect(Object.keys(COUNTRY_FACTS).sort()).toEqual(ids);
    expect(Object.keys(FLAG_SOURCES).sort()).toEqual(ids);
  });

  it.each(QUIZ_COUNTRIES)('$name has complete sourced facts and plausible dated numbers', country => {
    const fact = COUNTRY_FACTS[country.iso2];
    expect(fact.iso2).toBe(country.iso2);
    expect(fact.name).toBe(country.name);
    expect(fact.continent).toBe(country.continent);
    for (const named of [fact.capital, fact.food, fact.animal, fact.landmark]) {
      expect(named.name.trim().length).toBeGreaterThan(1);
      https(named.sourceUrl);
    }
    expect(fact.capital.role.length).toBeGreaterThan(3);
    expect(fact.population.value).toBeGreaterThan(1000);
    expect(fact.population.value).toBeLessThan(2_000_000_000);
    expect(Number.isSafeInteger(fact.population.value)).toBe(true);
    expect(fact.population.unit).toBe('people');
    expect(fact.areaKm2.value).toBeGreaterThan(1);
    expect(fact.areaKm2.value).toBeLessThan(20_000_000);
    expect(fact.areaKm2.unit).toBe('km2');
    for (const [number, indicator] of [[fact.population, 'SP.POP.TOTL'], [fact.areaKm2, 'AG.SRF.TOTL.K2']] as const) {
      expect(Number.isFinite(number.value)).toBe(true);
      const reviewYear = Number(fact.reviewedOn.slice(0, 4));
      expect(number.year).toBeGreaterThanOrEqual(reviewYear - 3);
      expect(number.year).toBeLessThanOrEqual(reviewYear);
      const url = new URL(number.sourceUrl);
      expect(url.hostname).toBe('api.worldbank.org');
      expect(url.pathname).toBe(`/v2/country/${country.iso2}/indicator/${indicator}`);
      expect(url.searchParams.get('date')).toBe(String(number.year));
      expect(number.basis.length).toBeGreaterThan(10);
    }
    expect(fact.languages.length).toBeGreaterThan(0);
    expect(new Set(fact.languages.map(key)).size).toBe(fact.languages.length);
    expect(fact.languages).toContain(fact.hello.language);
    expect(fact.hello.text.trim().length).toBeGreaterThan(1);
    expect(fact.hello.pronunciation).toMatch(/[a-z]/i);
    https(fact.hello.sourceUrl);
    https(fact.sources.languages);
    expect(fact.currency.code).toMatch(/^[A-Z]{3}$/);
    expect(fact.currency.name.length).toBeGreaterThan(2);
    https(fact.currency.sourceUrl);
    https(fact.neighbours.sourceUrl);
    const neighbours = fact.neighbours.countries;
    expect(neighbours.length).toBeLessThanOrEqual(3);
    expect(new Set(neighbours.map(n => n.iso2)).size).toBe(neighbours.length);
    for (const neighbour of neighbours) {
      expect(neighbour.iso2).toMatch(/^[a-z]{2}$/);
      expect(neighbour.iso2).not.toBe(country.iso2);
      expect(neighbour.name.length).toBeGreaterThan(1);
      expect(['xk', 'ps', 'eh', 'gi', 'gf']).not.toContain(neighbour.iso2);
    }
    if (fact.neighbours.kind === 'land') expect(neighbours.length).toBeGreaterThan(0);
    else expect(neighbours).toEqual([]);
  });

  it('handles recent name/currency changes and multiple capital roles', () => {
    expect(COUNTRY_FACTS.kz.capital.name).toBe('Astana');
    expect(COUNTRY_FACTS.lk.capital.name).toBe('Sri Jayawardenepura Kotte');
    expect(COUNTRY_FACTS.za.capital.role).toBe('administrative capital');
    expect(COUNTRY_FACTS.bo.capital.role).toBe('constitutional capital');
    expect(COUNTRY_FACTS.ch.capital.role).toBe('federal city');
    expect(COUNTRY_FACTS.bg.currency.code).toBe('EUR');
    expect(COUNTRY_FACTS.zw.currency.code).toBe('ZWG');
    expect(COUNTRY_FACTS.au.neighbours.kind).toBe('none');
    expect(COUNTRY_FACTS.jp.neighbours.kind).toBe('island');
    expect(COUNTRY_FACTS.pt.neighbours.countries.map(n => n.iso2)).toEqual(['es']);
    expect(COUNTRY_FACTS.ie.neighbours.countries.map(n => n.iso2)).toEqual(['gb']);
  });
});

describe('World Quiz static picture banks', () => {
  const banks = [
    { name: 'landmarks', questions: LANDMARK_QUESTIONS },
    { name: 'food', questions: FOOD_QUESTIONS },
    { name: 'animals', questions: ANIMAL_QUESTIONS },
  ];
  const questions = banks.flatMap(bank => bank.questions);
  const countriesByName = new Map(QUIZ_COUNTRIES.map(country => [country.name, country]));
  const words = (text: string) => text.trim().split(/\s+/).length;

  it('keeps picture ids unique across the new and existing question banks', () => {
    const questionIds = [...questions, ...CAPITAL_QUESTIONS, ...HELLO_QUESTIONS].map(question => question.id);
    expect(new Set(questionIds).size).toBe(questionIds.length);
    questions.forEach(question => expect(question.id).toMatch(/^(landmark|food|animal)-[a-z0-9]+(?:-[a-z0-9]+)*$/));
  });

  it.each(banks)('$name has questions at each difficulty without fixing the bank size', bank => {
    expect(bank.questions.length).toBeGreaterThan(0);
    expect(new Set(bank.questions.map(question => question.level))).toEqual(new Set([1, 2, 3]));
    expect(new Set(bank.questions.map(question => question.correctIndex)).size).toBeGreaterThan(1);
  });

  it.each(questions)('$id has one correct country and three different, same-continent alternatives', question => {
    const answer = QUIZ_COUNTRIES.find(country => country.iso2 === question.iso2);
    expect(answer).toBeDefined();
    expect(question.options).toHaveLength(4);
    expect(new Set(question.options).size).toBe(question.options.length);
    expect(Number.isInteger(question.correctIndex)).toBe(true);
    expect(question.correctIndex).toBeGreaterThanOrEqual(0);
    expect(question.correctIndex).toBeLessThan(question.options.length);
    expect(question.options[question.correctIndex]).toBe(answer!.name);
    question.options.forEach(option => {
      const country = countriesByName.get(option);
      expect(country, option).toBeDefined();
      expect(country!.continent).toBe(answer!.continent);
    });
    expect([1, 2, 3]).toContain(question.level);
  });

  it.each(questions)('$id has short sourced text and a subject photo query', question => {
    expect(words(question.prompt)).toBeLessThanOrEqual(8);
    expect(question.prompt).toMatch(/\?$/);
    expect(words(question.fact)).toBeLessThanOrEqual(14);
    expect(question.fact.trim()).not.toBe('');
    expect(question.fact).toMatch(/\.$/);
    expect(words(question.picture)).toBeGreaterThanOrEqual(2);
    expect(words(question.picture)).toBeLessThanOrEqual(5);
    expect(question.picture).not.toMatch(/https?:|\b(people|tourists|crowd|chef|selfie)\b/i);
    expect(JSON.stringify(question)).not.toMatch(/\uFFFD|[\r\n]/);
    https(question.sourceUrl);
  });

  it.each(ANIMAL_QUESTIONS)('$id excludes every reviewed wild-range country from wrong answers', question => {
    expect(question.rangeIso2).toContain(question.iso2);
    expect(new Set(question.rangeIso2).size).toBe(question.rangeIso2.length);
    question.rangeIso2.forEach(iso2 => expect(iso2).toMatch(/^[a-z]{2}$/));
    question.options.forEach((option, index) => {
      if (index !== question.correctIndex) expect(question.rangeIso2).not.toContain(countriesByName.get(option)!.iso2);
    });
  });

  it.each([
    ['animal-proboscis-monkey', ['id', 'my', 'bn']],
    ['animal-bornean-orangutan', ['id', 'my']],
    ['animal-mountain-gorilla', ['rw', 'ug', 'cd']],
    ['animal-african-penguin', ['za', 'na']],
    ['animal-radiated-tortoise', ['mg', 'mu', 're']],
    ['animal-japanese-macaque', ['jp', 'us']],
  ] as const)('%s retains its shared or introduced range exclusions', (id, range) => {
    const question = ANIMAL_QUESTIONS.find(entry => entry.id === id)!;
    range.forEach(iso2 => expect(question.rangeIso2).toContain(iso2));
  });

  it('uses specific species rather than ambiguous kangaroo or lemur families', () => {
    expect(ANIMAL_QUESTIONS.some(question => question.id === 'animal-red-kangaroo')).toBe(true);
    expect(ANIMAL_QUESTIONS.some(question => question.id === 'animal-ring-tailed-lemur')).toBe(true);
    expect(ANIMAL_QUESTIONS.some(question => question.id === 'animal-kangaroo' || question.id === 'animal-lemur')).toBe(false);
  });

  it('contains static data and provenance URLs without network or generation code', () => {
    for (const file of ['picture-question.ts', 'landmarks.ts', 'food.ts', 'animals.ts']) {
      const text = readFileSync(join(process.cwd(), 'src/data/world-quiz', file), 'utf8');
      expect(text).not.toMatch(/\bfetch\s*\(|\bXMLHttpRequest\b|\baxios\s*[.(]|\b(?:function|async)\b|\bMath\.random\s*\(/);
    }
  });
});

describe('local national flag assets', () => {
  it.each(Object.entries(FLAG_SOURCES))('%s is a small self-contained SVG with pinned provenance', (iso2, source) => {
    const path = join(process.cwd(), 'public', 'flags', `${iso2}.svg`);
    const bytes = readFileSync(path), svg = bytes.toString('utf8');
    expect(source.path).toBe(`/flags/${iso2}.svg`);
    expect(bytes.length).toBe(source.bytes);
    expect(statSync(path).size).toBeLessThan(256 * 1024);
    expect(bytes.length).toBeGreaterThan(50);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
    expect(source.upstreamCommit).toMatch(/^[a-f0-9]{40}$/);
    https(source.sourceUrl);
    https(source.publicDomainStatement);
    expect(source.sourceUrl).toContain(`/${source.upstreamCommit}/svg/${iso2}.svg`);
    expect(svg).not.toMatch(/<!DOCTYPE|<!ENTITY|@import|url\(\s*["']?(?:https?:|\/\/|data:)/i);
    // The source-ingestion review XML-parses and renders every SVG. Keep the repo
    // test independent of optional DOM/image packages and reject unsafe markup.
    expect(svg).toMatch(/^<svg\b[^>]*\bxmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toMatch(/\bviewBox="[\d. -]+"/);
    expect(svg).not.toMatch(/<\s*(?:[a-z]+:)?(?:script|foreignObject|image|iframe)\b|\s(?:[a-z]+:)?on[a-z]+\s*=/i);
    for (const match of Array.from(svg.matchAll(/\b(?:[\w-]+:)?(?:href|src)\s*=\s*(["'])(.*?)\1/g))) {
      expect(match[2]).toMatch(/^#/);
    }
  });
});

describe('new World Quiz question banks', () => {
  it('has enough varied bigger comparisons without repeated unordered country pairs', () => {
    expect(WHICH_IS_BIGGER.length).toBeGreaterThanOrEqual(60);
    expect(new Set(WHICH_IS_BIGGER.map(p => p.metric))).toEqual(new Set(['population', 'areaKm2']));
    expect(new Set(WHICH_IS_BIGGER.map(p => p.difficulty))).toEqual(new Set(['easy', 'surprising']));
    const used = new Set<string>();
    for (const pair of WHICH_IS_BIGGER) {
      const identity = [pair.left.iso2, pair.right.iso2].sort().join('-');
      expect(used.has(identity), identity).toBe(false);
      used.add(identity);
      expect(pair.left.iso2).not.toBe(pair.right.iso2);
      for (const side of [pair.left, pair.right]) {
        expect(side.name).toBe(COUNTRY_FACTS[side.iso2].name);
        expect(side.number).toEqual(COUNTRY_FACTS[side.iso2][pair.metric]);
      }
      expect(pair.left.number.year).toBe(pair.right.number.year);
      expect(pair.left.number.unit).toBe(pair.right.number.unit);
      expect(pair.left.number.value).not.toBe(pair.right.number.value);
      expect(pair.correctIso2).toBe(pair.left.number.value > pair.right.number.value ? pair.left.iso2 : pair.right.iso2);
      expect(pair.whySurprising.length).toBeGreaterThan(20);
      expect(pair.whySurprising).not.toMatch(/[\r\n]/);
    }
  });

  it('has a simply worded capital question for each country with one answer', () => {
    expect(CAPITAL_QUESTIONS.map(q => q.iso2).sort()).toEqual(ids);
    for (const q of CAPITAL_QUESTIONS) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map(key)).size).toBe(q.options.length);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
      expect(q.options[q.correctIndex]).toBe(COUNTRY_FACTS[q.iso2].capital.name);
      expect(q.answer).toBe(q.options[q.correctIndex]);
      expect(q.sourceUrl).toBe(COUNTRY_FACTS[q.iso2].capital.sourceUrl);
      expect(q.prompt).toMatch(/\?$/);
      expect(q.prompt.split(/\s+/).length).toBeLessThanOrEqual(14);
    }
    expect(new Set(CAPITAL_QUESTIONS.map(q => q.correctIndex)).size).toBeGreaterThan(1);
  });

  it('has a greeting question per country with three distinct same-continent distractors', () => {
    expect(HELLO_QUESTIONS.map(q => q.iso2).sort()).toEqual(ids);
    for (const q of HELLO_QUESTIONS) {
      const target = COUNTRY_FACTS[q.iso2];
      expect(q.prompt).toContain('This is how people say hello in');
      expect(q.prompt).toContain(target.hello.language);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map(o => key(o.text))).size).toBe(q.options.length);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
      expect(q.options[q.correctIndex].text).toBe(target.hello.text);
      expect(q.options[q.correctIndex].fromIso2).toBe(target.iso2);
      q.options.forEach((option, index) => {
        const origin = COUNTRY_FACTS[option.fromIso2];
        expect(origin.continent).toBe(target.continent);
        expect(option.text).toBe(origin.hello.text);
        expect(option.language).toBe(origin.hello.language);
        expect(option.sourceUrl).toBe(origin.hello.sourceUrl);
        if (index !== q.correctIndex) {
          expect(option.fromIso2).not.toBe(q.iso2);
          expect(languageGroup(option.language)).not.toBe(languageGroup(target.hello.language));
          if (target.hello.language === 'English') expect(['hello', 'hallo', 'helo', 'halo', 'hi', 'hey']).not.toContain(key(option.text));
        }
      });
    }
    expect(new Set(HELLO_QUESTIONS.map(q => q.correctIndex)).size).toBeGreaterThan(1);
  });

  it('has enough distinct pin-drop places with valid sourced coordinates', () => {
    expect(PIN_DROP_PLACES.length).toBeGreaterThanOrEqual(80);
    expect(new Set(PIN_DROP_PLACES.map(p => p.id)).size).toBe(PIN_DROP_PLACES.length);
    expect(new Set(PIN_DROP_PLACES.map(p => key(p.name))).size).toBe(PIN_DROP_PLACES.length);
    const continents = new Set<string>();
    for (const p of PIN_DROP_PLACES) {
      expect(COUNTRY_FACTS[p.iso2], p.name).toBeDefined();
      expect(p.country).toBe(COUNTRY_FACTS[p.iso2].name);
      expect(Number.isFinite(p.lat)).toBe(true);
      expect(Number.isFinite(p.lng)).toBe(true);
      expect(p.lat).toBeGreaterThanOrEqual(-90);
      expect(p.lat).toBeLessThanOrEqual(90);
      expect(p.lng).toBeGreaterThanOrEqual(-180);
      expect(p.lng).toBeLessThanOrEqual(180);
      expect(p.fact.length).toBeGreaterThan(10);
      expect(p.fact).not.toMatch(/[\r\n]|\b(war|disaster|massacre|disputed|election)\b/i);
      expect(p.coordinateNote.length).toBeGreaterThan(10);
      https(p.coordinateSourceUrl);
      https(p.factSourceUrl);
      continents.add(COUNTRY_FACTS[p.iso2].continent);
    }
    QUIZ_COUNTRIES.forEach(c => expect(continents.has(c.continent)).toBe(true));
    expect(new Set(PIN_DROP_PLACES.map(p => p.kind))).toEqual(new Set(['city', 'landmark']));
  });

  it('contains no replacement characters or runtime network calls in its data modules', () => {
    for (const data of [COUNTRY_FACTS, FLAG_SOURCES, WHICH_IS_BIGGER, CAPITAL_QUESTIONS, HELLO_QUESTIONS, PIN_DROP_PLACES]) {
      expect(JSON.stringify(data)).not.toContain('\uFFFD');
    }
    for (const file of ['country-facts.ts', 'flag-sources.ts', 'which-is-bigger.ts', 'capitals.ts', 'hello.ts', 'pin-drop.ts']) {
      const text = readFileSync(join(process.cwd(), 'src/data/world-quiz', file), 'utf8');
      expect(text).not.toMatch(/\bfetch\s*\(|\bXMLHttpRequest\b|\baxios\s*[.(]/);
    }
  });
});

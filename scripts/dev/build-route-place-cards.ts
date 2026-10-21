/** Compile explicit editorial cards, offline. Never invent missing prose, questions or searches.
 * pnpm exec tsx --tsconfig tsconfig.json scripts/dev/build-route-place-cards.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import recipe from './data/route-place-source-data.json';
import countryBasics from './data/route-place-country-basics.json';
import type { FactCard } from '@/lib/live-room/fact-cards';

const words = (s: string) => s.trim().split(/\s+/).length;
const identity = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[?!.,:;]+/g, '').trim().replace(/\s+/g, ' ');
const sentences = (s: string) => s.split(/[.!?](?:\s+|$)/).filter(s => s.trim());
const hasBrokenText = (s: string) => /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(s);
type Level = 'A1' | 'B1';
export interface RoutePlaceCard extends FactCard {
  /** Exact Commons filename and licence; both blank when no photo is verified. */
  pictureFile: string;
  pictureLicense: string;
}
interface EditorialPlace { title: string; levels: Record<Level, { cards: RoutePlaceCard[] }> }

/** Short closed questions or simple colour/preferences, rather than reasoning prompts. */
export function isSimpleA1Question(question: string): boolean {
  return words(question) <= 8 && !/\b(?:how could|why might)\b/i.test(question)
    && /^(?:(?:Do|Does|Did|Is|Are|Can|Have|Has)\b|Would you (?:like|visit|try|eat|climb|see|walk)\b|What colou?r\b|Which do you like more:)/i.test(question);
}

const sentenceWords = (s: string): string[] => {
  const equivalents: Record<string, string> = { reaches: 'connect', reach: 'connect', flows: 'connect', flow: 'connect', connects: 'connect', links: 'connect', link: 'connect', joins: 'connect', join: 'connect', rises: 'rise', stands: 'rise', rising: 'rise', forms: 'form', boundary: 'border', borders: 'border', between: 'border', coasts: 'coast', coastlines: 'coast', fragments: 'piece', fragment: 'piece', suspended: 'hang', hanging: 'hang', control: 'reduce', controls: 'reduce', swaying: 'move', movement: 'move' };
  return Array.from(new Set(identity(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(w => w.length > 2 && !/^(?:the|and|are|was|were|has|have|had|its|with|from|this|that|these|those|some|many|much|can|also|their|they|them|here|there|into|through|along|part|parts|very|one|such|across|near|which|while|where|over|other|toward|towards)$/.test(w)).map(w => {
    const stem = w.replace(/ing$/, '').replace(/ies$/, 'y').replace(/(ch|sh|x|z|ss)es$/, '$1').replace(/([^s])s$/, '$1');
    return equivalents[w] ?? equivalents[stem] ?? stem;
  })));
};

/** Conservative lexical paraphrase guard; editorial review still checks meaning. */
export function hasRepeatedDetailSentence(detail: string): boolean {
  const all = sentences(detail);
  return all.some((sentence, i) => {
    const current = sentenceWords(sentence), preceding = sentenceWords(all.slice(0, i).join(' '));
    // A closing summary may repackage both earlier sentences rather than copy just one.
    if (current.length >= 3 && current.every(word => preceding.includes(word))) return true;
    return all.slice(0, i).some(earlier => {
    if (identity(sentence) === identity(earlier)) return true;
    const a = sentenceWords(earlier), b = sentenceWords(sentence);
    const shared = a.filter(word => b.includes(word)).length;
    return shared >= 3 && (shared / Math.min(a.length, b.length) >= 0.6 || shared / (a.length + b.length - shared) >= 0.5);
    });
  });
}

/** Reviewed subject references protect capital/animal/food/landmark coverage on rebuild. */
export function validateCountryBasics(places: EditorialPlace[]): void {
  const countries = recipe.places.filter(p => p.kinds.includes('country')).map(p => p.title).sort();
  const titles = countryBasics.places.map(p => p.title).sort();
  if (JSON.stringify(countries) !== JSON.stringify(titles)) throw new Error('Country basics roster mismatch');
  for (const basics of countryBasics.places) {
    const place = places.find(p => p.title === basics.title);
    if (!place) throw new Error(`Country basics missing: ${basics.title}`);
    for (const level of ['A1', 'B1'] as const) {
      const prose = identity(place.levels[level].cards.map(c => c.headline + ' ' + c.detail).join(' '));
      for (const subject of ['capital', 'animal', 'food', 'landmark'] as const) {
        const coverage = basics[subject];
        // Only the two polar outline entries have no established resident cuisine.
        if (!coverage.terms.length && subject === 'food' && ['Antarctica', 'French Southern and Antarctic Lands'].includes(basics.title)) continue;
        if (!coverage.terms.length || !coverage.terms.some(term => prose.includes(identity(term)))) {
          throw new Error(`Country ${subject} missing: ${basics.title} ${level}`);
        }
      }
    }
  }
}

/** Fail closed so rebuilding cannot silently restore the defects this revision removes. */
export function validateRoutePlaceCards(places: EditorialPlace[]): void {
  const questionPlaces = new Map<string, Set<string>>();
  for (const place of places) {
    for (const level of ['A1', 'B1'] as const) {
      const cards = place.levels[level].cards;
      if (cards.length !== (level === 'A1' ? 4 : 5)) throw new Error(`Card count: ${place.title} ${level}`);
      const pictures = new Set<string>();
      const headlines = new Set<string>();
      for (const card of cards) {
        const context = `${place.title} ${level}: ${card.headline}`;
        if ([card.headline, card.detail, card.picture, ...card.questions].some(hasBrokenText)) throw new Error(`Broken character: ${context}`);
        if (words(card.headline) > (level === 'A1' ? 8 : 14) || card.headline.length < 6) throw new Error(`Headline: ${context}`);
        const headline = identity(card.headline);
        if (headlines.has(headline)) throw new Error(`Duplicate headline: ${context}`);
        headlines.add(headline);
        if (identity(card.detail).startsWith(identity(card.headline))) throw new Error(`Repeated headline: ${context}`);
        const count = sentences(card.detail).length;
        if (level === 'A1' ? count !== 2 : count < 2 || count > 3) throw new Error(`Detail sentences: ${context}`);
        if (level === 'B1' && hasRepeatedDetailSentence(card.detail)) throw new Error(`Repeated detail sentence: ${context}`);
        if (level === 'A1' && sentences(card.detail).some(s => words(s) > 12)) throw new Error(`Long A1 sentence: ${context}`);
        if (/\bis a city here\b|\bdegrees (?:north|south)\b|\b(?:estimated population|people lived here|dated estimate)\b/i.test(card.headline + ' ' + card.detail)) throw new Error(`Filler fact: ${context}`);
        if (words(card.picture) < 2 || words(card.picture) > 5 || /\blandscape\b/i.test(card.picture)) throw new Error(`Photo subject: ${context}`);
        const picture = identity(card.picture);
        if (pictures.has(picture)) throw new Error(`Repeated photo: ${context}`);
        pictures.add(picture);
        if (card.questions.length !== 2 || new Set(card.questions.map(identity)).size !== 2) throw new Error(`Two questions required: ${context}`);
        for (const question of card.questions) {
          if (question.length < 6 || !question.endsWith('?')) throw new Error(`Question: ${context}`);
          if (level === 'A1' && !isSimpleA1Question(question)) throw new Error(`Simple A1 question required: ${context}: ${question}`);
          const key = identity(question);
          const used = questionPlaces.get(key) ?? new Set<string>();
          used.add(place.title);
          questionPlaces.set(key, used);
          if (used.size > 3) throw new Error(`Question used on more than three places: ${question}`);
        }
      }
    }
  }
}

/** TSV has one fully authored card per row, including both levels and reference URLs. */
export function buildRoutePlaceCards(source: string) {
  if (hasBrokenText(source)) throw new Error('Broken character in editorial input');
  const byPlace = new Map<string, { A1: RoutePlaceCard[]; B1: RoutePlaceCard[]; sources: string[] }>();
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    const columns = line.split('\t');
    if (columns.length !== 12) throw new Error(`Expected twelve editorial columns: ${columns[0]}`);
    const [title, number, a1Headline, b1Headline, a1Detail, b1Detail, a1Questions, b1Questions, picture, references, pictureFile, pictureLicense] = columns;
    const entry = byPlace.get(title) ?? { A1: [], B1: [], sources: [] };
    if (Number(number) !== entry.B1.length + 1) throw new Error(`Duplicate/misordered card: ${title} ${number}`);
    const strings = (json: string): string[] => {
      const value: unknown = JSON.parse(json);
      if (!Array.isArray(value) || value.some(s => typeof s !== 'string' || !s.trim())) throw new Error(`String array required: ${title} ${number}`);
      return value;
    };
    const refs = strings(references);
    if (!refs.length || refs.some(url => !url.startsWith('https://'))) throw new Error(`References required: ${title} ${number}`);
    entry.sources.push(...refs);
    entry.B1.push({ headline: b1Headline, detail: b1Detail, questions: strings(b1Questions), picture, pictureFile, pictureLicense });
    if (Number(number) <= 4) entry.A1.push({ headline: a1Headline, detail: a1Detail, questions: strings(a1Questions), picture, pictureFile, pictureLicense });
    byPlace.set(title, entry);
  }
  const bank = recipe.places.map(place => {
    const editorial = byPlace.get(place.title);
    if (!editorial) throw new Error(`Editorial cards missing: ${place.title}`);
    const levels = Object.fromEntries((['A1', 'B1'] as const).map(level => {
      const cards = editorial[level];
      return [level, { briefing: `Let us explore ${place.title} together. Read each fact and share your ideas about it.`, facts: cards.map(c => c.headline), angles: cards[0]?.questions ?? [], vocab: [], expressions: [], cards }];
    })) as Record<Level, { briefing: string; facts: string[]; angles: string[]; vocab: never[]; expressions: never[]; cards: RoutePlaceCard[] }>;
    return { id: 'route-place-' + place.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), title: place.title, aliases: place.aliases, category: 'geography', levels, sources: Array.from(new Set(editorial.sources)) };
  });
  if (byPlace.size !== bank.length) throw new Error('Unknown place in editorial source');
  validateRoutePlaceCards(bank);
  validateCountryBasics(bank);
  return bank;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/build-route-place-cards.ts')) {
  const bank = buildRoutePlaceCards(readFileSync('scripts/dev/data/route-place-editorial.tsv', 'utf8'));
  writeFileSync('src/data/route-place-briefings.json', JSON.stringify(bank, null, 2) + '\n');
  console.log(`Built ${bank.length} places from explicit, validated cards; no prose/photo/question defaults.`);
}

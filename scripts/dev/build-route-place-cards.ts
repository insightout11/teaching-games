/** Compile explicit editorial cards, offline. Never invent missing prose, questions or searches.
 * pnpm exec tsx --tsconfig tsconfig.json scripts/dev/build-route-place-cards.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import recipe from './data/route-place-source-data.json';
import type { FactCard } from '@/lib/live-room/fact-cards';

const words = (s: string) => s.trim().split(/\s+/).length;
const identity = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[?!.,:;]+/g, '').trim().replace(/\s+/g, ' ');
const sentences = (s: string) => s.split(/[.!?](?:\s+|$)/).filter(s => s.trim());
const hasBrokenText = (s: string) => /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(s);
type Level = 'A1' | 'B1';
interface EditorialPlace { title: string; levels: Record<Level, { cards: FactCard[] }> }

/** Short closed questions or simple colour/preferences, rather than reasoning prompts. */
export function isSimpleA1Question(question: string): boolean {
  return words(question) <= 8 && !/\b(?:how could|why might)\b/i.test(question)
    && /^(?:(?:Do|Does|Did|Is|Are|Can|Have|Has)\b|Would you like\b|What colou?r\b|Which do you like more:)/i.test(question);
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
        if (sentences(card.detail).length !== (level === 'A1' ? 2 : 3)) throw new Error(`Detail sentences: ${context}`);
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
  const byPlace = new Map<string, { A1: FactCard[]; B1: FactCard[]; sources: string[] }>();
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    const columns = line.split('\t');
    if (columns.length !== 10) throw new Error(`Expected ten editorial columns: ${columns[0]}`);
    const [title, number, a1Headline, b1Headline, a1Detail, b1Detail, a1Questions, b1Questions, picture, references] = columns;
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
    entry.B1.push({ headline: b1Headline, detail: b1Detail, questions: strings(b1Questions), picture });
    if (Number(number) <= 4) entry.A1.push({ headline: a1Headline, detail: a1Detail, questions: strings(a1Questions), picture });
    byPlace.set(title, entry);
  }
  const bank = recipe.places.map(place => {
    const editorial = byPlace.get(place.title);
    if (!editorial) throw new Error(`Editorial cards missing: ${place.title}`);
    const levels = Object.fromEntries((['A1', 'B1'] as const).map(level => {
      const cards = editorial[level];
      return [level, { briefing: `Let us explore ${place.title} together. Read each fact and share your ideas about it.`, facts: cards.map(c => c.headline), angles: cards[0]?.questions ?? [], vocab: [], expressions: [], cards }];
    })) as Record<Level, { briefing: string; facts: string[]; angles: string[]; vocab: never[]; expressions: never[]; cards: FactCard[] }>;
    return { id: 'route-place-' + place.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), title: place.title, aliases: place.aliases, category: 'geography', levels, sources: Array.from(new Set(editorial.sources)) };
  });
  if (byPlace.size !== bank.length) throw new Error('Unknown place in editorial source');
  validateRoutePlaceCards(bank);
  return bank;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/build-route-place-cards.ts')) {
  const bank = buildRoutePlaceCards(readFileSync('scripts/dev/data/route-place-editorial.tsv', 'utf8'));
  writeFileSync('src/data/route-place-briefings.json', JSON.stringify(bank, null, 2) + '\n');
  console.log(`Built ${bank.length} places from explicit, validated cards; no prose/photo/question defaults.`);
}

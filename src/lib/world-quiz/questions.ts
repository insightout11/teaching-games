/**
 * World Quiz questions (Oct 2026), made in the browser from data we already have: flags (public domain pictures),
 * country shapes (our country outlines) and clues (Codex's checked country cards). No AI call, no cost, instant.
 */
import routePlaces from '@/data/route-place-briefings.json';
import { countriesFor, QUIZ_COUNTRIES, type QuizCountry } from '@/lib/world-quiz/countries';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { DestinationPack } from '@/lib/world-flight/types';
import { PIN_DROP_PLACES } from '@/data/world-quiz/pin-drop';
import { WHICH_IS_BIGGER } from '@/data/world-quiz/which-is-bigger';
import { CAPITAL_QUESTIONS } from '@/data/world-quiz/capitals';
import { HELLO_QUESTIONS } from '@/data/world-quiz/hello';
import { getFlightLog } from '@/lib/world-quiz/flight-log';
import { LANDMARK_QUESTIONS } from '@/data/world-quiz/landmarks';
import { FOOD_QUESTIONS } from '@/data/world-quiz/food';
import { ANIMAL_QUESTIONS } from '@/data/world-quiz/animals';
import type { PictureQuestion } from '@/data/world-quiz/picture-question';

export type WorldQuizMode = 'flags' | 'shapes' | 'clues' | 'postcards' | 'pins' | 'bigger' | 'capitals' | 'hello' | 'landmarks' | 'food' | 'animals' | 'flight' | 'mix';
export type QuestionKind = 'flag' | 'shape' | 'clues' | 'postcard' | 'pin' | 'bigger' | 'capital' | 'hello' | 'picture';
export interface WorldQuestion {
  kind: QuestionKind;
  country: QuizCountry;
  /** Four country names; `correctIndex` is the right one. */
  options: string[];
  correctIndex: number;
  /** Clue ladder: hard to easy, the country's name hidden. */
  clues?: string[];
  /** Shape: an SVG path in a 100 × 100 box. */
  shape?: string;
  /** Shown after the reveal: one fact about the country. */
  fact?: string;
  /** Postcard: one of our illustrated city arrival scenes (the city is the answer). */
  destinationId?: string;
  scene?: DestinationPack['scene'];
  /** Pin drop: the place to find on the map. */
  place?: { name: string; country: string; lat: number; lng: number };
  /** The question's own wording (capitals, hello, which is bigger). */
  prompt?: string;
  /** Which is bigger: the two countries (flags) and the real numbers, shown on the reveal. */
  pair?: Array<{ iso2: string; name: string; value: number; unit: string; year: number }>;
  /** Picture rounds (landmarks, food, animals): a photo search for the subject (Wikimedia, strict match). */
  picture?: string;
  /** Hello: how to say the right greeting. */
  pronunciation?: string;
}

const shuffle = <T,>(xs: T[]): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ── clues from the checked country cards ──────────────────────────────────────────────────────────────────────────
type Card = { headline: string; detail?: string };
type Entry = { title: string; aliases?: string[]; levels: Record<string, { cards?: Card[] }> };
const ENTRIES = routePlaces as unknown as Entry[];
function cardsFor(c: QuizCountry): Card[] {
  const names = [c.name, c.map].filter(Boolean).map((n) => n!.toLowerCase());
  const e = ENTRIES.find((x) => names.includes(x.title.toLowerCase()) || (x.aliases ?? []).some((a) => names.includes(a.toLowerCase())));
  return e?.levels.B1?.cards ?? e?.levels.A1?.cards ?? [];
}
/** Hide the country's name (and the words people use for it) in a clue. */
function hideName(text: string, c: QuizCountry): string {
  const words = [c.name, c.map ?? '', c.name.replace(/^the /i, '')].filter(Boolean);
  let out = text;
  for (const w of words) out = out.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'this country');
  return out.replace(/^this country/, 'This country');
}
function cluesFor(c: QuizCountry): string[] {
  const cards = cardsFor(c);
  // the most surprising first, the basics (which give it away) last
  return cards.map((k) => hideName(k.headline, c)).filter((t) => !t.toLowerCase().includes(c.name.toLowerCase())).reverse().slice(0, 4);
}

// ── shapes from the country outlines ──────────────────────────────────────────────────────────────────────────────
type Ring = Array<[number, number]>;
let outlines: Promise<Map<string, Ring[]>> | null = null;
function loadOutlines() {
  outlines ??= import('@/data/world/countries-110m.json').then((m) => {
    const rows = ((m as { default?: unknown }).default ?? m) as Array<[string, Ring[]]>;
    return new Map(rows.map(([name, rings]) => [name, rings]));
  });
  return outlines;
}
/** A country's outline as an SVG path in a 100 × 100 box (east-west squeezed by latitude, as on a map). */
async function shapeFor(c: QuizCountry): Promise<string | null> {
  const rings = (await loadOutlines()).get(c.map ?? c.name);
  if (!rings?.length) return null;
  // across the 180° line (Fiji, Russia): keep the pieces together
  const crosses = rings.some((r) => r.some(([x]) => x > 150)) && rings.some((r) => r.some(([x]) => x < -150));
  const pts = rings.map((r) => r.map(([x, y]) => [crosses && x < 0 ? x + 360 : x, y] as [number, number]));
  const all = pts.flat();
  const lat0 = all.reduce((t, [, y]) => t + y, 0) / all.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const xs = all.map(([x]) => x * k), ys = all.map(([, y]) => -y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const s = 90 / Math.max(maxX - minX, maxY - minY, 0.001);
  const ox = (100 - (maxX - minX) * s) / 2, oy = (100 - (maxY - minY) * s) / 2;
  return pts.map((r) => r.map(([x, y], i) => `${i ? 'L' : 'M'}${(ox + (x * k - minX) * s).toFixed(1)} ${(oy + (-y - minY) * s).toFixed(1)}`).join(' ') + ' Z').join(' ');
}

/** Wrong choices from the same continent where possible, so the answer is not obvious. */
function optionsFor(c: QuizCountry, pool: QuizCountry[]): { options: string[]; correctIndex: number } {
  const near = shuffle(pool.filter((x) => x.continent === c.continent && x.name !== c.name));
  const far = shuffle(QUIZ_COUNTRIES.filter((x) => x.name !== c.name && !near.includes(x)));
  const wrong = [...near, ...far].slice(0, 3).map((x) => x.name);
  const options = shuffle([c.name, ...wrong]);
  return { options, correctIndex: options.indexOf(c.name) };
}

/** Postcards: our illustrated city scenes; the wrong choices are cities from the same part of the world. */
function postcards(count: number): WorldQuestion[] {
  const cities = shuffle(WORLD_DESTINATIONS.filter((d) => d.scene));
  return cities.slice(0, count).map((d) => {
    const near = shuffle(WORLD_DESTINATIONS.filter((x) => x.id !== d.id && x.region === d.region)).map((x) => x.city);
    const far = shuffle(WORLD_DESTINATIONS.filter((x) => x.id !== d.id && x.region !== d.region)).map((x) => x.city);
    const options = shuffle([d.city, ...Array.from(new Set([...near, ...far])).slice(0, 3)]);
    const country = QUIZ_COUNTRIES.find((c) => c.name === d.country) ?? { name: d.country, iso2: '', continent: 'Europe' as const, level: 1 as const };
    return { kind: 'postcard' as const, country, options, correctIndex: options.indexOf(d.city), destinationId: d.id, scene: d.scene, fact: `${d.city} is in ${d.country}.` };
  });
}

/** Pin drop: famous landmarks (our catalogue) and our destination cities; everyone pins where it is. */
function pinDrops(count: number): WorldQuestion[] {
  const places = shuffle([...PIN_DROP_PLACES]);
  return places.slice(0, count).map((p) => {
    const country = QUIZ_COUNTRIES.find((c) => c.iso2 === p.iso2) ?? { name: p.country, iso2: p.iso2, continent: 'Europe' as const, level: 1 as const };
    return { kind: 'pin' as const, country, options: [], correctIndex: -1, place: { name: p.name, country: p.country, lat: p.lat, lng: p.lng }, fact: p.fact };
  });
}

const countryOf = (iso2: string, name: string): QuizCountry => QUIZ_COUNTRIES.find((c) => c.iso2 === iso2) ?? { name, iso2, continent: 'Europe', level: 3 };
const atLevel = (iso2: string, level: 1 | 2 | 3) => (QUIZ_COUNTRIES.find((c) => c.iso2 === iso2)?.level ?? 3) <= level;

/** Which is bigger: two countries, more people or more land, then the real numbers (World Bank, via Codex). */
function bigger(count: number): WorldQuestion[] {
  return shuffle([...WHICH_IS_BIGGER]).slice(0, count).map((b) => {
    const options = [b.left.name, b.right.name];
    const correctIndex = b.correctIso2 === b.left.iso2 ? 0 : 1;
    return {
      kind: 'bigger' as const, country: countryOf(b.correctIso2, options[correctIndex]), options, correctIndex, prompt: b.prompt,
      pair: [b.left, b.right].map((x) => ({ iso2: x.iso2, name: x.name, value: x.number.value, unit: x.number.unit, year: x.number.year })),
      fact: b.whySurprising,
    };
  });
}
/** Capitals (Codex's checked bank), for the countries at this level. */
function capitals(count: number, level: 1 | 2 | 3): WorldQuestion[] {
  return shuffle(CAPITAL_QUESTIONS.filter((q) => atLevel(q.iso2, level))).slice(0, count).map((q) => ({
    kind: 'capital' as const, country: countryOf(q.iso2, q.prompt), options: [...q.options], correctIndex: q.correctIndex, prompt: q.prompt, fact: `${q.answer} is the ${q.capitalRole.replace(/-/g, ' ')}.`,
  }));
}
/** Hello around the world: choose the greeting people use in that country. */
function hellos(count: number, level: 1 | 2 | 3): WorldQuestion[] {
  return shuffle(HELLO_QUESTIONS.filter((q) => atLevel(q.iso2, level))).slice(0, count).map((q) => ({
    kind: 'hello' as const, country: countryOf(q.iso2, q.prompt), options: q.options.map((o) => o.text), correctIndex: q.correctIndex, prompt: q.prompt,
    pronunciation: q.pronunciation, fact: q.pronunciation ? `Say it: ${q.pronunciation}` : undefined,
  }));
}

/** Picture rounds (Codex's checked banks): a photo, which country? At or below the class's level. */
function pictureRound(bank: readonly PictureQuestion[], count: number, level: 1 | 2 | 3): WorldQuestion[] {
  const fit = bank.filter((q) => q.level <= level);
  return shuffle([...(fit.length >= count ? fit : bank)]).slice(0, count).map((q) => ({
    kind: 'picture' as const, country: countryOf(q.iso2, q.options[q.correctIndex]), options: [...q.options], correctIndex: q.correctIndex, prompt: q.prompt, picture: q.picture, fact: q.fact,
  }));
}

/** Our flight: questions about today's journey (where we took off, where we are going, what we flew over). */
function ourFlight(count: number): WorldQuestion[] {
  const f = getFlightLog();
  if (!f) return [];
  const out: WorldQuestion[] = [];
  const cityName = (c: QuizCountry | undefined, n: string) => c ?? { name: n, iso2: '', continent: 'Europe' as const, level: 1 as const };
  // where we took off and where we are flying: pins on the map
  out.push({ kind: 'pin', country: cityName(QUIZ_COUNTRIES.find((c) => c.name === f.origin.country), f.origin.country), options: [], correctIndex: -1, prompt: 'Where did we take off today? Pin it!', place: f.origin, fact: `We took off from ${f.origin.name}${f.origin.country ? `, ${f.origin.country}` : ''}.` });
  out.push({ kind: 'pin', country: cityName(QUIZ_COUNTRIES.find((c) => c.name === f.destination.country), f.destination.country), options: [], correctIndex: -1, prompt: 'Where are we flying to? Pin it!', place: f.destination, fact: `We are flying to ${f.destination.name}${f.destination.country ? `, ${f.destination.country}` : ''}.` });
  // which way are we flying
  const dirs = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  const dir = dirs[Math.round(((f.heading % 360) + 360) % 360 / 45) % 8];
  const dirOptions = shuffle([dir, ...shuffle(dirs.filter((d) => d !== dir)).slice(0, 3)]);
  out.push({ kind: 'clues', country: cityName(undefined, f.destination.country), options: dirOptions, correctIndex: dirOptions.indexOf(dir), prompt: `Which way are we flying from ${f.origin.name} to ${f.destination.name}?`, clues: [`We started in ${f.origin.name}.`, `We are going to ${f.destination.name}.`], fact: `We are flying ${dir}.` });
  // a country we flew over (with its flag)
  for (const name of shuffle(f.countries).slice(0, 2)) {
    const c = QUIZ_COUNTRIES.find((x) => x.name === name);
    if (!c) continue;
    const wrong = shuffle(QUIZ_COUNTRIES.filter((x) => x.continent === c.continent && !f.countries.includes(x.name))).slice(0, 3).map((x) => x.name);
    if (wrong.length < 3) continue;
    const options = shuffle([c.name, ...wrong]);
    out.push({ kind: 'flag', country: c, options, correctIndex: options.indexOf(c.name), prompt: 'We flew over this country today. Which one is it?', fact: `We flew over ${c.name}.` });
  }
  // a place we passed
  const place = shuffle(f.places)[0];
  if (place) {
    const others = shuffle([...PIN_DROP_PLACES.map((p) => p.name)].filter((n) => !f.places.includes(n))).slice(0, 3);
    const options = shuffle([place, ...others]);
    out.push({ kind: 'clues', country: cityName(undefined, ''), options, correctIndex: options.indexOf(place), prompt: 'Which of these did we pass on our flight today?', clues: [`It was on our way from ${f.origin.name} to ${f.destination.name}.`], fact: `We passed ${place}.` });
  }
  return out.slice(0, count);
}

/** A round of questions for a mode, at a level (1 easiest), `count` long. */
export async function buildQuiz(mode: WorldQuizMode, level: 1 | 2 | 3, count: number): Promise<WorldQuestion[]> {
  if (mode === 'postcards') return postcards(count);
  if (mode === 'pins') return pinDrops(count);
  if (mode === 'bigger') return bigger(count);
  if (mode === 'capitals') return capitals(count, level);
  if (mode === 'hello') return hellos(count, level);
  if (mode === 'flight') return ourFlight(count);
  if (mode === 'landmarks') return pictureRound(LANDMARK_QUESTIONS, count, level);
  if (mode === 'food') return pictureRound(FOOD_QUESTIONS, count, level);
  if (mode === 'animals') return pictureRound(ANIMAL_QUESTIONS, count, level);
  const cards = mode === 'mix' ? shuffle([...postcards(Math.ceil(count / 8)), ...pinDrops(Math.ceil(count / 8)), ...bigger(Math.ceil(count / 8)), ...capitals(Math.ceil(count / 8), level), ...pictureRound([...LANDMARK_QUESTIONS, ...FOOD_QUESTIONS, ...ANIMAL_QUESTIONS], Math.ceil(count / 6), level)]).slice(0, Math.ceil(count / 2)) : [];
  const pool = countriesFor(level);
  const picked = shuffle(pool).slice(0, Math.min(count * 2, pool.length));
  const kinds: QuestionKind[] = mode === 'mix' ? ['flag', 'shape', 'clues'] : [mode === 'flags' ? 'flag' : mode === 'shapes' ? 'shape' : 'clues'];
  const target = count - cards.length;
  const out: WorldQuestion[] = [];
  for (const c of picked) {
    if (out.length >= target) break;
    const kind = kinds[out.length % kinds.length];
    const base = { kind, country: c, ...optionsFor(c, pool), fact: cardsFor(c)[0]?.headline };
    if (kind === 'clues') {
      const clues = cluesFor(c);
      if (clues.length < 2) continue;
      out.push({ ...base, clues });
    } else if (kind === 'shape') {
      const shape = await shapeFor(c);
      if (!shape) continue;
      out.push({ ...base, shape });
    } else out.push(base);
  }
  // mix: a postcard every few questions
  cards.forEach((c, i) => out.splice(Math.min(out.length, 3 + i * 4), 0, c));
  return out;
}

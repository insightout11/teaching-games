/**
 * World Quiz questions (Oct 2026), made in the browser from data we already have: flags (public domain pictures),
 * country shapes (our country outlines) and clues (Codex's checked country cards). No AI call, no cost, instant.
 */
import routePlaces from '@/data/route-place-briefings.json';
import { countriesFor, QUIZ_COUNTRIES, type QuizCountry } from '@/lib/world-quiz/countries';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { DestinationPack } from '@/lib/world-flight/types';

export type WorldQuizMode = 'flags' | 'shapes' | 'clues' | 'postcards' | 'mix';
export type QuestionKind = 'flag' | 'shape' | 'clues' | 'postcard';
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

/** A round of questions for a mode, at a level (1 easiest), `count` long. */
export async function buildQuiz(mode: WorldQuizMode, level: 1 | 2 | 3, count: number): Promise<WorldQuestion[]> {
  if (mode === 'postcards') return postcards(count);
  const cards = mode === 'mix' ? postcards(Math.ceil(count / 4)) : [];
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

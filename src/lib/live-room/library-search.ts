/** Pure ranking/filtering for the Live Room Library tab (no data imports; testable). */

export type LibraryKind = 'video' | 'hook' | 'grammar' | 'text' | 'debate';
export type LibraryLength = 'short' | 'medium' | 'long';

export interface LibraryEntry {
  key: string;            // `${source}:${id}`
  source: string;
  kind: LibraryKind;
  title: string;
  publisher: string;
  byline: string | null;
  blurb: string;
  tags: string[];
  cefr: string | null;
  ageBand: string | null;
  durationSecs: number | null;
  wordCount: number | null;
  youtubeId: string | null;
  url: string | null;
}

export interface LibraryQuery {
  q?: string;
  topic?: string;
  levels?: string[];        // e.g. ['A2','B1']
  age?: string | null;      // kids | teens | adults
  kind?: LibraryKind | null;
  length?: LibraryLength | null;
  limit?: number;
}

const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'about', 'into', 'that', 'this', 'what', 'how', 'why', 'are', 'our', 'your', 'a', 'an', 'of', 'in', 'on', 'to', 'is']);
const words = (s: string) => s.toLowerCase().split(/[^a-z0-9À-ɏ]+/).filter((w) => w.length > 2 && !STOP.has(w));
const stem = (w: string) => w.replace(/(ies|es|s|ing|ed)$/, '');

export function lengthOf(e: Pick<LibraryEntry, 'durationSecs' | 'wordCount'>): LibraryLength | null {
  if (e.durationSecs != null) return e.durationSecs < 240 ? 'short' : e.durationSecs <= 600 ? 'medium' : 'long';
  if (e.wordCount != null) return e.wordCount < 300 ? 'short' : e.wordCount <= 700 ? 'medium' : 'long';
  return null;
}

/**
 * How well an entry matches a phrase: title counts most, then tags, then blurb.
 * `weight` lets rare words (e.g. "river") outrank common ones (e.g. "city").
 */
export function relevance(e: LibraryEntry, phrase: string, weight: (w: string) => number = () => 1): number {
  const qs = Array.from(new Set(words(phrase).map(stem)));
  if (!qs.length) return 0;
  const title = new Set(words(e.title).map(stem));
  const tags = new Set(e.tags.flatMap((t) => words(t)).map(stem));
  const blurb = new Set(words(e.blurb).map(stem));
  let score = 0;
  let hits = 0;
  let total = 0;
  for (const q of qs) {
    const w = weight(q);
    total += w;
    let s = 0;
    if (title.has(q)) s += 3;
    if (tags.has(q)) s += 2;
    if (blurb.has(q)) s += 1;
    if (s) { score += s * w; hits += w; }
  }
  // Reward covering more (weighted) words, not one word many times.
  return total ? score * (hits / total) : 0;
}

/** Inverse document frequency over the candidate set. */
function idf(entries: LibraryEntry[], phrase: string): (w: string) => number {
  const qs = Array.from(new Set(words(phrase).map(stem)));
  const df = new Map<string, number>(qs.map((q) => [q, 0]));
  for (const e of entries) {
    const bag = new Set([...words(e.title), ...e.tags.flatMap((t) => words(t)), ...words(e.blurb)].map(stem));
    qs.forEach((q) => { if (bag.has(q)) df.set(q, (df.get(q) ?? 0) + 1); });
  }
  const n = entries.length + 1;
  return (w) => Math.log(n / ((df.get(w) ?? 0) + 1)) + 0.1;
}

const ageOk = (entry: string | null, want: string) => !entry || entry === 'all' || entry === want;

export function rankLibrary(entries: LibraryEntry[], o: LibraryQuery): LibraryEntry[] {
  const limit = o.limit ?? 40;
  const filtered = entries.filter((e) =>
    (!o.kind || e.kind === o.kind)
    && (!o.levels?.length || (e.cefr != null && o.levels.includes(e.cefr)))
    && (!o.age || ageOk(e.ageBand, o.age))
    && (!o.length || lengthOf(e) === o.length));
  const phrase = (o.q ?? '').trim() || (o.topic ?? '').trim();
  if (!phrase) return filtered.slice(0, limit);
  const weight = idf(filtered, phrase);
  const scored = filtered
    .map((e) => ({ e, s: relevance(e, phrase, weight) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  // A topic is a loose phrase ("How rivers shape cities"): keep only strong matches.
  const floor = !o.q?.trim() && scored.length ? scored[0].s * 0.45 : 0;
  return scored
    .filter((x) => x.s >= floor)
    .slice(0, limit)
    .map((x) => x.e);
}

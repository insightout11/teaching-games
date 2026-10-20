import bank from '@/data/topic-briefings.json';
import places from '@/data/route-place-briefings.json';
import type { FactCard } from '@/lib/live-room/fact-cards';

/**
 * Live Room Focus: ready briefings for the topics classes bring up most (docs/library-round-18-brief.md). When the
 * typed topic matches one (title or alias) and no material is attached, the Focus route uses it instead of an AI
 * call: instant, and written with care. Anything else falls back to the AI.
 */
export interface TopicBriefingLevel {
  cards?: FactCard[];
  briefing: string;
  facts: string[];
  angles: string[];
  vocab: unknown[];
  expressions: unknown[];
}
export interface TopicBriefing {
  id: string;
  title: string;
  aliases?: string[];
  ageBand?: 'kids' | 'teens';
  category?: string;
  levels: Record<string, TopicBriefingLevel>;
  /** Junior classes: sticker ids for picture word cards (Codex round 22). */
  pictureWords?: string[];
}

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2'];
const WANT: Record<string, string> = { Beginner: 'A1', Easy: 'A2', Intermediate: 'B1', Advanced: 'B2', Expert: 'B2' };

/** Place identity is deliberately stricter than ordinary topic spelling/plural cleanup. */
export function routePlaceKey(title: string): string {
  return title.trim().replace(/\s+/g, ' ').replace(/^the /i, '').toLowerCase();
}
export function findRoutePlaceBriefing(title: string, entries: TopicBriefing[] = places as unknown as TopicBriefing[]): TopicBriefing | null {
  const key = routePlaceKey(title);
  if (!key) return null;
  return entries.find(entry => [entry.title, ...(entry.aliases ?? [])].some(alias => routePlaceKey(alias) === key)) ?? null;
}

/** Lowercase words, no punctuation, simple plurals folded ("Volcanoes!" -> "volcano"). */
export function topicKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith('oes') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
    .join(' ');
}

function validLevel(l: unknown): l is TopicBriefingLevel {
  const x = l as Partial<TopicBriefingLevel> | null;
  return !!x && typeof x.briefing === 'string' && x.briefing.trim().length > 20 && Array.isArray(x.facts) && Array.isArray(x.angles) && Array.isArray(x.vocab) && Array.isArray(x.expressions);
}

/** The bank entry for a typed topic: exact match on the title or an alias (after topicKey), else null. */
export function findTopicBriefing(title: string, entries: TopicBriefing[] = bank as unknown as TopicBriefing[]): TopicBriefing | null {
  const place = entries === (bank as unknown as TopicBriefing[]) ? findRoutePlaceBriefing(title) : null;
  if (place) return place;
  const key = topicKey(title);
  if (!key || key.split(' ').length > 5) return null;
  return entries.find((e) => [e.title, ...(e.aliases ?? [])].some((a) => topicKey(a) === key)) ?? null;
}

/** The level for the class's difficulty, or the nearest one the entry has. */
export function topicBriefingLevel(entry: TopicBriefing, difficulty: string): TopicBriefingLevel | null {
  if (entry.id.startsWith('route-place-')) {
    const level = entry.levels[difficulty === 'Beginner' || difficulty === 'A1' ? 'A1' : 'B1'];
    return validLevel(level) ? level : null;
  }
  const want = WANT[difficulty] ?? 'B1';
  const have = LEVEL_ORDER.filter((l) => validLevel(entry.levels?.[l]));
  if (!have.length) return null;
  const w = LEVEL_ORDER.indexOf(want);
  const pick = have.includes(want) ? want : [...have].sort((a, b) => Math.abs(LEVEL_ORDER.indexOf(a) - w) - Math.abs(LEVEL_ORDER.indexOf(b) - w))[0];
  return entry.levels[pick];
}

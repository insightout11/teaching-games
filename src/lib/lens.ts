/**
 * Class lens (Oct 2026, docs/class-lens-concept.md): every topic seen from one angle (films, music, sport, food, news,
 * or a kid lens such as animals). The lenses and their writer briefs are Codex's checked content (src/data/lenses/).
 */
import { LENS_BRIEFS } from '@/data/lenses/briefs';
import { LENS_WHERE_NEXT } from '@/data/lenses/where-next';
import placeCards from '@/data/lenses/place-cards.json';
import type { FactCard } from '@/lib/live-room/fact-cards';

export interface Lens {
  id: string;
  label: string;
  /** Junior classes only see kid lenses (and kid lenses only show in Junior classes). */
  kid: boolean;
  /** News and Politics: off until the teacher turns them on for the class. */
  perClass?: boolean;
  /** What to look for in any topic through this lens. */
  brief: string;
  goodExample?: string;
  badExample?: string;
}

export const LENSES: Lens[] = LENS_BRIEFS.map((b) => ({ id: b.id, label: b.label, kid: b.kid, perClass: b.perClass, brief: b.brief, goodExample: b.goodExample, badExample: b.badExample }));

// lens ids saved before Codex's set (phase 1) still work
const OLD_IDS: Record<string, string> = { 'kid-animals': 'animals-kid', 'kid-space': 'space-kid', 'kid-cartoons': 'stories-kid', 'kid-food': 'food-kid', 'kid-games': 'sport-games-kid' };
export const lensById = (id: string | null | undefined): Lens | null => {
  if (!id) return null;
  return LENSES.find((l) => l.id === (OLD_IDS[id] ?? id)) ?? null;
};

/** The lenses a class can pick: kid lenses for Junior classes, the others (News and Politics only when allowed). */
export function lensesFor(junior: boolean, newsAllowed: boolean): Lens[] {
  return LENSES.filter((l) => l.kid === junior && (!l.perClass || newsAllowed));
}

/** The prompt line that turns a topic through the lens (Codex's brief, with a good and a bad example). */
export function lensPromptNote(lens: Lens | null): string {
  if (!lens) return '';
  const examples = lens.goodExample ? ` For example, for Japan, good: "${lens.goodExample}"; bad: "${lens.badExample}".` : '';
  return `LENS: this class sees every topic through ${lens.label}. Write everything (facts, cards, questions, next topics) through this lens, connected to this topic, with real names. ${lens.brief}${examples}${lens.kid ? ' Never mention news, politics, war or disasters.' : ''}\n`;
}

/** A few good follow-on directions for this lens (for "Where next?"). */
export function lensSeedsNote(lens: Lens | null): string {
  const seeds = lens ? (LENS_WHERE_NEXT as Record<string, ReadonlyArray<{ topic: string }>>)[lens.id] : null;
  if (!seeds?.length) return '';
  const pick = [...seeds].sort(() => Math.random() - 0.5).slice(0, 8).map((s) => s.topic).join(', ');
  return `Good directions for this lens (use only where they fit the topic): ${pick}.\n`;
}

type LensPlace = { title: string; aliases?: string[]; lenses: Record<string, { level?: string; cards?: FactCard[] }> };
const PLACES = placeCards as unknown as LensPlace[];
const norm = (s: string) => s.trim().toLowerCase().replace(/^the\s+/, '');
/** Codex's checked lens cards for a place (the top places × the main lenses), or null. */
export function lensPlaceCards(title: string, lens: Lens | null): FactCard[] | null {
  if (!lens) return null;
  const t = norm(title);
  const place = PLACES.find((p) => norm(p.title) === t || (p.aliases ?? []).some((a) => norm(a) === t));
  const cards = place?.lenses[lens.id]?.cards;
  return cards?.length ? cards : null;
}

/**
 * Class lens (Oct 2026, docs/class-lens-concept.md): every topic seen from one angle (films, music, sport, food, news,
 * or a kid lens such as animals). Phase 1: short briefs written here; Codex's fuller briefs replace them later.
 */

export interface Lens {
  id: string;
  label: string;
  /** Junior classes only see kid lenses (and kid lenses only show in Junior classes). */
  kid: boolean;
  /** News and Politics: off until the teacher turns them on for the class. */
  perClass?: boolean;
  /** What to look for in any topic through this lens. */
  brief: string;
}

export const LENSES: Lens[] = [
  { id: 'films', label: 'Films and TV', kid: false, brief: 'famous films, TV shows and animation from or about it, the people who make them, and how they are made' },
  { id: 'music', label: 'Music', kid: false, brief: 'its music: famous artists, songs teens may know, instruments, styles and concerts' },
  { id: 'sport', label: 'Sport', kid: false, brief: 'its sport: famous teams and athletes, big events, and how its sports began' },
  { id: 'food', label: 'Food', kid: false, brief: 'its food: famous dishes, ingredients, markets and eating customs' },
  { id: 'news', label: 'News', kid: false, perClass: true, brief: 'what is in the news about it recently, explained calmly and factually, with more than one viewpoint on anything disputed, nothing graphic, never telling students what to think' },
  { id: 'politics', label: 'Politics and society', kid: false, perClass: true, brief: 'how it is governed and the big debates in its society, neutral and factual, always more than one viewpoint, nothing graphic, no jokes about living politicians, never telling students what to think' },
  { id: 'kid-animals', label: 'Animals', kid: true, brief: 'the animals that live there: what they eat, their babies, record-breakers. Short, friendly, very easy words' },
  { id: 'kid-space', label: 'Space', kid: true, brief: 'space: stars, planets, astronauts and the sky above that place. Short, friendly, very easy words' },
  { id: 'kid-cartoons', label: 'Cartoons and stories', kid: true, brief: 'famous cartoons, fairy tales and story characters from there. Short, friendly, very easy words' },
  { id: 'kid-food', label: 'Yummy food', kid: true, brief: 'sweets, snacks and fun food from there. Short, friendly, very easy words' },
  { id: 'kid-games', label: 'Sport and games', kid: true, brief: 'playground games, kids\' sports and toys from there. Short, friendly, very easy words' },
];

export const lensById = (id: string | null | undefined): Lens | null => LENSES.find((l) => l.id === id) ?? null;

/** The lenses a class can pick: kid lenses for Junior classes, the others (News and Politics only when allowed). */
export function lensesFor(junior: boolean, newsAllowed: boolean): Lens[] {
  return LENSES.filter((l) => l.kid === junior && (!l.perClass || newsAllowed));
}

/** The prompt line that turns a topic through the lens. */
export function lensPromptNote(lens: Lens | null): string {
  if (!lens) return '';
  return `LENS: this class sees every topic through ${lens.label}. Write everything (facts, cards, questions, next topics) about ${lens.brief}, connected to this topic. Keep it true and specific: real names.${lens.kid ? ' Never mention news, politics, war or disasters.' : ''}\n`;
}

import cityPacksRaw from '@/data/world-flight/city-packs.json';

/**
 * Souvenirs and postcards (Codex city packs, Sep 2026; built Oct 2026). Every city has several souvenirs, each
 * earned a different way, so classes have a reason to come back:
 *   land         the first time the class lands there
 *   mode         flying there in a mode (only "world" is earned for now: every room flight to a city counts)
 *   challenge    "postcard" (the class writes the city's postcard) and "return-visit" (a second landing) are earned
 *                now; the others (words-3, vote-reasons, debate-win, quiz-perfect) are shown with how to earn them
 *   rare         a one-in-five chance on landing, the same answer every time for the same lesson
 * Shared-screen safe: nothing here names a student.
 */
export interface Souvenir {
  id: string;
  name: string;
  description: string;
  earn: { type: 'land' | 'mode' | 'challenge' | 'rare'; mode?: string; challenge?: string };
  icon: string;
}
export interface LocalWord { word: string; language: string; meaning: string; say: string }
interface CityPack { id: string; souvenirs: Souvenir[]; postcardPrompts: string[]; localWords: LocalWord[]; mysteryClues?: Array<{ order: number; text: string }> }

const PACKS = cityPacksRaw as unknown as Record<string, CityPack>;

export function citySouvenirs(destinationId: string): Souvenir[] {
  return PACKS[destinationId]?.souvenirs ?? [];
}
export function postcardPrompts(destinationId: string): string[] {
  return PACKS[destinationId]?.postcardPrompts ?? [];
}
export function localWords(destinationId: string): LocalWord[] {
  return PACKS[destinationId]?.localWords ?? [];
}
/** The city's clues, vague first and the giveaway last (Codex city packs). */
export function mysteryClues(destinationId: string): string[] {
  return [...(PACKS[destinationId]?.mysteryClues ?? [])].sort((a, b) => a.order - b.order).map((c) => c.text);
}
/** Every city with a pack (clues, words, souvenirs). */
export function packCityIds(): string[] {
  return Object.keys(PACKS);
}

export function findSouvenir(souvenirId: string): (Souvenir & { destinationId: string }) | null {
  for (const [destinationId, pack] of Object.entries(PACKS)) {
    const s = pack.souvenirs.find((x) => x.id === souvenirId);
    if (s) return { ...s, destinationId };
  }
  return null;
}

/** How a souvenir is earned, in words for the shelf. */
export function howToEarn(s: Souvenir): string {
  if (s.earn.type === 'land') return 'Land here';
  if (s.earn.type === 'rare') return 'Rare: a lucky landing';
  if (s.earn.type === 'mode') {
    return ({ world: 'Fly here on a World Flight', mystery: 'Find this city on a Mystery Flight', topic: 'Land here on a Topic Flight', free: 'Land here on a Free Flight' } as Record<string, string>)[s.earn.mode ?? ''] ?? 'A special flight';
  }
  return ({
    postcard: 'Write the class postcard',
    'return-visit': 'Come back for a second visit',
    'words-3': 'The class stamps 3 new words here',
    'vote-reasons': 'Everyone gives a reason in a vote',
    'debate-win': 'Win a debate here',
    'quiz-perfect': 'A quiz round with no wrong answers',
  } as Record<string, string>)[s.earn.challenge ?? ''] ?? 'A class challenge';
}

/** One in five, decided by the lesson and the city, so the landing card and the saved record always agree. */
export function rareLanding(sessionId: string, destinationId: string): boolean {
  let h = 2166136261;
  for (const ch of `${sessionId}:${destinationId}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 5 === 0;
}

/** The souvenirs a landing earns. `owned` = souvenir ids the class already has; `firstLanding` = no earlier visit. */
export function souvenirsForLanding({ destinationId, sessionId, firstLanding, owned }: {
  destinationId: string;
  sessionId: string;
  firstLanding: boolean;
  owned: ReadonlySet<string>;
}): Souvenir[] {
  return citySouvenirs(destinationId).filter((s) => {
    if (owned.has(s.id)) return false;
    if (s.earn.type === 'land') return true;
    if (s.earn.type === 'mode') return s.earn.mode === 'world';
    if (s.earn.type === 'rare') return rareLanding(sessionId, destinationId);
    if (s.earn.type === 'challenge') return s.earn.challenge === 'return-visit' && !firstLanding;
    return false;
  });
}

/** The city's postcard souvenir, if it has one (earned by writing the class postcard). */
export function postcardSouvenir(destinationId: string): Souvenir | null {
  return citySouvenirs(destinationId).find((s) => s.earn.type === 'challenge' && s.earn.challenge === 'postcard') ?? null;
}

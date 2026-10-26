/**
 * Landmark rarity in words (Oct 2026, owner: words, not numbers). How many real routes pass a landmark, across the
 * whole game (every city pair any plane can fly, both directions), so a class with a starter plane is never told
 * everything is rare. Counts come from scripts/landmark-rarity.ts; landmarks no route passes get no word.
 */
import data from '@/data/world/landmark-rarity.json';
import { LANDMARK_CATALOG } from '@/data/world/landmark-catalog';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'very rare';

const COUNTS = (data as { counts: Record<string, number> }).counts;
const ROUTES = (data as { routes: Record<string, string[]> }).routes;

/** Cut-offs from the real spread (Oct 2026: 18 common, 22 uncommon, 18 rare, 20 very rare, 9 on no route). */
export function rarityForCount(routes: number): Rarity | null {
  if (routes <= 0) return null;
  if (routes >= 20) return 'common';
  if (routes >= 10) return 'uncommon';
  if (routes >= 5) return 'rare';
  return 'very rare';
}

export function rarityOf(landmarkId: string | null | undefined): Rarity | null {
  return landmarkId ? rarityForCount(COUNTS[landmarkId] ?? 0) : null;
}

/** For places only known by name (older album rows). */
export function rarityOfName(name: string): Rarity | null {
  return rarityOf(LANDMARK_CATALOG.find((l) => l.name === name)?.id);
}

/** The landmarks a route passes (from-to by destination id), most special first. */
export function landmarksOnRoute(fromId: string, toId: string): Array<{ id: string; name: string; rarity: Rarity }> {
  const order: Record<Rarity, number> = { 'very rare': 0, rare: 1, uncommon: 2, common: 3 };
  return (ROUTES[`${fromId}--${toId}`] ?? []).flatMap((id) => {
    const l = LANDMARK_CATALOG.find((x) => x.id === id);
    const r = rarityOf(id);
    return l && r ? [{ id, name: l.name, rarity: r }] : [];
  }).sort((a, b) => order[a.rarity] - order[b.rarity]);
}

export const RARITY_STYLE: Record<Rarity, string> = {
  common: 'bg-slate-200/20 text-slate-100',
  uncommon: 'bg-sky-300/25 text-sky-100',
  rare: 'bg-violet-300/30 text-violet-100',
  'very rare': 'bg-amber-300 text-slate-950',
};

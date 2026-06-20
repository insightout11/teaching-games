import type { PlaceDifficulty, PlaceMediaAsset, PlaceMediaRecord } from '@/lib/place-media';
import { getMediaForUsage } from '@/lib/place-media';
import type { WorldLensClueMode } from './scoring';

export interface WorldLensRound {
  place: PlaceMediaRecord;
  media: PlaceMediaAsset;
  clueMode: WorldLensClueMode;
}

interface SelectWorldLensRoundsOptions {
  count: number;
  recentPlaceIds: string[];
  clueMode: WorldLensClueMode;
  random?: () => number;
}

function shuffle<T>(items: T[], random: () => number) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function allowedDifficulty(clueMode: WorldLensClueMode): PlaceDifficulty[] {
  if (clueMode === 'easy') return ['easy', 'medium'];
  if (clueMode === 'hard') return ['hard', 'medium', 'easy'];
  return ['medium', 'easy', 'hard'];
}

function rankByDifficulty(place: PlaceMediaRecord, preference: PlaceDifficulty[]) {
  const index = preference.indexOf(place.difficulty);
  return index === -1 ? preference.length : index;
}

function interleaveByRegion(rounds: WorldLensRound[]) {
  const groups = new Map<string, WorldLensRound[]>();
  rounds.forEach((round) => {
    const group = groups.get(round.place.region) ?? [];
    group.push(round);
    groups.set(round.place.region, group);
  });

  const ordered: WorldLensRound[] = [];
  while (groups.size > 0) {
    for (const [region, group] of Array.from(groups.entries())) {
      const next = group.shift();
      if (next) ordered.push(next);
      if (group.length === 0) groups.delete(region);
    }
  }
  return ordered;
}

export function selectWorldLensRounds(
  places: PlaceMediaRecord[],
  {
    count,
    recentPlaceIds,
    clueMode,
    random = Math.random,
  }: SelectWorldLensRoundsOptions,
): WorldLensRound[] {
  const recent = new Set(recentPlaceIds);
  const difficultyPreference = allowedDifficulty(clueMode);
  const candidates = places
    .map((place) => {
      const media = getMediaForUsage(place, 'geo-clue')[0] ?? null;
      return media ? { place, media, clueMode } : null;
    })
    .filter((round): round is WorldLensRound => Boolean(round))
    .sort((a, b) => rankByDifficulty(a.place, difficultyPreference) - rankByDifficulty(b.place, difficultyPreference));

  const shuffled = shuffle(candidates, random).sort(
    (a, b) => rankByDifficulty(a.place, difficultyPreference) - rankByDifficulty(b.place, difficultyPreference),
  );
  const fresh = shuffled.filter((round) => !recent.has(round.place.id));
  const fallback = shuffled.filter((round) => recent.has(round.place.id));
  return [...interleaveByRegion(fresh), ...interleaveByRegion(fallback)].slice(0, Math.max(0, count));
}

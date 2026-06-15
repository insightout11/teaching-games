import type { DestinationPack } from '@/lib/world-flight/types';

export type RadarVariation = 'city' | 'airport' | 'clue';

const RADAR_VARIATIONS: RadarVariation[] = ['city', 'airport', 'clue'];

function shuffle<T>(items: T[], random: () => number) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function selectVariedRadarDestinations(
  destinations: DestinationPack[],
  count: number,
  recentDestinationIds: string[],
  random: () => number = Math.random,
) {
  const recent = new Set(recentDestinationIds);
  const shuffled = shuffle(destinations, random);
  const fresh = shuffled.filter((destination) => !recent.has(destination.id));
  const recentFallback = shuffled.filter((destination) => recent.has(destination.id));
  return [...fresh, ...recentFallback].slice(0, count);
}

export function radarVariationForIndex(offset: number, roundIndex: number): RadarVariation {
  return RADAR_VARIATIONS[(offset + roundIndex) % RADAR_VARIATIONS.length];
}

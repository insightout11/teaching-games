import type { ScoreOutcome } from '@/lib/score-engine';

export interface GeoGuessPayload {
  roundId: string;
  lat: number;
  lng: number;
}
export function parseGeoGuess(value: string): GeoGuessPayload | null {
  try {
    const candidate = JSON.parse(value) as Partial<GeoGuessPayload>;
    if (
      typeof candidate.roundId !== 'string' ||
      typeof candidate.lat !== 'number' ||
      typeof candidate.lng !== 'number' ||
      !Number.isFinite(candidate.lat) ||
      !Number.isFinite(candidate.lng) ||
      candidate.lat < -90 ||
      candidate.lat > 90 ||
      candidate.lng < -180 ||
      candidate.lng > 180
    ) {
      return null;
    }
    return { roundId: candidate.roundId, lat: candidate.lat, lng: candidate.lng };
  } catch {
    return null;
  }
}

export function radarLessonPointsForDistance(distanceKm: number) {
  const outcome = radarOutcomeForDistance(distanceKm);
  if (outcome === 'standout') return 5;
  if (outcome === 'on-task') return 3;
  if (outcome === 'genuine') return 1;
  return 0;
}

export function radarOutcomeForDistance(distanceKm: number): ScoreOutcome {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return 'invalid';
  if (distanceKm <= 250) return 'standout';
  if (distanceKm <= 1500) return 'on-task';
  return 'genuine';
}

export function radarClosestBonus(distanceKm: number, closestDistanceKm: number | null) {
  return closestDistanceKm != null && distanceKm === closestDistanceKm ? 2 : 0;
}

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

export function radarPointsForDistance(distanceKm: number) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return 0;
  return Math.max(0, Math.min(5000, Math.round(5000 * Math.exp(-distanceKm / 3000))));
}

export function radarOutcomeForDistance(distanceKm: number): ScoreOutcome {
  if (distanceKm <= 250) return 'standout';
  if (distanceKm <= 1500) return 'on-task';
  return 'genuine';
}

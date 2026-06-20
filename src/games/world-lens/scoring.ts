import type { ScoreOutcome } from '@/lib/score-engine';

export type WorldLensClueMode = 'easy' | 'medium' | 'hard';

export interface WorldLensGuessPayload {
  roundId: string;
  lat: number;
  lng: number;
}

const DISTANCE_TIERS_KM: Record<WorldLensClueMode, { standout: number; onTask: number }> = {
  easy: { standout: 250, onTask: 1500 },
  medium: { standout: 150, onTask: 1000 },
  hard: { standout: 100, onTask: 750 },
};

export function worldLensClueModeForDifficulty(difficulty: string): WorldLensClueMode {
  if (difficulty === 'Beginner' || difficulty === 'Easy') return 'easy';
  if (difficulty === 'Advanced') return 'hard';
  return 'medium';
}

export function parseWorldLensGuess(value: string): WorldLensGuessPayload | null {
  try {
    const candidate = JSON.parse(value) as Partial<WorldLensGuessPayload>;
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

export function worldLensOutcomeForDistance(distanceKm: number, clueMode: WorldLensClueMode): ScoreOutcome {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return 'invalid';
  const tiers = DISTANCE_TIERS_KM[clueMode];
  if (distanceKm <= tiers.standout) return 'standout';
  if (distanceKm <= tiers.onTask) return 'on-task';
  return 'genuine';
}

export function worldLensPointsForDistance(distanceKm: number, clueMode: WorldLensClueMode) {
  const outcome = worldLensOutcomeForDistance(distanceKm, clueMode);
  if (outcome === 'standout') return 5;
  if (outcome === 'on-task') return 3;
  if (outcome === 'genuine') return 1;
  return 0;
}

export function worldLensClosestBonus(distanceKm: number, closestDistanceKm: number | null) {
  return closestDistanceKm != null && distanceKm === closestDistanceKm ? 2 : 0;
}

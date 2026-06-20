import { describe, expect, it } from 'vitest';
import {
  parseWorldLensGuess,
  worldLensClosestBonus,
  worldLensClueModeForDifficulty,
  worldLensOutcomeForDistance,
  worldLensPointsForDistance,
} from './scoring';

describe('world lens scoring', () => {
  it('parses valid geo-point payloads and rejects invalid ones', () => {
    expect(parseWorldLensGuess(JSON.stringify({ roundId: 'r1', lat: 12.5, lng: -45.2 }))).toEqual({
      roundId: 'r1',
      lat: 12.5,
      lng: -45.2,
    });
    expect(parseWorldLensGuess('not json')).toBeNull();
    expect(parseWorldLensGuess(JSON.stringify({ roundId: 'r1', lat: 91, lng: 0 }))).toBeNull();
    expect(parseWorldLensGuess(JSON.stringify({ roundId: 'r1', lat: 0, lng: 181 }))).toBeNull();
  });

  it('uses tighter distance tiers as clue mode gets harder', () => {
    expect(worldLensOutcomeForDistance(200, 'easy')).toBe('standout');
    expect(worldLensOutcomeForDistance(200, 'medium')).toBe('on-task');
    expect(worldLensOutcomeForDistance(200, 'hard')).toBe('on-task');
    expect(worldLensOutcomeForDistance(900, 'medium')).toBe('on-task');
    expect(worldLensOutcomeForDistance(900, 'hard')).toBe('genuine');
  });

  it('maps outcomes to bounded base points', () => {
    expect(worldLensPointsForDistance(50, 'hard')).toBe(5);
    expect(worldLensPointsForDistance(500, 'hard')).toBe(3);
    expect(worldLensPointsForDistance(2000, 'hard')).toBe(1);
    expect(worldLensPointsForDistance(Number.NaN, 'hard')).toBe(0);
  });

  it('maps lesson difficulty to clue mode', () => {
    expect(worldLensClueModeForDifficulty('Beginner')).toBe('easy');
    expect(worldLensClueModeForDifficulty('Easy')).toBe('easy');
    expect(worldLensClueModeForDifficulty('Intermediate')).toBe('medium');
    expect(worldLensClueModeForDifficulty('Advanced')).toBe('hard');
  });

  it('awards closest bonus only to closest valid guesses', () => {
    expect(worldLensClosestBonus(100, 100)).toBe(2);
    expect(worldLensClosestBonus(101, 100)).toBe(0);
    expect(worldLensClosestBonus(100, null)).toBe(0);
  });
});

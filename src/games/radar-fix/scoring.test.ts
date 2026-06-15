import { describe, expect, it } from 'vitest';
import { parseGeoGuess, radarClosestBonus, radarLessonPointsForDistance, radarOutcomeForDistance } from './scoring';

describe('radar fix scoring', () => {
  it('awards the maximum score for an exact fix and decreases with distance', () => {
    expect(radarLessonPointsForDistance(0)).toBe(5);
    expect(radarLessonPointsForDistance(500)).toBe(3);
    expect(radarLessonPointsForDistance(5000)).toBe(1);
    expect(radarLessonPointsForDistance(-1)).toBe(0);
  });

  it('maps distance bands onto session scoring outcomes', () => {
    expect(radarOutcomeForDistance(100)).toBe('standout');
    expect(radarOutcomeForDistance(1000)).toBe('on-task');
    expect(radarOutcomeForDistance(3000)).toBe('genuine');
    expect(radarOutcomeForDistance(Number.NaN)).toBe('invalid');
  });

  it('awards the closest fix a two-point bonus, including exact ties', () => {
    expect(radarClosestBonus(100, 100)).toBe(2);
    expect(radarClosestBonus(101, 100)).toBe(0);
    expect(radarClosestBonus(100, null)).toBe(0);
  });

  it('validates structured geo guesses', () => {
    expect(parseGeoGuess('{"roundId":"r1","lat":13.7,"lng":100.5}')).toEqual({
      roundId: 'r1',
      lat: 13.7,
      lng: 100.5,
    });
    expect(parseGeoGuess('{"roundId":"r1","lat":120,"lng":100.5}')).toBeNull();
    expect(parseGeoGuess('not-json')).toBeNull();
  });
});

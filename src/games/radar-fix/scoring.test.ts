import { describe, expect, it } from 'vitest';
import { parseGeoGuess, radarOutcomeForDistance, radarPointsForDistance } from './scoring';

describe('radar fix scoring', () => {
  it('awards the maximum score for an exact fix and decreases with distance', () => {
    expect(radarPointsForDistance(0)).toBe(5000);
    expect(radarPointsForDistance(500)).toBeGreaterThan(radarPointsForDistance(5000));
  });

  it('maps distance bands onto session scoring outcomes', () => {
    expect(radarOutcomeForDistance(100)).toBe('standout');
    expect(radarOutcomeForDistance(1000)).toBe('on-task');
    expect(radarOutcomeForDistance(3000)).toBe('genuine');
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

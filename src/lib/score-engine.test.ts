import { describe, expect, it } from 'vitest';
import { runScoreEngine, type ScoringProfile } from './score-engine';

const accuracyProfile: ScoringProfile = {
  displayMode: 'competitive',
  supportsOnTask: true,
  supportsStandout: true,
  tracksAccuracy: true,
};

const openEndedProfile: ScoringProfile = {
  displayMode: 'class',
  supportsOnTask: true,
  supportsStandout: false,
  tracksAccuracy: false,
  defaultOutcome: 'on-task',
};

describe('runScoreEngine', () => {
  it('keeps wrong-but-genuine accuracy rows in the accuracy denominator', () => {
    const result = runScoreEngine({ isCorrect: false, profile: accuracyProfile });

    expect(result).toMatchObject({
      outcome: 'genuine',
      points: 1,
      accuracyStatus: 'incorrect',
      countsForAccuracy: true,
      isCorrect: false,
      scoringVersion: 2,
    });
  });

  it('scores correct accuracy rows as on-task', () => {
    const result = runScoreEngine({ isCorrect: true, profile: accuracyProfile });

    expect(result).toMatchObject({
      outcome: 'on-task',
      points: 3,
      accuracyStatus: 'correct',
      countsForAccuracy: true,
      isCorrect: true,
    });
  });

  it('does not manufacture accuracy for open-ended completion', () => {
    const result = runScoreEngine({ isCorrect: null, profile: openEndedProfile });

    expect(result).toMatchObject({
      outcome: 'on-task',
      points: 3,
      accuracyStatus: 'not_applicable',
      countsForAccuracy: false,
      isCorrect: false,
    });
  });

  it('clamps unsupported standout outcomes to the module profile', () => {
    const result = runScoreEngine({
      explicitOutcome: 'standout',
      isCorrect: null,
      profile: openEndedProfile,
    });

    expect(result.outcome).toBe('on-task');
    expect(result.points).toBe(3);
  });

  it('keeps explicit invalid rows at zero points', () => {
    const result = runScoreEngine({
      explicitOutcome: 'invalid',
      isCorrect: null,
      profile: openEndedProfile,
    });

    expect(result.outcome).toBe('invalid');
    expect(result.points).toBe(0);
    expect(result.countsForAccuracy).toBe(false);
  });
});

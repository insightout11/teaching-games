import { describe, expect, it } from 'vitest';
import { getAllActivities, getActivity } from '@/activities/registry';
import { getAllGames, getGame } from '@/games/registry';

describe('Scoring V2 registry coverage', () => {
  it('requires every registered game and activity to declare a scoring profile', () => {
    const modules = [
      ...getAllGames().map((module) => ({ kind: 'game', key: module.key, profile: module.scoringProfile })),
      ...getAllActivities().map((module) => ({ kind: 'activity', key: module.key, profile: module.scoringProfile })),
    ];

    expect(modules.filter((module) => !module.profile)).toEqual([]);
  });

  it('marks reveal/check modules as accuracy-tracking', () => {
    const accuracyActivityKeys = [
      'prediction-round',
      'two-truths',
      'two-truths-and-a-lie',
      'fact-detective',
      'listening-gap-fill',
      'video-player',
      'read-aloud',
    ];

    accuracyActivityKeys.forEach((key) => {
      expect(getActivity(key)?.scoringProfile?.tracksAccuracy, key).toBe(true);
    });

    expect(getGame('flash-quiz')?.scoringProfile?.tracksAccuracy).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { getAllActivities } from '@/activities/registry';
import { getAllGames } from '@/games/registry';
import {
  FLIGHT_PLAN_ITEMS,
  getClassSizeMetadata,
} from '@/lib/flight-plan-config';
import { getClassSizeChip, getDiscoveryItems } from '@/lib/discovery-shelves';

describe('class-size metadata', () => {
  it('covers every registered module and every Flight Plan item', () => {
    const registryKeys = [
      ...getAllGames().map((game) => game.key),
      ...getAllActivities().map((activity) => activity.key),
    ];

    // Bump when registering a new module (Travel arc added trip-arrival + trip-directions;
    // trip-recap landing + boarding-call takeoff added in the preset-consistency pass).
    // Sep 2026: 10 retired, Hot Seat + Mystery Flight added; (src/lib/retired-plugins.ts) no longer count as browsable.
    expect(registryKeys).toHaveLength(60);
    expect(registryKeys.filter((key) => !getClassSizeMetadata(key))).toEqual([]);
    expect(FLIGHT_PLAN_ITEMS).toHaveLength(50);
    expect(FLIGHT_PLAN_ITEMS.filter((item) => !item.idealClassSizes || !item.minStudents)).toEqual([]);
  });

  it('uses audited ideals and hard minimums for chips', () => {
    const items = getDiscoveryItems();
    // Password retired (Sep 2026); Imposter (min 3) exercises the same chip paths.
    const imposter = items.find((item) => item.key === 'imposter')!;
    const storySprint = items.find((item) => item.key === 'story-sprint')!;
    const twentyQuestions = items.find((item) => item.key === 'twenty-questions')!;

    expect(getClassSizeChip(imposter)).toBe('Best with 3+');
    expect(getClassSizeChip(imposter, { setup: 'small-group' })).toBe('Best with 3+');
    expect(getClassSizeChip(imposter, { setup: 'small-group', studentCount: 2 })).toBe('Needs 3+ students');
    expect(getClassSizeChip(imposter, { setup: 'small-group', studentCount: 3 })).toBe('Great for small groups');
    expect(getClassSizeChip(storySprint, { setup: 'classroom' })).toBe('Best for small groups');
    expect(getClassSizeChip(twentyQuestions, { setup: 'one-on-one' })).toBe('Best with 2+');
  });
});

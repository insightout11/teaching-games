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

    // Bump when registering a new module (Travel arc added trip-arrival + trip-directions).
    expect(registryKeys).toHaveLength(63);
    expect(registryKeys.filter((key) => !getClassSizeMetadata(key))).toEqual([]);
    expect(FLIGHT_PLAN_ITEMS).toHaveLength(50);
    expect(FLIGHT_PLAN_ITEMS.filter((item) => !item.idealClassSizes || !item.minStudents)).toEqual([]);
  });

  it('uses audited ideals and hard minimums for chips', () => {
    const items = getDiscoveryItems();
    const password = items.find((item) => item.key === 'password')!;
    const storySprint = items.find((item) => item.key === 'story-sprint')!;
    const twentyQuestions = items.find((item) => item.key === 'twenty-questions')!;

    expect(getClassSizeChip(password)).toBe('Best with 4+');
    expect(getClassSizeChip(password, { setup: 'small-group' })).toBe('Best with 4+');
    expect(getClassSizeChip(password, { setup: 'small-group', studentCount: 3 })).toBe('Needs 4+ students');
    expect(getClassSizeChip(password, { setup: 'small-group', studentCount: 4 })).toBe('Great for small groups');
    expect(getClassSizeChip(storySprint, { setup: 'classroom' })).toBe('Best for small groups');
    expect(getClassSizeChip(twentyQuestions, { setup: 'one-on-one' })).toBe('Best with 2+');
  });
});

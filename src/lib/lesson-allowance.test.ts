import { describe, expect, it } from 'vitest';
import { FREE_MONTHLY_LESSONS, freeLessonsLeft, lessonsAvailable, lessonsUsedThisMonth, monthStartIso } from './lesson-allowance';

describe('free monthly lessons (pricing option B)', () => {
  it('gives 4 a month, then leftover credits', () => {
    expect(FREE_MONTHLY_LESSONS).toBe(4);
    expect(freeLessonsLeft(0)).toBe(4);
    expect(freeLessonsLeft(3)).toBe(1);
    expect(freeLessonsLeft(9)).toBe(0);
    expect(lessonsAvailable(4, 2)).toBe(2);
    expect(lessonsAvailable(1, 0)).toBe(3);
  });

  it('counts from the first of the month (UTC)', () => {
    expect(monthStartIso(new Date('2026-10-07T15:00:00Z'))).toBe('2026-10-01T00:00:00.000Z');
  });

  it('counts the teacher sessions this month, failing open', async () => {
    const calls: unknown[][] = [];
    const client = { from: () => ({ select: (...a: unknown[]) => { calls.push(a); return { eq: () => ({ eq: () => ({ gte: async () => ({ count: 3, error: null }) }) }) }; } }) };
    expect(await lessonsUsedThisMonth(client, 't1')).toBe(3);
    const broken = { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ gte: async () => ({ count: null, error: new Error('x') }) }) }) }) }) };
    expect(await lessonsUsedThisMonth(broken, 't1')).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import {
  calculateWorldFlightReward,
  calculateWorldFlightSessionMetrics,
  getWorldFlightProgression,
  getWorldFlightRangeForTier,
  getWorldFlightUpgradeState,
} from '@/lib/world-flight/progression';

const participants = ['a', 'b', 'c', 'd'].map((clientId) => ({ clientId }));

describe('World Flight collaborative progression', () => {
  it('awards both automatic stars for broad, accurate participation', () => {
    const reward = calculateWorldFlightReward(participants, [
      { clientId: 'a', outcome: 'on-task', countsForLeaderboard: true, countsForAccuracy: true, accuracyStatus: 'correct' },
      { clientId: 'b', outcome: 'on-task', countsForLeaderboard: true, countsForAccuracy: true, accuracyStatus: 'correct' },
      { clientId: 'c', outcome: 'genuine', countsForLeaderboard: true, countsForAccuracy: true, accuracyStatus: 'incorrect' },
    ]);

    expect(reward.crewStarsAwarded).toBe(2);
    expect(reward.snapshot.everyoneAboardEarned).toBe(true);
    expect(reward.snapshot.strongLandingEarned).toBe(true);
  });

  it('does not let a few highly active students earn the participation star', () => {
    const reward = calculateWorldFlightReward(participants, [
      { clientId: 'a', outcome: 'standout', countsForLeaderboard: true },
      { clientId: 'a', outcome: 'standout', countsForLeaderboard: true },
      { clientId: 'b', outcome: 'standout', countsForLeaderboard: true },
    ]);

    expect(reward.crewStarsAwarded).toBe(0);
    expect(reward.snapshot.meaningfulParticipantCount).toBe(2);
  });

  it('counts direct votes toward Everyone Aboard without treating them as a strong landing', () => {
    const reward = calculateWorldFlightReward(participants, [
      { clientId: 'a', responseType: 'remote_vote', countsForLeaderboard: false },
      { clientId: 'b', responseType: 'remote_vote', countsForLeaderboard: false },
      { clientId: 'c', responseType: 'remote_vote', countsForLeaderboard: false },
    ]);

    expect(reward.crewStarsAwarded).toBe(1);
    expect(reward.snapshot.everyoneAboardEarned).toBe(true);
    expect(reward.snapshot.strongLandingEarned).toBe(false);
  });

  it('counts a direct-only Opinion Pulse response in arrival metrics', () => {
    expect(calculateWorldFlightSessionMetrics([
      {
        clientId: 'a',
        countsForLeaderboard: false,
        responseData: { type: 'remote_vote', activityKey: 'opinion-micro', roundId: 'pulse:vote' },
      },
    ])).toMatchObject({ responseCount: 1, accuracyRate: null, bestStreak: 0 });
  });

  it('does not double-count a direct vote that later receives an official score', () => {
    expect(calculateWorldFlightSessionMetrics([
      {
        clientId: 'a',
        countsForLeaderboard: false,
        responseData: { type: 'remote_vote', activityKey: 'prediction-round', roundId: 'prediction:1' },
      },
      {
        clientId: 'a',
        countsForLeaderboard: true,
        countsForAccuracy: true,
        accuracyStatus: 'correct',
        streakCount: 3,
        responseData: { type: 'activity_participation', activityKey: 'prediction-round' },
      },
    ])).toEqual({ responseCount: 1, accuracyRate: 1, bestStreak: 3 });
  });

  it('lets teacher-led lessons earn Strong Landing without Everyone Aboard', () => {
    const reward = calculateWorldFlightReward([], [
      { studentId: 'one', outcome: 'on-task', countsForLeaderboard: true },
      { studentId: 'two', outcome: 'on-task', countsForLeaderboard: true },
    ]);

    expect(reward.snapshot.participantCount).toBe(0);
    expect(reward.snapshot.meaningfulParticipantCount).toBe(0);
    expect(reward.snapshot.everyoneAboardEarned).toBe(false);
    expect(reward.snapshot.strongLandingEarned).toBe(true);
    expect(reward.crewStarsAwarded).toBe(1);
  });

  it('derives unlocked and next milestones without changing aircraft state', () => {
    expect(getWorldFlightProgression(8, 9)).toMatchObject({
      unlockedTier: 2,
      nextMilestone: { tier: 3 },
    });
  });

  it('identifies an earned range upgrade that has not been claimed', () => {
    expect(getWorldFlightUpgradeState({
      planeTier: 0,
      rangeKm: 5200,
      flightHours: 8,
      crewStars: 9,
    })).toMatchObject({
      currentTier: 0,
      currentRangeKm: 5200,
      unlockedTier: 2,
      claimableTier: 2,
      claimableRangeKm: 8500,
      nextRangeTier: { tier: 2, rangeKm: 8500 },
      fullyUpgraded: false,
    });
  });

  it('shows what is still needed when the next upgrade is not ready', () => {
    expect(getWorldFlightUpgradeState({
      planeTier: 1,
      rangeKm: 6800,
      flightHours: 5,
      crewStars: 6,
    })).toMatchObject({
      currentTier: 1,
      unlockedTier: 1,
      claimableTier: null,
      nextMilestone: { tier: 2 },
      nextRangeTier: { tier: 2, rangeKm: 8500 },
      needsFlightHours: 2,
      needsCrewStars: 2,
    });
  });

  it('clamps range tiers to the published range catalog', () => {
    expect(getWorldFlightRangeForTier(-3)).toMatchObject({ tier: 0, rangeKm: 5200 });
    expect(getWorldFlightRangeForTier(99)).toMatchObject({ tier: 4, rangeKm: 13000 });
  });
});

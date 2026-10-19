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

describe('World Flight stars without phones', () => {
  const marks = (ids: string[]) => ids.map((studentId) => ({ studentId, outcome: 'on-task', countsForLeaderboard: true }));

  it('earns Everyone Aboard when the teacher has marked most of the class list', () => {
    const reward = calculateWorldFlightReward([], marks(['s1', 's2', 's3']), 4);
    expect(reward.snapshot.everyoneAboardEarned).toBe(true);
    expect(reward.crewStarsAwarded).toBe(2);
  });

  it('does not earn it when only a few students were marked, or the class list is unknown', () => {
    expect(calculateWorldFlightReward([], marks(['s1', 's2']), 6).snapshot.everyoneAboardEarned).toBe(false);
    expect(calculateWorldFlightReward([], marks(['s1', 's2'])).snapshot.everyoneAboardEarned).toBe(false);
  });

  it('still judges by phones when any phone joined', () => {
    const reward = calculateWorldFlightReward(participants, marks(['s1', 's2', 's3', 's4']), 4);
    expect(reward.snapshot.everyoneAboardEarned).toBe(false);
  });
});

describe('World Flight stars in a mixed class (seats)', () => {
  const marked = (studentId: string) => ({ studentId, outcome: 'on-task', countsForLeaderboard: true });
  const phoneScore = (clientId: string) => ({ clientId, outcome: 'on-task', countsForLeaderboard: true });

  it('counts students without a device: 1 phone took part, 3 deviceless did nothing → no star', () => {
    const r = calculateWorldFlightReward([{ clientId: 'p1', studentId: 's1' }], [phoneScore('p1')], 4, ['s1', 's2', 's3', 's4']);
    expect(r.snapshot.participantCount).toBe(4);
    expect(r.snapshot.everyoneAboardEarned).toBe(false);
  });

  it('earns the star when the teacher marked the students without devices too', () => {
    const r = calculateWorldFlightReward(
      [{ clientId: 'p1', studentId: 's1' }],
      [phoneScore('p1'), marked('s2'), marked('s3')],
      4,
      ['s1', 's2', 's3', 's4'],
    );
    expect(r.snapshot.meaningfulParticipantCount).toBe(3);
    expect(r.snapshot.everyoneAboardEarned).toBe(true);
  });

  it('one student on two devices counts once', () => {
    const r = calculateWorldFlightReward(
      [{ clientId: 'p1', studentId: 's1' }, { clientId: 'p2', studentId: 's1' }, { clientId: 'p3', studentId: 's2' }],
      [phoneScore('p1'), phoneScore('p2')],
      2,
      ['s1', 's2'],
    );
    expect(r.snapshot.participantCount).toBe(2);
    expect(r.snapshot.meaningfulParticipantCount).toBe(1);
  });

  it('absent students are not counted', () => {
    const r = calculateWorldFlightReward([], [marked('s1'), marked('s2')], 4, ['s1', 's2']);
    expect(r.snapshot.participantCount).toBe(2);
    expect(r.snapshot.everyoneAboardEarned).toBe(true);
  });

  it('a phone student who typed a new name still counts', () => {
    const r = calculateWorldFlightReward([{ clientId: 'guest', studentId: null }], [phoneScore('guest')], 1, ['s1']);
    expect(r.snapshot.participantCount).toBe(2);
    expect(r.snapshot.meaningfulParticipantCount).toBe(1);
  });
});

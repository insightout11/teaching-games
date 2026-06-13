import { describe, expect, it } from 'vitest';
import { calculateWorldFlightReward, getWorldFlightProgression } from '@/lib/world-flight/progression';

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

  it('supports teacher-led lessons without joined student controllers', () => {
    const reward = calculateWorldFlightReward([], [
      { studentId: 'one', outcome: 'on-task', countsForLeaderboard: true },
      { studentId: 'two', outcome: 'on-task', countsForLeaderboard: true },
    ]);

    expect(reward.snapshot.participantCount).toBe(2);
    expect(reward.crewStarsAwarded).toBe(2);
  });

  it('derives unlocked and next milestones without changing aircraft state', () => {
    expect(getWorldFlightProgression(8, 9)).toMatchObject({
      unlockedTier: 2,
      nextMilestone: { tier: 3 },
    });
  });
});

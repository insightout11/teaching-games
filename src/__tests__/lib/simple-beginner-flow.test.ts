import { describe, expect, it } from 'vitest';
import {
  participationFromResponders,
  resolveClassStatusSummary,
} from '@/lib/activity-participation';
import { studentConnectionState } from '@/lib/realtime-health';

describe('simple Beginner lesson flow without cockpit', () => {
  it('keeps delivery, one vote, changed vote, class status, and activity advance coherent', () => {
    expect(studentConnectionState({
      channelHealth: 'subscribed',
      canonicalReady: true,
      lastCanonicalSuccessAt: 1_000,
      degradedSince: null,
      now: 1_000,
    })).toBe('connected');

    const firstVote = participationFromResponders('would-you-rather', 'dilemma-1', ['student-1']);
    expect(resolveClassStatusSummary({
      studentCount: 1,
      scoredParticipantCount: 0,
      scoredResponseCount: 0,
      currentActivity: firstVote,
    })).toMatchObject({ participated: 1, responseCount: 1, source: 'current-activity' });

    const changedVote = participationFromResponders(
      'would-you-rather',
      'dilemma-1',
      ['student-1', 'student-1'],
    );
    expect(changedVote).toMatchObject({ activeParticipants: 1, responseCount: 1 });

    const nextActivity = participationFromResponders('would-you-rather', 'dilemma-2', []);
    expect(resolveClassStatusSummary({
      studentCount: 1,
      scoredParticipantCount: 0,
      scoredResponseCount: 0,
      currentActivity: nextActivity,
    })).toMatchObject({ participated: 0, responseCount: 0, source: 'current-activity' });
  });
});

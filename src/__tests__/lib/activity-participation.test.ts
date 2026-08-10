import { describe, expect, it } from 'vitest';
import {
  participationFromResponders,
  resolveClassStatusSummary,
} from '@/lib/activity-participation';

describe('current activity participation', () => {
  it('reports zero votes without falling back to historical scores', () => {
    const current = participationFromResponders('would-you-rather', 'dilemma-1', []);
    expect(resolveClassStatusSummary({
      studentCount: 4,
      scoredParticipantCount: 2,
      scoredResponseCount: 3,
      currentActivity: current,
    })).toEqual({ participated: 0, total: 4, responseCount: 0, source: 'current-activity' });
  });

  it('counts one student changing a vote as one current response', () => {
    const current = participationFromResponders(
      'would-you-rather',
      'dilemma-1',
      ['student-1', 'student-1'],
    );
    expect(current).toMatchObject({ activeParticipants: 1, responseCount: 1 });
  });

  it('counts multiple unique students', () => {
    const current = participationFromResponders(
      'would-you-rather',
      'dilemma-1',
      ['student-1', 'student-2', 'student-3'],
    );
    expect(current).toMatchObject({ activeParticipants: 3, responseCount: 3 });
  });

  it('returns to scored-session history after the activity resets or changes', () => {
    expect(resolveClassStatusSummary({
      studentCount: 4,
      scoredParticipantCount: 2,
      scoredResponseCount: 5,
      currentActivity: null,
    })).toEqual({ participated: 2, total: 4, responseCount: 5, source: 'scored-session' });
  });
});

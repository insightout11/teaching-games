import { describe, expect, it } from 'vitest';
import { getActivityInstanceKey } from '@/lib/activity-instance';

describe('getActivityInstanceKey', () => {
  it('gives consecutive lesson slots different activity instances', () => {
    expect(getActivityInstanceKey(0, 'prediction', 'prediction-round'))
      .not.toBe(getActivityInstanceKey(1, 'read-aloud', 'read-aloud'));
  });

  it('does not share state between two slots using the same activity', () => {
    expect(getActivityInstanceKey(0, 'practice-a', 'opinion-pulse'))
      .not.toBe(getActivityInstanceKey(2, 'practice-b', 'opinion-pulse'));
  });

  it('stays stable while the same slot rerenders', () => {
    expect(getActivityInstanceKey(1, 'read-aloud', 'read-aloud'))
      .toBe(getActivityInstanceKey(1, 'read-aloud', 'read-aloud'));
  });
});

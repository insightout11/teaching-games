import { describe, expect, it } from 'vitest';
import {
  DEGRADED_SCORE_RECONCILE_MS,
  HEALTHY_SCORE_RECONCILE_MS,
  getScoreReconcileDelay,
} from '@/lib/activity-score-reconciliation';

describe('activity score reconciliation cadence', () => {
  it('reconciles quickly during an open prompt even when the channel reports healthy', () => {
    expect(getScoreReconcileDelay('prompting', true)).toBe(DEGRADED_SCORE_RECONCILE_MS);
  });

  it('keeps the fast fallback when the channel is degraded', () => {
    expect(getScoreReconcileDelay('idle', false)).toBe(DEGRADED_SCORE_RECONCILE_MS);
  });

  it('returns to the low-frequency safety check outside live prompts', () => {
    expect(getScoreReconcileDelay('complete', true)).toBe(HEALTHY_SCORE_RECONCILE_MS);
  });
});

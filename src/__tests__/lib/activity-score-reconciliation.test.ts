import { describe, expect, it } from 'vitest';
import {
  DEGRADED_SCORE_RECONCILE_MS,
  HEALTHY_SCORE_RECONCILE_MS,
  getScoreReconcileDelay,
  markScoreDelivered,
} from '@/lib/activity-score-reconciliation';

describe('activity score reconciliation cadence', () => {
  it('reconciles quickly whenever student input is open even when the channel reports healthy', () => {
    expect(getScoreReconcileDelay(true, true)).toBe(DEGRADED_SCORE_RECONCILE_MS);
  });

  it('keeps the fast fallback when the channel is degraded', () => {
    expect(getScoreReconcileDelay(false, false)).toBe(DEGRADED_SCORE_RECONCILE_MS);
  });

  it('returns to the low-frequency safety check after student input closes', () => {
    expect(getScoreReconcileDelay(false, true)).toBe(HEALTHY_SCORE_RECONCILE_MS);
  });

  it('delivers each score only once across realtime and polling paths', () => {
    const deliveredScoreIds = new Set<string>();
    expect(markScoreDelivered(deliveredScoreIds, 'score-1')).toBe(true);
    expect(markScoreDelivered(deliveredScoreIds, 'score-1')).toBe(false);
  });
});

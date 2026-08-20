export const DEGRADED_SCORE_RECONCILE_MS = 1_500;
export const HEALTHY_SCORE_RECONCILE_MS = 15_000;

export function markScoreDelivered(deliveredScoreIds: Set<string>, scoreId: string): boolean {
  if (deliveredScoreIds.has(scoreId)) return false;
  deliveredScoreIds.add(scoreId);
  return true;
}

/**
 * A SUBSCRIBED channel only confirms that the socket joined successfully. It
 * does not prove that every Postgres change reached the teacher. Keep a short
 * reconciliation loop whenever the activity exposes an input spec to students
 * so the guarantee is independent of activity-specific phase names.
 */
export function getScoreReconcileDelay(
  studentInputOpen: boolean,
  channelHealthy: boolean,
): number {
  if (studentInputOpen) return DEGRADED_SCORE_RECONCILE_MS;
  return channelHealthy ? HEALTHY_SCORE_RECONCILE_MS : DEGRADED_SCORE_RECONCILE_MS;
}

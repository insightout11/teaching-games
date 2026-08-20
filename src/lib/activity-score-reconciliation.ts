export const DEGRADED_SCORE_RECONCILE_MS = 1_500;
export const HEALTHY_SCORE_RECONCILE_MS = 15_000;

/**
 * A SUBSCRIBED channel only confirms that the socket joined successfully. It
 * does not prove that every Postgres change reached the teacher. Keep a short
 * reconciliation loop while students can answer so a missed event cannot be
 * stranded until after a timed round closes.
 */
export function getScoreReconcileDelay(
  activityPhase: string,
  channelHealthy: boolean,
): number {
  if (activityPhase === 'prompting') return DEGRADED_SCORE_RECONCILE_MS;
  return channelHealthy ? HEALTHY_SCORE_RECONCILE_MS : DEGRADED_SCORE_RECONCILE_MS;
}

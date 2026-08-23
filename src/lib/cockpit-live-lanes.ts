import type { SideChannelItem } from '@/lib/side-channel';
import type { StudentSubmission } from '@/lib/supabase/types';

export const LIVE_LANE_HISTORY_MS = 30 * 60 * 1000;

export function isSubmissionInLiveLanes(
  submission: StudentSubmission,
  options: {
    currentGameKey?: string | null;
    sideChannel?: SideChannelItem | null;
    now?: number;
  },
): boolean {
  const now = options.now ?? Date.now();
  const submittedAt = Date.parse(submission.created_at);
  if (!Number.isFinite(submittedAt)) return false;

  if (submission.game_key === 'crew-radio') {
    if (!options.sideChannel) return false;
    const laneStartedAt = Date.parse(options.sideChannel.createdAt);
    const laneExpiresAt = options.sideChannel.expiresAt
      ? Date.parse(options.sideChannel.expiresAt)
      : Number.POSITIVE_INFINITY;
    return Number.isFinite(laneStartedAt)
      && submittedAt >= laneStartedAt
      && submittedAt <= laneExpiresAt
      && submittedAt <= now;
  }

  return Boolean(options.currentGameKey)
    && submission.game_key === options.currentGameKey
    && submittedAt >= now - LIVE_LANE_HISTORY_MS
    && submittedAt <= now;
}

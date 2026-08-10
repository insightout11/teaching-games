export interface ActivityParticipationMetrics {
  activityKey: string;
  activityInstanceKey: string;
  activeParticipants: number;
  responseCount: number;
}

export interface ClassStatusSummary {
  participated: number;
  total: number;
  responseCount: number;
  source: 'current-activity' | 'scored-session';
}

export function participationFromResponders(
  activityKey: string,
  activityInstanceKey: string,
  responderIds: Array<string | null | undefined>,
): ActivityParticipationMetrics {
  const uniqueResponders = new Set(responderIds.filter((id): id is string => Boolean(id)));
  return {
    activityKey,
    activityInstanceKey,
    activeParticipants: uniqueResponders.size,
    responseCount: uniqueResponders.size,
  };
}

export function resolveClassStatusSummary(options: {
  studentCount: number;
  scoredParticipantCount: number;
  scoredResponseCount: number;
  currentActivity?: ActivityParticipationMetrics | null;
}): ClassStatusSummary {
  if (options.currentActivity) {
    return {
      participated: options.currentActivity.activeParticipants,
      total: options.studentCount,
      responseCount: options.currentActivity.responseCount,
      source: 'current-activity',
    };
  }
  return {
    participated: options.scoredParticipantCount,
    total: options.studentCount,
    responseCount: options.scoredResponseCount,
    source: 'scored-session',
  };
}

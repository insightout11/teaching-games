'use client';

import { trackEvent } from '@/lib/analytics/posthog';

/** A content issue as the server reports it (see content-health.ts). */
export interface ReportedContentIssue {
  kind: string;
  activity?: string;
  reason: string;
}

/**
 * Send the issues a generate response came back with to analytics, one event each, with what the class was doing.
 * Event: `content_issue` { kind, activity, reason, topic, difficulty, has_material, where }.
 * Never includes student names or answers.
 */
export function reportContentIssues(
  issues: ReportedContentIssue[] | undefined,
  context: { topic?: string; difficulty?: string; hasMaterial?: boolean; where: string; activity?: string },
): void {
  if (!issues?.length) return;
  for (const issue of issues.slice(0, 12)) {
    trackEvent('content_issue', {
      kind: issue.kind,
      activity: issue.activity ?? context.activity ?? 'unknown',
      reason: issue.reason,
      topic: context.topic?.slice(0, 120),
      difficulty: context.difficulty,
      has_material: Boolean(context.hasMaterial),
      where: context.where,
    });
  }
}

/** An activity could not be shown at all (no content came back), or its screen crashed. */
export function reportActivityFailure(kind: 'content_failed' | 'activity_crashed', activity: string, detail: { topic?: string; message?: string }): void {
  trackEvent('content_issue', { kind, activity, reason: detail.message?.slice(0, 200) ?? kind, topic: detail.topic?.slice(0, 120), where: 'lesson screen' });
}

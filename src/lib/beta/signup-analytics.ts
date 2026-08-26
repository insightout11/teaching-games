'use client';

import {
  identifyTeacher,
  getPostHogDistinctId,
  initPostHog,
} from '@/lib/analytics/posthog';

export async function captureBetaSignupCompleted(user: { id: string; email?: string | null }) {
  const analyticsReady = initPostHog();
  const analyticsDistinctId = analyticsReady ? getPostHogDistinctId() : null;

  const response = await fetch('/api/beta/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analyticsDistinctId }),
  });
  if (analyticsReady) identifyTeacher(user.id, user.email ?? null);
  if (!response.ok) return { outcome: 'claim-failed' as const };
  const result = await response.json() as { claimed?: boolean; analyticsCaptured?: boolean };
  if (!result.claimed) return { outcome: 'not-claimed' as const };
  if (!result.analyticsCaptured) return { outcome: 'analytics-unavailable' as const };
  return { outcome: 'captured' as const };
}

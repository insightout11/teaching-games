'use client';

import {
  identifyTeacher,
  initPostHog,
  isPostHogReady,
  trackEventImmediately,
} from '@/lib/analytics/posthog';
import { betaAnalyticsEventId } from '@/lib/beta/analytics-event-id';

export async function captureBetaSignupCompleted(user: { id: string; email?: string | null }) {
  if (!initPostHog() || !isPostHogReady()) return { outcome: 'analytics-unavailable' as const };
  if (!identifyTeacher(user.id, user.email ?? null)) return { outcome: 'analytics-unavailable' as const };

  const response = await fetch('/api/beta/status', { method: 'POST' });
  if (!response.ok) return { outcome: 'claim-failed' as const };
  const result = await response.json() as { claimed?: boolean; properties?: Record<string, unknown>; applicationId?: string };
  if (!result.claimed) return { outcome: 'not-claimed' as const };

  if (!trackEventImmediately(
    'beta_signup_completed',
    result.properties,
    betaAnalyticsEventId(result.applicationId, 'beta_signup_completed'),
  )) return { outcome: 'analytics-unavailable' as const };
  return { outcome: 'captured' as const };
}

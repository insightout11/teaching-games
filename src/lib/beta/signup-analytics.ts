'use client';

import {
  identifyTeacher,
  initPostHog,
  isPostHogReady,
  trackEvent,
} from '@/lib/analytics/posthog';

export async function captureBetaSignupCompleted(user: { id: string; email?: string | null }) {
  if (!initPostHog() || !isPostHogReady()) return { outcome: 'analytics-unavailable' as const };
  if (!identifyTeacher(user.id, user.email ?? null)) return { outcome: 'analytics-unavailable' as const };

  const response = await fetch('/api/beta/status', { method: 'POST' });
  if (!response.ok) return { outcome: 'claim-failed' as const };
  const result = await response.json() as { claimed?: boolean; properties?: Record<string, unknown> };
  if (!result.claimed) return { outcome: 'not-claimed' as const };

  trackEvent('beta_signup_completed', result.properties);
  return { outcome: 'captured' as const };
}

import { betaAnalyticsEventId } from '@/lib/beta/analytics-event-id';
import { betaAnalyticsProperties, type BetaAttribution } from '@/lib/beta/attribution';

export type BetaConversionEvent =
  | 'beta_application_submitted'
  | 'beta_google_signin_started'
  | 'beta_signup_completed';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CAPTURE_TIMEOUT_MS = 1500;

export function sanitizeAnalyticsDistinctId(value: unknown): string | null {
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value.toLowerCase() : null;
}

function fallbackDistinctId(applicationId: string): string {
  return `beta-application-${applicationId}`;
}

export async function captureBetaConversionEvent({
  event,
  applicationId,
  analyticsDistinctId,
  attribution,
}: {
  event: BetaConversionEvent;
  applicationId: string;
  analyticsDistinctId?: unknown;
  attribution: BetaAttribution;
}): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return false;

  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/$/, '');
  const distinctId = sanitizeAnalyticsDistinctId(analyticsDistinctId) ?? fallbackDistinctId(applicationId);
  const uuid = betaAnalyticsEventId(applicationId, event);

  try {
    const response = await fetch(`${host}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        ...(uuid ? { uuid } : {}),
        properties: {
          $process_person_profile: false,
          ...betaAnalyticsProperties(attribution),
        },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(CAPTURE_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error(`[beta/analytics] ${event} capture failed with status ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    const reason = error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'network error';
    console.error(`[beta/analytics] ${event} capture failed: ${reason}`);
    return false;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EVENT_VARIANTS: Record<string, number> = {
  beta_application_submitted: 0x01,
  beta_google_signin_started: 0x02,
  beta_signup_completed: 0x03,
};

/**
 * Derive a stable, valid UUID from the opaque beta-application UUID. PostHog
 * deduplicates captures with the same UUID, so retries remain safe across page
 * reloads and OAuth navigation.
 */
export function betaAnalyticsEventId(applicationId: string | null | undefined, event: string): string | undefined {
  if (!applicationId || !UUID_PATTERN.test(applicationId)) return undefined;

  const variant = EVENT_VARIANTS[event];
  if (!variant) return undefined;

  const compact = applicationId.toLowerCase().replaceAll('-', '');
  const firstByte = Number.parseInt(compact.slice(0, 2), 16) ^ variant;
  const derived = `${firstByte.toString(16).padStart(2, '0')}${compact.slice(2)}`;

  return `${derived.slice(0, 8)}-${derived.slice(8, 12)}-${derived.slice(12, 16)}-${derived.slice(16, 20)}-${derived.slice(20)}`;
}

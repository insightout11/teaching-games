import { describe, expect, it } from 'vitest';
import { betaAnalyticsEventId } from './analytics-event-id';

const APPLICATION_ID = '11111111-1111-4111-8111-111111111111';

describe('betaAnalyticsEventId', () => {
  it('derives stable, distinct valid UUIDs for retry-safe funnel events', () => {
    const submitted = betaAnalyticsEventId(APPLICATION_ID, 'beta_application_submitted');
    const signin = betaAnalyticsEventId(APPLICATION_ID, 'beta_google_signin_started');
    const completed = betaAnalyticsEventId(APPLICATION_ID, 'beta_signup_completed');

    expect(new Set([submitted, signin, completed]).size).toBe(3);
    for (const eventId of [submitted, signin, completed]) {
      expect(eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
    }
    expect(betaAnalyticsEventId(APPLICATION_ID, 'beta_signup_completed')).toBe(completed);
  });

  it('does not manufacture event IDs from invalid or unknown input', () => {
    expect(betaAnalyticsEventId('not-an-id', 'beta_signup_completed')).toBeUndefined();
    expect(betaAnalyticsEventId(APPLICATION_ID, 'unknown')).toBeUndefined();
  });
});

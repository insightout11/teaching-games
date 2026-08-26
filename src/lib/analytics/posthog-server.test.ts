import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureBetaConversionEvent, sanitizeAnalyticsDistinctId } from './posthog-server';
import { sanitizeBetaAttribution } from '@/lib/beta/attribution';

describe('PostHog server beta conversion delivery', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'public-test-key');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://us.i.posthog.com/');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('accepts only UUID analytics identities', () => {
    expect(sanitizeAnalyticsDistinctId('AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA')).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(sanitizeAnalyticsDistinctId('teacher@example.com')).toBeNull();
    expect(sanitizeAnalyticsDistinctId('not-a-uuid')).toBeNull();
  });

  it('sends an immediate retry-safe event with only privacy-safe properties', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const attribution = sanitizeBetaAttribution({
      referrer: 'https://example.com/private?email=teacher@example.com',
      utmSource: 'Reddit', utmMedium: 'organic', utmCampaign: 'teacher@example.com', utmContent: 'launch-1',
    });

    await expect(captureBetaConversionEvent({
      event: 'beta_application_submitted',
      applicationId: '11111111-1111-4111-8111-111111111111',
      analyticsDistinctId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      attribution,
    })).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://us.i.posthog.com/i/v0/e/');
    const payload = JSON.parse(String(init.body));
    expect(payload).toEqual({
      api_key: 'public-test-key',
      event: 'beta_application_submitted',
      distinct_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      uuid: '10111111-1111-4111-8111-111111111111',
      properties: {
        $process_person_profile: false,
        program: 'founding-captains', landing_path: '/beta', utm_source: 'reddit',
        utm_medium: 'organic', utm_campaign: null, utm_content: 'launch-1',
      },
    });
    expect(JSON.stringify(payload)).not.toContain('teacher@example.com');
    expect(JSON.stringify(payload)).not.toContain('referrer');
  });

  it('does not interfere with the funnel when delivery fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(captureBetaConversionEvent({
      event: 'beta_signup_completed',
      applicationId: '11111111-1111-4111-8111-111111111111',
      attribution: sanitizeBetaAttribution(null),
    })).resolves.toBe(false);
  });
});

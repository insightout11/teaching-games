import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  error: null as { message: string } | null,
  analytics: [] as Record<string, unknown>[],
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({ data: state.row, error: state.error }),
      };
      return chain;
    },
  }),
}));

vi.mock('@/lib/analytics/posthog-server', () => ({
  sanitizeAnalyticsDistinctId: (value: unknown) => value,
  captureBetaConversionEvent: async (args: Record<string, unknown>) => {
    state.analytics.push(args);
    return true;
  },
}));

import { POST } from '@/app/api/beta/analytics/google-signin/route';

function request(applicationId?: string) {
  return new NextRequest('http://localhost/api/beta/analytics/google-signin', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(applicationId ? { cookie: `lc-beta-application=${applicationId}` } : {}),
    },
    body: JSON.stringify({ analyticsDistinctId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }),
  });
}

describe('POST /api/beta/analytics/google-signin', () => {
  beforeEach(() => { state.row = null; state.error = null; state.analytics = []; });

  it('requires the opaque application cookie', async () => {
    expect((await POST(request())).status).toBe(400);
    expect(state.analytics).toEqual([]);
  });

  it('captures a retry-safe event from stored sanitized attribution', async () => {
    state.row = {
      landing_path: '/private', referrer: 'https://example.com/?email=teacher@example.com',
      utm_source: 'Reddit', utm_medium: 'organic', utm_campaign: 'teacher@example.com',
      utm_content: 'launch-1', utm_term: null,
    };
    const applicationId = '11111111-1111-4111-8111-111111111111';
    expect((await POST(request(applicationId))).status).toBe(200);
    expect(state.analytics).toEqual([expect.objectContaining({
      event: 'beta_google_signin_started', applicationId,
      analyticsDistinctId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      attribution: expect.objectContaining({
        landingPath: '/beta', utmSource: 'reddit', utmCampaign: null,
      }),
    })]);
  });

  it('does not emit when the cookie does not resolve to an application', async () => {
    expect((await POST(request('11111111-1111-4111-8111-111111111111'))).status).toBe(404);
    expect(state.analytics).toEqual([]);
  });
});

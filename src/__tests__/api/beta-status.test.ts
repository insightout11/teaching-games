import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  userId: 'teacher' as string | null,
  rows: [] as Record<string, unknown>[],
  existing: null as Record<string, unknown> | null,
  error: null as { message: string } | null,
  claims: 0,
  analytics: [] as Record<string, unknown>[],
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({ auth: { getUser: async () => ({ data: { user: state.userId ? { id: state.userId } : null } }) } }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => {
      let operation: 'read' | 'update' = 'read';
      const chain: Record<string, unknown> = {
        update: () => { operation = 'update'; return chain; }, eq: () => chain, is: () => chain,
        select: () => {
          if (operation === 'read') return chain;
          state.claims += 1;
          const rows = state.claims === 1 ? state.rows : [];
          return Promise.resolve({ data: rows, error: state.error });
        },
        maybeSingle: async () => ({ data: state.existing, error: state.error }),
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

import { POST } from '@/app/api/beta/status/route';

describe('POST /api/beta/status atomic claim', () => {
  const request = () => new Request('http://localhost/api/beta/status', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ analyticsDistinctId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }),
  });

  beforeEach(() => { state.userId = 'teacher'; state.rows = []; state.existing = null; state.error = null; state.claims = 0; state.analytics = []; });

  it('requires authentication', async () => {
    state.userId = null;
    expect((await POST(request())).status).toBe(401);
  });

  it('returns not claimed when the teacher has no beta row', async () => {
    expect(await (await POST(request())).json()).toEqual({ claimed: false });
  });

  it('returns one deterministic retry identity with sanitized properties', async () => {
    const row = { id: '11111111-1111-4111-8111-111111111111', landing_path: '/private', referrer: 'https://example.com/?token=x', utm_source: 'Reddit', utm_medium: 'organic', utm_campaign: 'teacher@example.com', utm_content: 'clip-1', utm_term: null };
    state.rows = [row];
    state.existing = row;
    const expected = { claimed: true, analyticsCaptured: true };
    expect(await (await POST(request())).json()).toEqual(expected);
    expect(await (await POST(request())).json()).toEqual(expected);
    expect(state.analytics).toHaveLength(2);
    expect(state.analytics[0]).toEqual(expect.objectContaining({
      event: 'beta_signup_completed',
      applicationId: row.id,
      analyticsDistinctId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      attribution: expect.objectContaining({ utmSource: 'reddit', utmCampaign: null }),
    }));
  });

  it('fails loudly on claim errors', async () => {
    state.error = { message: 'db down' };
    expect((await POST(request())).status).toBe(500);
  });
});

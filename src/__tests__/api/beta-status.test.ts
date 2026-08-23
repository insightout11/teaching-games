import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  userId: 'teacher' as string | null,
  rows: [] as Record<string, unknown>[],
  error: null as { message: string } | null,
  claims: 0,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({ auth: { getUser: async () => ({ data: { user: state.userId ? { id: state.userId } : null } }) } }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => {
      const chain: Record<string, unknown> = {
        update: () => chain, eq: () => chain, is: () => chain,
        select: async () => {
          state.claims += 1;
          const rows = state.claims === 1 ? state.rows : [];
          return { data: rows, error: state.error };
        },
      };
      return chain;
    },
  }),
}));

import { POST } from '@/app/api/beta/status/route';

describe('POST /api/beta/status atomic claim', () => {
  beforeEach(() => { state.userId = 'teacher'; state.rows = []; state.error = null; state.claims = 0; });

  it('requires authentication', async () => {
    state.userId = null;
    expect((await POST()).status).toBe(401);
  });

  it('returns not claimed for no beta row or an already claimed row', async () => {
    expect(await (await POST()).json()).toEqual({ claimed: false });
  });

  it('allows only one of two claims and returns sanitized properties', async () => {
    state.rows = [{ landing_path: '/private', referrer: 'https://example.com/?token=x', utm_source: 'Reddit', utm_medium: 'organic', utm_campaign: 'teacher@example.com', utm_content: 'clip-1', utm_term: null }];
    expect(await (await POST()).json()).toEqual({ claimed: true, properties: {
      program: 'founding-captains', landing_path: '/beta', utm_source: 'reddit',
      utm_medium: 'organic', utm_campaign: null, utm_content: 'clip-1',
    } });
    expect(await (await POST()).json()).toEqual({ claimed: false });
  });

  it('fails loudly on claim errors', async () => {
    state.error = { message: 'db down' };
    expect((await POST()).status).toBe(500);
  });
});

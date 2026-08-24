import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  userId: 'teacher' as string | null,
  rows: [] as Record<string, unknown>[],
  existing: null as Record<string, unknown> | null,
  error: null as { message: string } | null,
  claims: 0,
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

import { POST } from '@/app/api/beta/status/route';

describe('POST /api/beta/status atomic claim', () => {
  beforeEach(() => { state.userId = 'teacher'; state.rows = []; state.existing = null; state.error = null; state.claims = 0; });

  it('requires authentication', async () => {
    state.userId = null;
    expect((await POST()).status).toBe(401);
  });

  it('returns not claimed when the teacher has no beta row', async () => {
    expect(await (await POST()).json()).toEqual({ claimed: false });
  });

  it('returns one deterministic retry identity with sanitized properties', async () => {
    const row = { id: '11111111-1111-4111-8111-111111111111', landing_path: '/private', referrer: 'https://example.com/?token=x', utm_source: 'Reddit', utm_medium: 'organic', utm_campaign: 'teacher@example.com', utm_content: 'clip-1', utm_term: null };
    state.rows = [row];
    state.existing = row;
    const expected = { claimed: true, applicationId: row.id, properties: {
      program: 'founding-captains', landing_path: '/beta', utm_source: 'reddit',
      utm_medium: 'organic', utm_campaign: null, utm_content: 'clip-1',
    } };
    expect(await (await POST()).json()).toEqual(expected);
    expect(await (await POST()).json()).toEqual(expected);
  });

  it('fails loudly on claim errors', async () => {
    state.error = { message: 'db down' };
    expect((await POST()).status).toBe(500);
  });
});

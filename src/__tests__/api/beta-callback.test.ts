import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  exchangeError: null as { message: string } | null,
  user: { id: 'teacher-id', email: 'teacher@example.com' } as { id: string; email: string } | null,
  application: null as null | {
    id: string;
    email_normalized: string;
    status: string;
    teacher_id: string | null;
    signed_up_at: string | null;
  },
  update: null as Record<string, unknown> | null,
  serviceCalls: 0,
  readError: null as { message: string } | null,
  updateError: null as { message: string } | null,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: {
      exchangeCodeForSession: async () => ({ error: state.exchangeError }),
      getUser: async () => ({ data: { user: state.user } }),
    },
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => {
    state.serviceCalls += 1;
    return {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.application, error: state.readError }) }) }),
        update: (value: Record<string, unknown>) => {
          state.update = value;
          return { eq: async () => ({ error: state.updateError }) };
        },
      }),
    };
  },
}));

import { GET } from '@/app/(auth)/callback/route';

const applicationId = '11111111-1111-4111-8111-111111111111';

describe('OAuth callback beta linkage', () => {
  beforeEach(() => {
    state.exchangeError = null;
    state.user = { id: 'teacher-id', email: 'teacher@example.com' };
    state.application = null;
    state.update = null;
    state.serviceCalls = 0;
    state.readError = null;
    state.updateError = null;
  });

  it('keeps ordinary non-beta OAuth unchanged', async () => {
    const response = await GET(new Request('https://lessoncaptain.com/callback?code=ok&next=/home'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://lessoncaptain.com/home');
    expect(state.serviceCalls).toBe(0);
  });

  it('retains open-redirect protection', async () => {
    const protocolRelative = await GET(new Request('https://lessoncaptain.com/callback?code=ok&next=//evil.example'));
    const absolute = await GET(new Request('https://lessoncaptain.com/callback?code=ok&next=https%3A%2F%2Fevil.example'));
    expect(protocolRelative.headers.get('location')).toBe('https://lessoncaptain.com/home');
    expect(absolute.headers.get('location')).toBe('https://lessoncaptain.com/home');
  });

  it('links a matching application and clears the opaque cookie', async () => {
    state.application = {
      id: applicationId,
      email_normalized: 'teacher@example.com',
      status: 'applied',
      teacher_id: null,
      signed_up_at: null,
    };
    const response = await GET(new Request('https://lessoncaptain.com/callback?code=ok', {
      headers: { cookie: `lc-beta-application=${applicationId}` },
    }));
    expect(state.update).toMatchObject({ teacher_id: 'teacher-id', status: 'signed_up' });
    expect(response.headers.get('set-cookie')).toContain('lc-beta-application=');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=lax');
  });

  it('does not link a mismatched email and redirects to a safe explanation', async () => {
    state.application = {
      id: applicationId,
      email_normalized: 'different@example.com',
      status: 'applied',
      teacher_id: null,
      signed_up_at: null,
    };
    const response = await GET(new Request('https://lessoncaptain.com/callback?code=ok', {
      headers: { cookie: `lc-beta-application=${applicationId}` },
    }));
    expect(state.update).toBeNull();
    expect(response.headers.get('location')).toBe('https://lessoncaptain.com/beta?status=account-mismatch');
  });

  it('ignores an invalid beta cookie safely', async () => {
    const response = await GET(new Request('https://lessoncaptain.com/callback?code=ok', {
      headers: { cookie: 'lc-beta-application=not-a-uuid' },
    }));
    expect(response.headers.get('location')).toBe('https://lessoncaptain.com/home');
    expect(state.serviceCalls).toBe(0);
  });

  it('shows a recoverable linkage error for missing records and transient service failures', async () => {
    const makeRequest = () => new Request('https://lessoncaptain.com/callback?code=ok', { headers: { cookie: `lc-beta-application=${applicationId}` } });
    expect((await GET(makeRequest())).headers.get('location')).toBe('https://lessoncaptain.com/beta?status=linkage-error');
    state.application = { id: applicationId, email_normalized: 'teacher@example.com', status: 'applied', teacher_id: null, signed_up_at: null };
    state.updateError = { message: 'db down' };
    expect((await GET(makeRequest())).headers.get('location')).toBe('https://lessoncaptain.com/beta?status=linkage-error');
  });

  it('does not downgrade an advanced lifecycle status', async () => {
    state.application = { id: applicationId, email_normalized: 'teacher@example.com', status: 'retained', teacher_id: 'teacher-id', signed_up_at: '2026-01-01T00:00:00Z' };
    await GET(new Request('https://lessoncaptain.com/callback?code=ok', { headers: { cookie: `lc-beta-application=${applicationId}` } }));
    expect(state.update).toEqual({ teacher_id: 'teacher-id' });
  });
});

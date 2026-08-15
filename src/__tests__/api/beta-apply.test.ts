import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

type Existing = { id: string; teacher_id: string | null; status: string; signed_up_at: string | null };
const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  existing: null as Existing | null,
  concurrent: null as Existing | null,
  inserted: null as Record<string, unknown> | null,
  updates: [] as Record<string, unknown>[],
  rpcResults: [] as string[],
  rpcCalls: [] as Record<string, unknown>[],
  rpcError: null as { message: string } | null,
  eqCalls: [] as [string, unknown][],
  insertError: null as { code?: string; message?: string } | null,
  readError: null as { message: string } | null,
  updateError: null as { message: string } | null,
}));

function resultFor() {
  return { data: state.existing, error: state.readError };
}

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    rpc: async (_name: string, args: Record<string, unknown>) => {
      state.rpcCalls.push(args);
      return { data: state.rpcResults.shift() ?? 'allowed', error: state.rpcError };
    },
    from: () => {
      const mode = 'read';
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: (column: string, value: unknown) => { state.eqCalls.push([column, value]); return chain; },
        gte: () => chain,
        is: () => chain,
        maybeSingle: async () => resultFor(),
        single: async () => state.concurrent
          ? { data: state.concurrent, error: null }
          : { data: { id: '11111111-1111-4111-8111-111111111111' }, error: state.insertError },
        insert: (value: Record<string, unknown>) => {
          state.inserted = value;
          return chain;
        },
        update: (value: Record<string, unknown>) => {
          state.updates.push(value);
          return chain;
        },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(
          mode === 'read' && state.updateError && state.updates.length
            ? { error: state.updateError }
            : resultFor()
        ).then(resolve),
      };
      return chain;
    },
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));

import { POST } from '@/app/api/beta/apply/route';

const validBody = {
  email: ' Teacher@Example.com ', firstName: 'Ada', teachingFormat: 'online',
  learnerLevels: ['intermediate'], contactConsent: true, website: '',
  biggestChallenge: 'More student participation',
  attribution: { landingPath: '/anything', referrer: 'https://example.com/post?token=secret', utmSource: 'Reddit' },
};

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/beta/apply', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.8', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/beta/apply remediation', () => {
  beforeEach(() => {
    Object.assign(state, { user: null, existing: null, concurrent: null, inserted: null, rpcError: null, insertError: null, readError: null, updateError: null });
    state.updates = [];
    state.rpcResults = [];
    state.rpcCalls = [];
    state.eqCalls = [];
    vi.stubEnv('PUBLIC_DEMO_IP_SALT', 'test-salt');
    vi.stubEnv('NODE_ENV', 'test');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('persists normalized data and sanitized first-touch attribution', async () => {
    const response = await POST(request(validBody));
    expect(await response.json()).toEqual({ ok: true, next: '/login?next=/home' });
    expect(state.inserted).toMatchObject({ email_normalized: 'teacher@example.com', landing_path: '/beta', referrer: 'https://example.com/post', utm_source: 'reddit' });
    expect(state.rpcCalls[0].p_ip_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(state.rpcCalls)).not.toContain('203.0.113.8');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=lax');
  });

  it('rejects non-online teaching formats before abuse or persistence work', async () => {
    for (const teachingFormat of ['in-person', 'hybrid']) {
      const response = await POST(request({ ...validBody, teachingFormat }));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Choose a teaching format' });
    }
    expect(state.rpcCalls).toEqual([]);
    expect(state.inserted).toBeNull();
  });

  it('makes a signed-out duplicate a complete no-op while setting the opaque cookie', async () => {
    state.existing = { id: '22222222-2222-4222-8222-222222222222', teacher_id: null, status: 'applied', signed_up_at: null };
    const response = await POST(request({ ...validBody, firstName: 'Attacker', biggestChallenge: 'overwrite' }));
    expect(response.status).toBe(200);
    expect(state.inserted).toBeNull();
    expect(state.updates).toEqual([]);
    expect(response.headers.get('set-cookie')).toContain(state.existing.id);
  });

  it('allows profile updates only for the authenticated owner and does not downgrade lifecycle', async () => {
    state.user = { id: 'teacher', email: 'teacher@example.com' };
    state.existing = { id: 'app', teacher_id: 'teacher', status: 'activated', signed_up_at: '2026-01-01T00:00:00Z' };
    const response = await POST(request({ ...validBody, firstName: 'Updated' }));
    expect(await response.json()).toEqual({ ok: true, next: '/home' });
    expect(state.updates[0]).toMatchObject({ first_name: 'Updated' });
    expect(state.updates[1]).toEqual({ teacher_id: 'teacher' });
    expect(state.eqCalls).toContainEqual(['teacher_id', 'teacher']);
  });

  it('does not mutate when an authenticated email or owner differs', async () => {
    state.user = { id: 'other', email: 'other@example.com' };
    state.existing = { id: 'app', teacher_id: 'teacher', status: 'signed_up', signed_up_at: '2026-01-01T00:00:00Z' };
    const response = await POST(request(validBody));
    expect(await response.json()).toEqual({ ok: true, next: '/beta?status=account-mismatch' });
    expect(state.updates).toEqual([]);
  });

  it('links a matching signed-in applicant without another OAuth loop', async () => {
    state.user = { id: 'teacher', email: 'teacher@example.com' };
    const response = await POST(request(validBody));
    expect(await response.json()).toEqual({ ok: true, next: '/home' });
    expect(state.updates.at(-1)).toMatchObject({ teacher_id: 'teacher', status: 'signed_up' });
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('silently accepts honeypots without abuse or application writes', async () => {
    const response = await POST(request({ ...validBody, website: 'spam' }));
    expect(response.status).toBe(200);
    expect(state.rpcCalls).toEqual([]);
    expect(state.inserted).toBeNull();
  });

  it('rejects declared and actual oversized bodies before persistence', async () => {
    const declared = await POST(request(validBody, { 'content-length': String(30 * 1024) }));
    expect(declared.status).toBe(413);
    const actual = await POST(request({ ...validBody, biggestChallenge: 'x'.repeat(25 * 1024) }));
    expect(actual.status).toBe(413);
    expect(state.rpcCalls).toEqual([]);
  });

  it('enforces per-IP and global limits', async () => {
    state.rpcResults = ['ip_limited'];
    expect((await POST(request(validBody))).status).toBe(429);
    state.rpcResults = ['global_limited'];
    expect((await POST(request(validBody))).status).toBe(429);
  });

  it('requires the approved abuse salt in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PUBLIC_DEMO_IP_SALT', '');
    expect((await POST(request(validBody))).status).toBe(503);
    expect(state.rpcCalls).toEqual([]);
  });

  it('relies on one atomic RPC result per concurrent request', async () => {
    state.existing = { id: 'app', teacher_id: null, status: 'applied', signed_up_at: null };
    state.rpcResults = [...Array(10).fill('allowed'), 'ip_limited', 'ip_limited'];
    const responses = await Promise.all(Array.from({ length: 12 }, () => POST(request(validBody))));
    expect(responses.filter((response) => response.status === 200)).toHaveLength(10);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(2);
    expect(state.rpcCalls).toHaveLength(12);
  });

  it('fails generically when the atomic RPC fails or returns an unknown result', async () => {
    state.rpcError = { message: 'rpc failed' };
    expect((await POST(request(validBody))).status).toBe(500);
    state.rpcError = null;
    state.rpcResults = ['unexpected'];
    expect((await POST(request(validBody))).status).toBe(500);
  });

  it('recovers a concurrent unique-email insert without overwriting answers', async () => {
    state.insertError = { code: '23505' };
    state.concurrent = { id: 'concurrent', teacher_id: null, status: 'applied', signed_up_at: null };
    const response = await POST(request(validBody));
    expect(response.status).toBe(200);
    expect(state.updates).toEqual([]);
  });

  it('returns generic errors for application read and update failures', async () => {
    state.readError = { message: 'db read failed' };
    expect((await POST(request(validBody))).status).toBe(500);
    state.readError = null;
    state.user = { id: 'teacher', email: 'teacher@example.com' };
    state.existing = { id: 'app', teacher_id: 'teacher', status: 'signed_up', signed_up_at: 'date' };
    state.updateError = { message: 'db update failed' };
    expect((await POST(request(validBody))).status).toBe(500);
  });
});

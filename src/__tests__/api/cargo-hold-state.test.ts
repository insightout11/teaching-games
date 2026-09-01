/**
 * The Cargo Hold recovery-state route: ownership, compare-and-set, and failing soft
 * when migration 056 has not been applied yet.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  teacher: { id: 'teacher-1' } as { id: string } | null,
  owns: true,
  row: null as { payload: unknown; sequence: number } | null,
  readError: null as { message: string } | null,
  rpcCalls: [] as Array<{ name: string; args: Record<string, unknown> }>,
  rpcError: null as { message: string } | null,
  table: '' as string,
  /** Stands in for the row the database CAS actually keeps. */
  stored: { sequence: 0, payload: null as unknown },
}));

vi.mock('@/lib/auth-credits', () => ({
  requireAuth: async () =>
    state.teacher
      ? { teacher: state.teacher, error: null }
      : { teacher: null, error: new Response('no', { status: 401 }) },
}));

vi.mock('@/lib/session-ownership', () => ({
  verifyTeacherOwnsSession: async () =>
    state.owns ? { error: null } : { error: new Response('forbidden', { status: 403 }) },
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      state.table = table;
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({ data: state.row, error: state.readError }),
      };
      return chain;
    },
    // Mirrors migration 056's cargo_hold_state_save: the comparison happens inside
    // the write, so a later-arriving older sequence is simply not applied.
    rpc: async (name: string, args: Record<string, unknown>) => {
      state.rpcCalls.push({ name, args });
      if (state.rpcError) return { data: null, error: state.rpcError };
      const incoming = args.p_sequence as number;
      const applied = incoming > state.stored.sequence;
      if (applied) {
        state.stored = { sequence: incoming, payload: args.p_payload };
      }
      return {
        data: [{ applied, current_sequence: state.stored.sequence }],
        error: null,
      };
    },
  }),
}));

import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/session/cargo-hold-state/route';

const SESSION = '11111111-2222-3333-4444-555555555555';

function putRequest(body: unknown) {
  return new NextRequest('http://localhost/api/session/cargo-hold-state', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

function getRequest(sessionId: string) {
  return new NextRequest(`http://localhost/api/session/cargo-hold-state?sessionId=${sessionId}`);
}

describe('cargo-hold-state route', () => {
  beforeEach(() => {
    state.teacher = { id: 'teacher-1' };
    state.owns = true;
    state.row = null;
    state.readError = null;
    state.rpcCalls = [];
    state.rpcError = null;
    state.table = '';
    state.stored = { sequence: 0, payload: null };
  });

  it('requires an authenticated teacher', async () => {
    state.teacher = null;
    expect((await GET(getRequest(SESSION))).status).toBe(401);
    expect((await PUT(putRequest({ sessionId: SESSION, state: {}, sequence: 1 }))).status).toBe(401);
  });

  it('requires session ownership', async () => {
    state.owns = false;
    expect((await PUT(putRequest({ sessionId: SESSION, state: {}, sequence: 1 }))).status).toBe(403);
  });

  it('rejects a malformed session id', async () => {
    expect((await GET(getRequest('not-a-uuid'))).status).toBe(400);
    expect((await PUT(putRequest({ sessionId: 'nope', state: {}, sequence: 1 }))).status).toBe(400);
  });

  it('writes through the service-role-only table, never session_private_state', async () => {
    await PUT(putRequest({ sessionId: SESSION, state: { phase: 'choosing' }, sequence: 4 }));
    expect(state.rpcCalls).toHaveLength(1);
    expect(state.rpcCalls[0].name).toBe('cargo_hold_state_save');
    expect(state.rpcCalls[0].args.p_sequence).toBe(4);
  });

  it('compares sequences inside the database, not in application code', async () => {
    await PUT(putRequest({ sessionId: SESSION, state: {}, sequence: 1 }));
    // No read-then-compare: the route must not select the sequence first.
    expect(state.table).toBe('');
  });

  it('applies a newer sequence', async () => {
    state.stored = { sequence: 2, payload: {} };
    const json = await (await PUT(putRequest({ sessionId: SESSION, state: { phase: 'choosing' }, sequence: 3 }))).json();
    expect(json.applied).toBe(true);
    expect(state.stored.sequence).toBe(3);
  });

  it('does not roll state back when an older save arrives last', async () => {
    // The race the read-then-write version lost: 6 commits, then 5 arrives.
    await PUT(putRequest({ sessionId: SESSION, state: { phase: 'voting' }, sequence: 6 }));
    const late = await (await PUT(putRequest({ sessionId: SESSION, state: { phase: 'choosing' }, sequence: 5 }))).json();

    expect(late.applied).toBe(false);
    expect(late.stale).toBe(true);
    expect(late.sequence).toBe(6);
    expect(state.stored.sequence).toBe(6);
    expect(state.stored.payload).toEqual({ phase: 'voting' });
  });

  it('rejects two concurrent saves reading the same start point, keeping the newer', async () => {
    state.stored = { sequence: 4, payload: { phase: 'reading' } };
    const [a, b] = await Promise.all([
      PUT(putRequest({ sessionId: SESSION, state: { phase: 'voting' }, sequence: 6 })).then((r) => r.json()),
      PUT(putRequest({ sessionId: SESSION, state: { phase: 'choosing' }, sequence: 5 })).then((r) => r.json()),
    ]);
    const applied = [a, b].filter((r) => r.applied);
    expect(applied).toHaveLength(1);
    expect(state.stored.sequence).toBe(6);
    expect(state.stored.payload).toEqual({ phase: 'voting' });
  });

  it('does not apply a repeated save of the same sequence', async () => {
    await PUT(putRequest({ sessionId: SESSION, state: { phase: 'result' }, sequence: 5 }));
    const repeat = await (await PUT(putRequest({ sessionId: SESSION, state: { phase: 'result' }, sequence: 5 }))).json();
    expect(repeat.applied).toBe(false);
  });

  it('rejects an oversized payload before touching the database', async () => {
    const huge = { blob: 'x'.repeat(300_000) };
    const res = await PUT(putRequest({ sessionId: SESSION, state: huge, sequence: 1 }));
    expect(res.status).toBe(413);
    expect(state.rpcCalls).toHaveLength(0);
  });

  it('returns stored state on GET', async () => {
    state.row = { payload: { phase: 'voting' }, sequence: 7 };
    const json = await (await GET(getRequest(SESSION))).json();
    expect(json.state).toEqual({ phase: 'voting' });
    expect(json.sequence).toBe(7);
  });

  it('fails soft on PUT when the save function is missing', async () => {
    state.rpcError = { message: 'function cargo_hold_state_save does not exist' };
    const json = await (await PUT(putRequest({ sessionId: SESSION, state: {}, sequence: 1 }))).json();
    expect(json.unavailable).toBe(true);
    expect(json.success).toBe(false);
  });

  it('fails soft when the table is missing, so a live round is never taken down', async () => {
    // This is the state of the world until migration 056 is applied.
    state.readError = { message: 'relation "cargo_hold_state" does not exist' };
    const res = await GET(getRequest(SESSION));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.state).toBeNull();
    expect(json.unavailable).toBe(true);
  });
});

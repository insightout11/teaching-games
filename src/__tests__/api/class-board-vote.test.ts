import { beforeEach, describe, expect, it, vi } from 'vitest';

const S = '11111111-1111-4111-8111-111111111111';
const C = '22222222-2222-4222-8222-222222222222';
const item = (n: number) => `33333333-3333-4333-8333-33333333333${n}`;

let votes: Array<{ item_id: string; client_id: string }> = [];
const upsert = vi.fn(async (row: { item_id: string; client_id: string }) => { votes.push(row); return { error: null }; });

// A tiny stand-in for the Supabase query builder: enough for the vote route.
function query(table: string) {
  const filters: Record<string, unknown> = {};
  let inIds: string[] | null = null;
  let mode: 'select' | 'delete' = 'select';
  const run = () => {
    if (table === 'class_board_items') {
      if (filters.id) return { data: { id: filters.id, session_id: S, visibility: 'visible', board_key: 'b1' } };
      return { data: [1, 2, 3, 4, 5].map((n) => ({ id: item(n) })) };
    }
    if (table === 'sessions') return { data: { status: 'active', started_at: new Date().toISOString() } };
    if (table === 'session_participants') return { data: { client_id: C } };
    if (table === 'class_board_votes') {
      if (mode === 'delete') {
        votes = votes.filter((v) => !(v.item_id === filters.item_id && v.client_id === filters.client_id));
        return { error: null };
      }
      return { data: votes.filter((v) => v.client_id === filters.client_id && (!inIds || inIds.includes(v.item_id))) };
    }
    return { data: null };
  };
  const b: Record<string, unknown> = {
    select: () => b,
    delete: () => { mode = 'delete'; return b; },
    eq: (k: string, v: unknown) => { filters[k] = v; return b; },
    in: (_k: string, ids: string[]) => { inIds = ids; return b; },
    single: async () => run(),
    maybeSingle: async () => run(),
    upsert,
    then: (resolve: (v: unknown) => void) => resolve(run()),
  };
  return b;
}

vi.mock('@/lib/supabase/service', () => ({ createServiceClient: () => ({ from: query }) }));
vi.mock('@/lib/session-freshness', () => ({ isSessionStale: () => false }));

import { DELETE, POST } from '@/app/api/class-board/vote/route';
import { NextRequest } from 'next/server';

const call = (fn: typeof POST, n: number) =>
  fn(new NextRequest('http://x', { method: 'POST', body: JSON.stringify({ sessionId: S, itemId: item(n), clientId: C }) }));

describe('class board dot voting', () => {
  beforeEach(() => { votes = []; upsert.mockClear(); });

  it('gives each student three dots per board', async () => {
    expect((await (await call(POST, 1)).json()).dotsLeft).toBe(2);
    expect((await (await call(POST, 2)).json()).dotsLeft).toBe(1);
    expect((await (await call(POST, 3)).json()).dotsLeft).toBe(0);
    const fourth = await call(POST, 4);
    expect(fourth.status).toBe(409);
    expect(upsert).toHaveBeenCalledTimes(3);
  });

  it('lets a student take a dot back and place it elsewhere', async () => {
    await call(POST, 1); await call(POST, 2); await call(POST, 3);
    expect((await (await call(DELETE, 2)).json()).dotsLeft).toBe(1);
    expect((await call(POST, 4)).status).toBe(200);
  });

  it('does not spend a dot twice on the same idea', async () => {
    await call(POST, 1);
    expect((await (await call(POST, 1)).json()).dotsLeft).toBe(2);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});

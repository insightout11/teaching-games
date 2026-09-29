import { beforeEach, describe, expect, it, vi } from 'vitest';

const P = '11111111-1111-4111-8111-111111111111';
const S = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';

let rows: Array<Record<string, unknown>> = [];
let pollActive = true;

function query(table: string) {
  const f: Record<string, unknown> = {};
  let mode: 'select' | 'delete' = 'select';
  const b: Record<string, unknown> = {
    select: () => b,
    delete: () => { mode = 'delete'; return b; },
    eq: (k: string, v: unknown) => {
      f[k] = v;
      if (mode === 'delete' && table === 'student_submissions' && k === 'game_key') {
        rows = rows.filter((r) => !(r.client_id === f.client_id && r.game_key === v));
      }
      return b;
    },
    insert: async (row: Record<string, unknown>) => { rows.push(row); return { error: null }; },
    maybeSingle: async () => {
      if (table === 'polls') return { data: { id: P, session_id: S, options: ['Mumbai', 'Delhi'], is_active: pollActive } };
      if (table === 'sessions') return { data: { status: 'active', started_at: new Date().toISOString() } };
      if (table === 'session_participants') return { data: { client_id: C } };
      return { data: null };
    },
  };
  return b;
}

vi.mock('@/lib/supabase/service', () => ({ createServiceClient: () => ({ from: query }) }));
vi.mock('@/lib/session-freshness', () => ({ isSessionStale: () => false }));

import { POST } from '@/app/api/student/poll-reason/route';
import { NextRequest } from 'next/server';

const post = (body: unknown) => POST(new NextRequest('http://x', { method: 'POST', body: JSON.stringify(body) }));
const base = { pollId: P, sessionId: S, clientId: C, displayName: 'Mia' };

describe('poll reasons', () => {
  beforeEach(() => { rows = []; pollActive = true; });

  it('stores a reason, and a new one replaces the old', async () => {
    expect((await post({ ...base, choice: 'Mumbai', reason: 'Street food!' })).status).toBe(200);
    expect((await post({ ...base, choice: 'Delhi', reason: 'Mia changed her mind: the Red Fort' })).status).toBe(200);
    expect(rows).toHaveLength(1);
    expect(JSON.parse(rows[0].content as string)).toEqual({ choice: 'Delhi', reason: 'Mia changed her mind: the Red Fort' });
    expect(rows[0]).toMatchObject({ game_key: `poll-reason:${P}`, status: 'answered' });
  });

  it('rejects closed polls, unknown choices and empty reasons', async () => {
    expect((await post({ ...base, choice: 'Tokyo', reason: 'x' })).status).toBe(400);
    expect((await post({ ...base, choice: 'Mumbai', reason: '  ' })).status).toBe(400);
    pollActive = false;
    expect((await post({ ...base, choice: 'Mumbai', reason: 'x' })).status).toBe(400);
  });
});

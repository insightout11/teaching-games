import { beforeEach, describe, expect, it, vi } from 'vitest';

// Tables: sessions (class c1: s0 oldest, s1, s2 = current; class c2: x1) and session_memory.
const sessions = [
  { id: 's0', class_id: 'c1', started_at: '2026-10-01T10:00:00Z' },
  { id: 's1', class_id: 'c1', started_at: '2026-10-03T10:00:00Z' },
  { id: 's2', class_id: 'c1', started_at: '2026-10-08T10:00:00Z' },
  { id: 'x1', class_id: 'c2', started_at: '2026-10-07T10:00:00Z' },
];
let memory: Record<string, unknown> = {};
const mem = (title: string) => ({ topics: [{ title, kind: 'note', at: '' }], words: ['lava'], material: [], activities: [], updatedAt: '' });

function table(name: string) {
  let rows: Array<Record<string, unknown>> = name === 'sessions' ? sessions : Object.entries(memory).map(([session_id, payload]) => ({ session_id, payload }));
  const q = {
    select: () => q,
    eq: (c: string, v: unknown) => { rows = rows.filter((r) => r[c] === v); return q; },
    lt: (c: string, v: string) => { rows = rows.filter((r) => String(r[c]) < v); return q; },
    in: (c: string, vs: unknown[]) => { rows = rows.filter((r) => vs.includes(r[c])); return Promise.resolve({ data: rows }); },
    order: (c: string, o: { ascending: boolean }) => { rows = [...rows].sort((a, b) => (o.ascending ? 1 : -1) * String(a[c]).localeCompare(String(b[c]))); return q; },
    limit: (n: number) => Promise.resolve({ data: rows.slice(0, n) }),
    maybeSingle: () => Promise.resolve({ data: rows[0] ?? null }),
  };
  return q;
}
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: () => ({ from: (n: string) => table(n) }) }));
vi.mock('@/lib/auth-credits', () => ({ requireAuth: async () => ({ teacher: { id: 't1' }, error: null }) }));
vi.mock('@/lib/session-ownership', () => ({ verifyTeacherOwnsSession: async () => ({ error: null }) }));

import { GET } from '@/app/api/session/lesson-memory/route';

const UUID = '11111111-1111-4111-8111-111111111111';
const get = (id: string) => GET({ nextUrl: new URL(`http://x/api/session/lesson-memory?sessionId=${id}&previous=1`) } as never);

describe('"Last time": the previous lesson of the same class', () => {
  beforeEach(() => { memory = {}; });

  it('returns the most recent earlier lesson with a record, never a later one or another class', async () => {
    // Make the current session id a UUID for the route's check, keeping its class and time.
    sessions[2].id = UUID;
    memory = { s0: mem('Dinosaurs'), s1: mem('Volcanoes'), x1: mem('Other class') };
    const d = await (await get(UUID)).json();
    expect(d.memory.topics[0].title).toBe('Volcanoes');
    expect(d.at).toBe('2026-10-03T10:00:00Z');
  });

  it('skips earlier lessons without a record, and returns nothing for a first lesson', async () => {
    memory = { s0: mem('Dinosaurs') };
    expect((await (await get(UUID)).json()).memory.topics[0].title).toBe('Dinosaurs');
    memory = {};
    expect((await (await get(UUID)).json()).memory).toBeNull();
  });
});

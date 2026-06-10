import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireAuth = vi.fn();
vi.mock('@/lib/auth-credits', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}));

// Table-keyed mock: each from(table) returns a chain whose terminal results
// are driven by per-table queues; inserts are recorded for assertions.
type Result = { data: unknown; error: unknown; count?: number | null };
const queues: Record<string, Result[]> = {};
const inserts: Array<{ table: string; values: unknown }> = [];
const deletes: string[] = [];

function next(table: string): Result {
  return queues[table]?.shift() ?? { data: null, error: null, count: 0 };
}

function makeChain(table: string) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) => {
    if (opts?.head) {
      // head-count call resolves directly after eq()
      const headChain = {
        eq: vi.fn(() => Promise.resolve(next(table))),
      };
      return headChain;
    }
    return chain;
  });
  chain.eq = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.maybeSingle = vi.fn(() => Promise.resolve(next(table)));
  chain.single = vi.fn(() => Promise.resolve(next(table)));
  chain.insert = vi.fn((values: unknown) => {
    inserts.push({ table, values });
    return {
      select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve(next(table))) })),
      then: (resolve: (r: Result) => void) => resolve({ data: null, error: null }),
    };
  });
  chain.upsert = vi.fn((values: unknown) => {
    inserts.push({ table, values });
    return Promise.resolve({ data: null, error: null });
  });
  chain.delete = vi.fn(() => ({
    eq: vi.fn((_col: string, id: string) => {
      deletes.push(`${table}:${id}`);
      return Promise.resolve({ data: null, error: null });
    }),
  }));
  return chain;
}

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: vi.fn((table: string) => makeChain(table)) }),
}));

import { POST } from '@/app/api/session/sample/route';
import { SAMPLE_STUDENTS } from '@/lib/sample-session';

const TEACHER = { id: 'teacher-1', email: 't@example.com', credits: 0, isPro: false, isDeveloper: false };

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(queues)) delete queues[key];
  inserts.length = 0;
  deletes.length = 0;
  vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false');
  mockRequireAuth.mockResolvedValue({ teacher: TEACHER, error: null });
});

describe('POST /api/session/sample', () => {
  it('returns 401 when unauthenticated', async () => {
    mockRequireAuth.mockResolvedValue({
      teacher: null,
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    });
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('reuses an existing fully-seeded sample session', async () => {
    queues.classes = [{ data: { id: 'class-demo' }, error: null }];
    queues.sessions = [{ data: { id: 'session-sample' }, error: null }];
    queues.scores = [{ data: null, error: null, count: 45 }];

    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessionId).toBe('session-sample');
    expect(data.classId).toBe('class-demo');
    expect(inserts.length).toBe(0);
    expect(deletes.length).toBe(0);
  });

  it('deletes and rebuilds a partially-seeded sample session', async () => {
    queues.classes = [{ data: { id: 'class-demo' }, error: null }];
    queues.sessions = [
      { data: { id: 'session-broken' }, error: null }, // existing found
      { data: { id: 'session-new' }, error: null },    // insert result
    ];
    queues.scores = [{ data: null, error: null, count: 0 }]; // no scores → partial
    queues.students = SAMPLE_STUDENTS.map((_, i) => ({ data: { id: `student-${i}` }, error: null }));
    queues.session_notes = [{ data: null, error: null }];

    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessionId).toBe('session-new');
    expect(deletes).toContain('sessions:session-broken');
  });

  it('seeds class, students, session, participants, rounds, 45 scores, and a note', async () => {
    queues.classes = [
      { data: null, error: null },              // no demo class yet
      { data: { id: 'class-demo' }, error: null }, // insert result
    ];
    queues.sessions = [
      { data: null, error: null },                 // no existing sample
      { data: { id: 'session-new' }, error: null }, // insert result
    ];
    // students: maybeSingle miss then insert result, ×5
    queues.students = SAMPLE_STUDENTS.flatMap((_, i) => [
      { data: null, error: null },
      { data: { id: `student-${i}` }, error: null },
    ]);
    queues.session_notes = [{ data: null, error: null }];

    const res = await POST();
    expect(res.status).toBe(200);

    const scoreInsert = inserts.find((i) => i.table === 'scores');
    expect(scoreInsert).toBeDefined();
    expect((scoreInsert!.values as unknown[]).length).toBe(45);

    const sessionInsert = inserts.find((i) => i.table === 'sessions');
    expect((sessionInsert!.values as { status: string }).status).toBe('ended');

    const roundsInsert = inserts.find((i) => i.table === 'rounds');
    expect((roundsInsert!.values as unknown[]).length).toBe(3);

    expect(inserts.some((i) => i.table === 'session_participants')).toBe(true);
    expect(inserts.some((i) => i.table === 'session_notes')).toBe(true);
  });
});

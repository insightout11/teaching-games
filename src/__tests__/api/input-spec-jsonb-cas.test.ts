import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEq, mockVerifyOwnership } = vi.hoisted(() => ({
  mockEq: vi.fn(),
  mockVerifyOwnership: vi.fn(),
}));

vi.mock('@/lib/auth-credits', () => ({
  requireAuth: vi.fn(async () => ({ teacher: { id: 'teacher-1' }, error: null })),
}));

vi.mock('@/lib/session-ownership', () => ({
  verifyTeacherOwnsSession: (...args: unknown[]) => mockVerifyOwnership(...args),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => {
    let operation: 'read' | 'update' = 'read';
    const chain = {
      select: vi.fn(() => operation === 'update'
        ? Promise.resolve({ data: [{ id: SESSION_ID }], error: null })
        : chain),
      eq: vi.fn((column: string, value: unknown) => {
        mockEq(column, value);
        return chain;
      }),
      is: vi.fn(() => chain),
      single: vi.fn(async () => ({ data: { input_spec: CURRENT_SPEC }, error: null })),
      update: vi.fn(() => {
        operation = 'update';
        return chain;
      }),
    };
    return { from: vi.fn(() => chain) };
  },
}));

import { POST } from '@/app/api/session/input-spec/route';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const CURRENT_SPEC = {
  type: 'cargo-hand',
  gameKey: 'cargo-hold',
  roundId: 'cargo-instance-r1-play',
  activityInstanceId: 'cargo-instance',
  activityInstanceStartedAt: 100,
  activitySequence: 1,
  perStudentData: {
    'client-1': { hand: [{ id: 'card-1', text: 'a tiny hat' }] },
  },
};

describe('POST /api/session/input-spec JSONB compare-and-set', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false');
    mockEq.mockClear();
    mockVerifyOwnership.mockResolvedValue({ error: null });
  });

  afterEach(() => vi.unstubAllEnvs());

  it('passes the current input spec to PostgREST as a JSON literal', async () => {
    const nextSpec = { ...CURRENT_SPEC, prompt: 'Choose a card' };
    const request = new Request('http://localhost/api/session/input-spec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        spec: nextSpec,
        activityInstanceIdentity: {
          id: 'cargo-instance',
          startedAt: 100,
          sequence: 2,
        },
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({ ok: true, applied: true });
    expect(mockEq).toHaveBeenCalledWith('input_spec', JSON.stringify(CURRENT_SPEC));
    expect(mockEq).not.toHaveBeenCalledWith('input_spec', CURRENT_SPEC);
  });
});

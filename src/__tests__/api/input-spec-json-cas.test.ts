import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/session/input-spec/route';
import type { ActivityInstanceIdentity, InputSpec } from '@/lib/input-spec';

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  requireAuth: vi.fn(),
  verifyTeacherOwnsSession: vi.fn(),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: mocks.createServiceClient,
}));

vi.mock('@/lib/auth-credits', () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock('@/lib/session-ownership', () => ({
  verifyTeacherOwnsSession: mocks.verifyTeacherOwnsSession,
}));

const SESSION_ID = '11111111-1111-4111-8111-111111111111';

function predictionQuestion(sequence: number): InputSpec {
  return {
    type: 'binary',
    gameKey: 'prediction-round',
    prompt: `Question ${sequence / 2 + 1}`,
    optionLabels: ['True', 'False'],
    activityInstanceId: 'prediction-round:100:1',
    activityInstanceStartedAt: 100,
    activitySequence: sequence,
    roundId: `prediction-round:100:1:question-${sequence / 2 + 1}`,
  };
}

function request(spec: InputSpec | null, identity: ActivityInstanceIdentity) {
  return new Request('http://localhost/api/session/input-spec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: SESSION_ID, spec, activityInstanceIdentity: identity }),
  });
}

function serviceFor(currentInputSpec: InputSpec) {
  const readQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { input_spec: currentInputSpec }, error: null }),
  };
  const updateQuery = {
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [{ id: SESSION_ID }], error: null }),
  };
  const update = vi.fn().mockReturnValue(updateQuery);
  const from = vi.fn()
    .mockReturnValueOnce(readQuery)
    .mockReturnValueOnce({ update });

  mocks.createServiceClient.mockReturnValue({ from });
  return { update, updateQuery };
}

describe('POST /api/session/input-spec JSON compare-and-set', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false');
    mocks.requireAuth.mockResolvedValue({ teacher: { id: 'teacher-1' }, error: null });
    mocks.verifyTeacherOwnsSession.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    ['the next prompt', predictionQuestion(2), { id: 'prediction-round:100:1', startedAt: 100, sequence: 2 }],
    ['the final clear', null, { id: 'prediction-round:100:1', startedAt: 100, sequence: 3 }],
  ] as const)('serializes the current JSON value when writing %s', async (_label, nextSpec, identity) => {
    const currentSpec = predictionQuestion(0);
    const { update, updateQuery } = serviceFor(currentSpec);

    const response = await POST(request(nextSpec, identity) as never);

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ input_spec: nextSpec });
    expect(updateQuery.eq).toHaveBeenNthCalledWith(1, 'id', SESSION_ID);
    expect(updateQuery.eq).toHaveBeenNthCalledWith(2, 'input_spec', JSON.stringify(currentSpec));
    expect(typeof updateQuery.eq.mock.calls[1][1]).toBe('string');
  });
});

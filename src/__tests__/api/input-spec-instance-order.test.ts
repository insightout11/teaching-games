import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/session/input-spec/route';
import { mockStore } from '@/lib/mock/data';
import type { ActivityInstanceIdentity, InputSpec } from '@/lib/input-spec';

vi.mock('@/lib/auth-credits', () => ({
  requireAuth: vi.fn(async () => ({ teacher: { id: 'teacher-1' }, error: null })),
}));

const SESSION_ID = 'session-a2-realtime';

function request(spec: InputSpec | null, activityInstanceIdentity: ActivityInstanceIdentity | null) {
  return new Request('http://localhost/api/session/input-spec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: SESSION_ID, spec, activityInstanceIdentity }),
  });
}

function prompt(instance: number, sequence = 0): InputSpec {
  return {
    type: 'choice',
    gameKey: 'quick-pulse',
    prompt: `Run ${instance}`,
    options: ['1', '2', '3', '4', '5'],
    roundId: `quick-pulse:${instance}:prompt-1`,
    activityInstanceId: `quick-pulse:${instance}`,
    activityInstanceStartedAt: instance,
    activitySequence: sequence,
  };
}

describe('POST /api/session/input-spec activity ordering', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'true');
    mockStore.reset();
    mockStore.ensureSession(SESSION_ID);
  });

  afterEach(() => vi.unstubAllEnvs());

  it('rejects a delayed clear from the previous Quick Pulse instance', async () => {
    const current = prompt(200);
    mockStore.updateSession(SESSION_ID, { input_spec: current } as never);

    const response = await POST(request(null, { id: 'quick-pulse:100', startedAt: 100, sequence: 1 }) as never);
    const data = await response.json();

    expect(data).toMatchObject({ applied: false, spec: current });
    expect((mockStore.getSession(SESSION_ID) as { input_spec?: unknown }).input_spec).toEqual(current);
  });

  it('accepts the clear belonging to the current prompt sequence', async () => {
    mockStore.updateSession(SESSION_ID, { input_spec: prompt(200) } as never);

    const response = await POST(request(null, { id: 'quick-pulse:200', startedAt: 200, sequence: 1 }) as never);
    const data = await response.json();

    expect(data).toMatchObject({ applied: true, spec: null });
    expect((mockStore.getSession(SESSION_ID) as { input_spec?: unknown }).input_spec).toBeNull();
  });

  it('rejects an older active prompt after a same-type restart', async () => {
    const current = prompt(300);
    mockStore.updateSession(SESSION_ID, { input_spec: current } as never);

    const response = await POST(request(prompt(200), { id: 'quick-pulse:200', startedAt: 200, sequence: 0 }) as never);
    const data = await response.json();

    expect(data).toMatchObject({ applied: false, spec: current });
  });

  it('does not let a delayed Quick Pulse clear erase another active activity', async () => {
    const current: InputSpec = {
      type: 'binary', gameKey: 'prediction-round', prompt: 'Current prediction',
    };
    mockStore.updateSession(SESSION_ID, { input_spec: current } as never);

    const response = await POST(request(null, { id: 'quick-pulse:200', startedAt: 200, sequence: 1 }) as never);
    const data = await response.json();

    expect(data).toMatchObject({ applied: false, spec: current });
  });
});

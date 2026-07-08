import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/student/session/route';
import { mockStore } from '@/lib/mock/data';
import type { InputSpec } from '@/lib/input-spec';

const SESSION_ID = 'session-a2-realtime';

function request(path: string) {
  return new Request(`http://localhost${path}`);
}

describe('GET /api/student/session realtime fallback metadata', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'true');
    mockStore.reset();
    mockStore.ensureSession(SESSION_ID);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns a cheap unchanged payload when the inputSpec revision matches', async () => {
    const spec: InputSpec = {
      type: 'choice',
      gameKey: 'flash-quiz',
      prompt: 'Pick one',
      options: ['A', 'B'],
      timerSeconds: 30,
      startedAt: 1_800_000_000_000,
      answersOpenAt: 1_800_000_004_000,
    };
    mockStore.updateSession(SESSION_ID, { input_spec: spec } as never);

    const first = await GET(request(`/api/student/session?sessionId=${SESSION_ID}&clientId=c1`) as never);
    expect(first.status).toBe(200);
    const firstData = await first.json();

    expect(firstData.inputSpec).toEqual(spec);
    expect(typeof firstData.inputSpecRevision).toBe('string');

    const second = await GET(
      request(`/api/student/session?sessionId=${SESSION_ID}&clientId=c1&inputSpecRevision=${firstData.inputSpecRevision}`) as never,
    );
    expect(second.status).toBe(200);
    const secondData = await second.json();

    expect(secondData).toEqual({
      unchanged: true,
      isActive: true,
      serverNow: expect.any(Number),
      inputSpecRevision: firstData.inputSpecRevision,
    });
  });
});

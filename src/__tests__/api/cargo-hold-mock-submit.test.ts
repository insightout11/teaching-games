import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/student/submit/route';
import { mockStore } from '@/lib/mock/data';
import type { InputSpec } from '@/lib/input-spec';

const SESSION_ID = 'session-cargo-hold-browser-test';
const ROUND_ID = 'cargo-browser-r0-board';

describe('Cargo Hold mock-mode submissions', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'true');
    mockStore.reset();
    const session = mockStore.ensureSession(SESSION_ID);
    expect(session).toBeDefined();
    mockStore.updateSession(SESSION_ID, {
      input_spec: {
        type: 'cargo-hand',
        gameKey: 'cargo-hold',
        activityInstanceId: 'cargo-browser',
        roundId: ROUND_ID,
      } as InputSpec,
    } as never);
  });

  afterEach(() => {
    mockStore.reset();
    vi.unstubAllEnvs();
  });

  it('accepts a Cargo custom input before production UUID validation', async () => {
    const content = JSON.stringify({
      type: 'board',
      actionId: 'board:cargo-browser:client-a',
      activityInstanceId: 'cargo-browser',
      roundId: `${ROUND_ID}::board`,
    });

    const response = await POST(new Request('http://localhost/api/student/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        clientId: 'mock-client-a',
        studentId: 'student-1',
        displayName: 'Alice',
        content,
        gameKey: 'cargo-hold',
        inputType: 'cargo-hand',
        roundId: `${ROUND_ID}::board`,
      }),
    }) as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, direct: true });
    expect(mockStore.getScores(SESSION_ID)).toHaveLength(1);
  });
});

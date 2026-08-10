import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/student/session/route';
import { mockStore } from '@/lib/mock/data';
import { getInputSpecRevision, type InputSpec } from '@/lib/input-spec';

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

  it('reconciles poll and Crew Radio lanes when the main inputSpec revision matches', async () => {
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
      inputSpecUnchanged: true,
      isActive: true,
      serverNow: expect.any(Number),
      inputSpecRevision: firstData.inputSpecRevision,
      activePoll: null,
      sideChannel: null,
    });
    expect(secondData).not.toHaveProperty('unchanged');
  });

  it('returns changed auxiliary lanes even when the main revision matches', async () => {
    const session = mockStore.getSession(SESSION_ID) as typeof mockStore.sessions[number] & {
      active_poll?: unknown;
      side_channel?: unknown;
    };
    const activePoll = { pollId: 'poll-2', question: 'Choose', options: ['A', 'B'] };
    const sideChannel = {
      id: 'radio-2',
      kind: 'write',
      title: 'Quick write',
      prompt: 'Why?',
      createdAt: new Date(Date.now() - 1_000).toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    Object.assign(session, { active_poll: activePoll, side_channel: sideChannel });

    const response = await GET(
      request(`/api/student/session?sessionId=${SESSION_ID}&clientId=c1&inputSpecRevision=${getInputSpecRevision(null)}`) as never,
    );
    const data = await response.json();

    expect(data).toMatchObject({ inputSpecUnchanged: true, activePoll, sideChannel });

    Object.assign(session, { active_poll: null, side_channel: null });
    const clearedResponse = await GET(
      request(`/api/student/session?sessionId=${SESSION_ID}&clientId=c1&inputSpecRevision=${getInputSpecRevision(null)}`) as never,
    );
    expect(await clearedResponse.json()).toMatchObject({
      inputSpecUnchanged: true,
      activePoll: null,
      sideChannel: null,
    });
  });

  it('hydrates Quick Pulse Prompt 1 for a newly opened student context', async () => {
    const promptOne: InputSpec = {
      type: 'binary',
      gameKey: 'quick-pulse',
      prompt: 'Do greetings matter?',
      optionLabels: ['Yes', 'No'],
      roundId: 'quick-pulse:100:1:prompt-1',
      activityInstanceId: 'quick-pulse:100:1',
      activityInstanceStartedAt: 100,
      activitySequence: 0,
    };
    mockStore.updateSession(SESSION_ID, { input_spec: promptOne } as never);

    const response = await GET(
      request(`/api/student/session?sessionId=${SESSION_ID}&clientId=fresh-tab`) as never,
    );
    const data = await response.json();

    expect(data.inputSpec).toEqual(promptOne);
    expect(data.inputSpecRevision).toBe(getInputSpecRevision(promptOne));
  });

  it('hydrates Prompt 2 after reload instead of treating Prompt 1 as unchanged', async () => {
    const promptOne: InputSpec = {
      type: 'binary', gameKey: 'quick-pulse', prompt: 'Prompt 1',
      activityInstanceId: 'quick-pulse:100:1', activityInstanceStartedAt: 100,
      activitySequence: 0, roundId: 'quick-pulse:100:1:prompt-1',
    };
    const promptTwo: InputSpec = {
      type: 'choice', gameKey: 'quick-pulse', prompt: 'Prompt 2', options: ['1', '2', '3', '4', '5'],
      activityInstanceId: 'quick-pulse:100:1', activityInstanceStartedAt: 100,
      activitySequence: 2, roundId: 'quick-pulse:100:1:prompt-2',
    };
    mockStore.updateSession(SESSION_ID, { input_spec: promptTwo } as never);

    const response = await GET(request(
      `/api/student/session?sessionId=${SESSION_ID}&clientId=reload&inputSpecRevision=${getInputSpecRevision(promptOne)}`,
    ) as never);
    const data = await response.json();

    expect(data.inputSpecUnchanged).not.toBe(true);
    expect(data.inputSpec).toEqual(promptTwo);
  });
});

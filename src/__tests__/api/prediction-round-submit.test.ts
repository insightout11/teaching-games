import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InputSpec } from '@/lib/input-spec';

const serviceState = vi.hoisted(() => ({
  activeSpec: null as InputSpec | null,
  startedAt: new Date().toISOString(),
  participant: { student_id: '33333333-3333-4333-8333-333333333333' } as { student_id: string | null } | null,
  rows: [] as Array<{ id: string; response_data: Record<string, unknown>; client_id: string }>,
  insertError: null as null | { code: string; details?: string; hint?: string },
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from(table: string) {
      if (table === 'sessions') {
        const chain = {
          select: () => chain,
          eq: () => chain,
          single: async () => ({
            data: {
              id: SESSION_ID,
              status: 'active',
              started_at: serviceState.startedAt,
              input_spec: serviceState.activeSpec,
            },
            error: null,
          }),
        };
        return chain;
      }
      if (table === 'session_participants') {
        const chain = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: async () => ({ data: serviceState.participant, error: null }),
        };
        return chain;
      }
      if (table === 'scores') {
        let clientId = '';
        let identity: Record<string, unknown> = {};
        const chain = {
          select: () => chain,
          eq(column: string, value: string) {
            if (column === 'client_id') clientId = value;
            return chain;
          },
          contains(_column: string, value: Record<string, unknown>) {
            identity = value;
            return chain;
          },
          limit: () => chain,
          maybeSingle: async () => ({
            data: serviceState.rows.find((row) => (
              row.client_id === clientId
              && Object.entries(identity).every(([key, value]) => row.response_data[key] === value)
            )) ?? null,
            error: null,
          }),
          delete: () => chain,
          insert: async (row: { client_id: string; response_data: Record<string, unknown> }) => {
            if (serviceState.insertError) {
              if (serviceState.insertError.code === '23505') {
                serviceState.rows.push({ id: `score-${serviceState.rows.length + 1}`, ...row });
              }
              return { error: serviceState.insertError };
            }
            serviceState.rows.push({ id: `score-${serviceState.rows.length + 1}`, ...row });
            return { error: null };
          },
        };
        return chain;
      }
      throw new Error(`Unexpected table ${table}`);
    },
  }),
}));

import { POST } from '@/app/api/student/submit/route';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const CLIENT_ID = '22222222-2222-4222-8222-222222222222';
const STUDENT_ID = '33333333-3333-4333-8333-333333333333';

function spec(instance = 'prediction-round:100:1', question = 1): InputSpec {
  return {
    type: 'binary',
    gameKey: 'prediction-round',
    prompt: `Question ${question}`,
    optionLabels: ['True', 'False'],
    activityInstanceId: instance,
    activityInstanceStartedAt: Number(instance.split(':')[1]),
    activitySequence: (question - 1) * 2,
    roundId: `${instance}:question-${question}`,
  };
}

function submit(roundId: string | null, content = 'False') {
  return POST(new Request('http://localhost/api/student/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      clientId: CLIENT_ID,
      studentId: STUDENT_ID,
      displayName: 'Doug',
      content,
      gameKey: 'prediction-round',
      inputType: 'binary',
      roundId,
      allowMultiple: true,
    }),
  }) as never);
}

describe('Prediction Round production-mode direct submissions', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false');
    serviceState.activeSpec = spec();
    serviceState.startedAt = new Date().toISOString();
    serviceState.participant = { student_id: STUDENT_ID };
    serviceState.rows = [];
    serviceState.insertError = null;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('persists a valid binary response and deduplicates a repeated Q1 request', async () => {
    const first = await submit(serviceState.activeSpec!.roundId!);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ success: true, direct: true });

    const duplicate = await submit(serviceState.activeSpec!.roundId!);
    expect(duplicate.status).toBe(200);
    expect(await duplicate.json()).toMatchObject({ success: true, direct: true, deduplicated: true, choice: 'False' });
    expect(serviceState.rows).toHaveLength(1);
  });

  it('keeps Q1 and Q2 as distinct responses for the same client and game', async () => {
    const q1 = spec(undefined, 1);
    serviceState.activeSpec = q1;
    expect((await submit(q1.roundId!, 'False')).status).toBe(200);

    const q2 = spec(undefined, 2);
    serviceState.activeSpec = q2;
    expect((await submit(q2.roundId!, 'True')).status).toBe(200);

    expect(serviceState.rows.map((row) => row.response_data.roundId)).toEqual([q1.roundId, q2.roundId]);
  });

  it('treats the loser of a concurrent duplicate insert as a successful retry', async () => {
    serviceState.insertError = { code: '23505' };

    const response = await submit(serviceState.activeSpec!.roundId!);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      direct: true,
      deduplicated: true,
      choice: 'False',
    });
    expect(serviceState.rows).toHaveLength(1);
  });

  it('allows a verified existing participant in an old but explicitly active session', async () => {
    serviceState.startedAt = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const response = await submit(serviceState.activeSpec!.roundId!);
    expect(response.status).toBe(200);
    expect(serviceState.rows).toHaveLength(1);
  });

  it('keeps the stale-session exception closed to legacy text submissions', async () => {
    serviceState.startedAt = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const response = await POST(new Request('http://localhost/api/student/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        clientId: CLIENT_ID,
        studentId: STUDENT_ID,
        displayName: 'Doug',
        content: 'Legacy text',
        gameKey: 'crew-radio',
        inputType: 'text',
      }),
    }) as never);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Session is not active' });
  });
  it('rejects missing and stale round identities', async () => {
    const missing = await submit(null);
    expect(missing.status).toBe(409);
    expect(await missing.json()).toEqual({ error: 'Missing round identity' });

    const stale = await submit('prediction-round:50:1:question-1');
    expect(stale.status).toBe(409);
    expect(await stale.json()).toEqual({ error: 'Stale round identity' });
    expect(serviceState.rows).toHaveLength(0);
  });

  it('returns safe copy plus a correlation ID when the database insert fails', async () => {
    serviceState.insertError = { code: '23503', details: 'redacted database detail', hint: 'redacted hint' };
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await submit(serviceState.activeSpec!.roundId!);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Signal failed', requestId: expect.any(String) });
    expect(console.error).toHaveBeenCalledWith(
      'Direct response insert failed',
      expect.objectContaining({ correlationId: data.requestId, code: '23503' }),
    );
  });
});

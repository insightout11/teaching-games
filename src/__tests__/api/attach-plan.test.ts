import { beforeEach, describe, expect, it, vi } from 'vitest';

const update = vi.fn();
vi.mock('@/lib/auth-credits', () => ({
  requireAuth: vi.fn(async () => ({ teacher: { id: 't1' }, error: null })),
}));
vi.mock('@/lib/session-ownership', () => ({
  verifyTeacherOwnsSession: vi.fn(async (id: string) => ({ session: { id, class_id: 'c1', status: 'active' }, error: null })),
}));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({
      update: (values: unknown) => {
        update(values);
        return { eq: () => ({ select: async () => ({ data: [{ id: 's1' }], error: null }), then: (r: (v: unknown) => void) => r({ error: null }) }) };
      },
    }),
  }),
}));

import { DELETE, POST } from '@/app/api/session/[sessionId]/attach-plan/route';

const SID = '11111111-1111-4111-8111-111111111111';
const plan = { customTopic: 'World Cup', difficulty: 'Intermediate', slots: [{ key: 'flash-quiz', type: 'game', name: 'Flash Quiz' }], generatedContent: {}, generatedGameContent: {} };
const post = (body: unknown) => POST(new Request('http://x/api', { method: 'POST', body: JSON.stringify(body) }), { params: { sessionId: SID } });

describe('attach-plan route', () => {
  beforeEach(() => update.mockClear());

  it('attaches a regular flight to the running session', async () => {
    const res = await post({ lessonPlanContent: plan });
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ custom_topic: 'World Cup', lesson_plan_content: expect.objectContaining({ customTopic: 'World Cup' }) }));
  });

  it('refuses World Flight plans, which need a new session', async () => {
    const res = await post({ lessonPlanContent: { ...plan, destinationId: 'tokyo' } });
    expect(res.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('requires a plan', async () => {
    expect((await post({})).status).toBe(400);
  });

  it('clears the plan when the flight ends', async () => {
    const res = await DELETE(new Request('http://x/api', { method: 'DELETE' }), { params: { sessionId: SID } });
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ lesson_plan_content: null });
  });
});

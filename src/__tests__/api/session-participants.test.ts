import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  verifyTeacherOwnsSession: vi.fn(),
  order: vi.fn(),
}));

vi.mock('@/lib/auth-credits', () => ({ requireAuth: mocks.requireAuth }));
vi.mock('@/lib/session-ownership', () => ({ verifyTeacherOwnsSession: mocks.verifyTeacherOwnsSession }));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ order: mocks.order }),
      }),
    }),
  }),
}));

import { dynamic, GET, revalidate } from '@/app/api/student/participants/route';

describe('GET /api/student/participants', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false');
    mocks.requireAuth.mockReset().mockResolvedValue({ teacher: { id: 'teacher-1' }, error: null });
    mocks.verifyTeacherOwnsSession.mockReset().mockResolvedValue({ error: null, session: { class_id: 'class-1' } });
    mocks.order.mockReset().mockResolvedValue({
      data: [{ id: 'participant-1', student_id: 'student-1', display_name: 'Mia', avatar_seed: 'cloud', joined_at: 'now' }],
      error: null,
    });
  });

  it('forces every attendance poll to execute dynamically', () => {
    expect(dynamic).toBe('force-dynamic');
    expect(revalidate).toBe(0);
  });

  it('returns service-read attendance to the owning teacher', async () => {
    const response = await GET(new Request('http://localhost/api/student/participants?sessionId=session-1') as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ participants: [expect.objectContaining({ display_name: 'Mia' })] });
    expect(mocks.verifyTeacherOwnsSession).toHaveBeenCalledWith('session-1', 'teacher-1');
  });

  it('does not expose attendance when ownership fails', async () => {
    const forbidden = new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    mocks.verifyTeacherOwnsSession.mockResolvedValue({ error: forbidden });
    const response = await GET(new Request('http://localhost/api/student/participants?sessionId=session-1') as never);
    expect(response.status).toBe(403);
    expect(mocks.order).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), owns: vi.fn(), remove: vi.fn(), eq: vi.fn() }));
vi.mock('@/lib/auth-credits', () => ({ requireAuth: mocks.auth }));
vi.mock('@/lib/session-ownership', () => ({ verifyTeacherOwnsSession: mocks.owns }));
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: () => ({ from: () => ({ delete: mocks.remove }) }) }));
import { DELETE } from '@/app/api/student/participants/route';
import { GET } from '@/app/api/student/session/route';
import { mockStore } from '@/lib/mock/data';
const request = () => new Request('http://localhost/api/student/participants', {
  method: 'DELETE', body: JSON.stringify({ sessionId: 'session-safety', participantId: 'p1' }),
}) as never;
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false');
  mocks.auth.mockReset().mockResolvedValue({ teacher: { id: 't1' }, error: null });
  mocks.owns.mockReset().mockResolvedValue({ error: null });
  mocks.eq.mockReset().mockReturnValueOnce({ eq: mocks.eq }).mockResolvedValueOnce({ error: null });
  mocks.remove.mockReset().mockReturnValue({ eq: mocks.eq });
});
afterEach(() => vi.unstubAllEnvs());
describe('student removal', () => {
  it('checks ownership and deletes only the selected attendance row in the session', async () => {
    expect((await DELETE(request())).status).toBe(200);
    expect(mocks.owns).toHaveBeenCalledWith('session-safety', 't1');
    expect(mocks.eq.mock.calls).toEqual([['session_id', 'session-safety'], ['id', 'p1']]);
  });
  it('does not delete when ownership fails', async () => {
    mocks.owns.mockResolvedValue({ error: new Response(null, { status: 403 }) });
    expect((await DELETE(request())).status).toBe(403);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('requires teacher authentication', async () => {
    mocks.auth.mockResolvedValue({ teacher: null, error: new Response(null, { status: 401 }) });
    expect((await DELETE(request())).status).toBe(401);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('returns a removed phone to name entry even on an unchanged-input poll', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'true');
    mockStore.reset();
    const session = mockStore.ensureSession('session-safety')!;
    const student = mockStore.getStudents(session.class_id)[0];
    const participant = mockStore.upsertSessionParticipant({ session_id: session.id, student_id: student.id, client_id: 'phone', display_name: student.name, avatar_seed: 'teal' });
    const removeRequest = new Request('http://localhost/api/student/participants', { method: 'DELETE', body: JSON.stringify({ sessionId: session.id, participantId: participant.id }) });
    expect((await DELETE(removeRequest as never)).status).toBe(200);
    const response = await GET(new Request(`http://localhost/api/student/session?sessionId=${session.id}&clientId=phone&studentId=${student.id}&inputSpecRevision=old`) as never);
    expect(await response.json()).toEqual({ notJoined: true });
  });
});

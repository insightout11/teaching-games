import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ single: vi.fn(), upsert: vi.fn() }));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: () => {
    const query = { select: () => query, update: () => query, eq: () => query, single: mocks.single, upsert: mocks.upsert };
    return query;
  } }),
}));
import { POST } from '@/app/api/student/join/route';
import { registerStudentAttendance } from '@/lib/student-attendance';
import { mockStore } from '@/lib/mock/data';

const sessionId = '11111111-1111-4111-8111-111111111111';
const studentId = '22222222-2222-4222-8222-222222222222';
const clientId = '33333333-3333-4333-8333-333333333333';
const request = (body: object) => new Request('http://localhost/api/student/join', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, clientId, ...body }),
}) as never;

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'false');
  mocks.single.mockReset()
    .mockResolvedValueOnce({ data: { id: sessionId, class_id: 'class-1', status: 'active', started_at: new Date().toISOString() } })
    .mockResolvedValueOnce({ data: { id: studentId, name: 'Mia' } });
  mocks.upsert.mockReset().mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());

describe('typed name safety', () => {
  it('rejects a profane new name before writing', async () => {
    const response = await POST(request({ newName: 'fuck' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Please choose a different name.' });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it('accepts a normal typed name instantly', async () => {
    const response = await POST(request({ newName: 'Mia' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ studentId, name: 'Mia' });
    expect(mocks.upsert).toHaveBeenCalled();
  });
  it('leaves roster selections unchanged', async () => {
    // Mock mode follows the same name gate but uses an existing roster student.
    vi.stubEnv('NEXT_PUBLIC_MOCK_MODE', 'true');
    mockStore.reset();
    const session = mockStore.ensureSession('session-name-safety')!;
    const student = mockStore.createStudent({ class_id: session.class_id, name: 'fuck' });
    const response = await POST(request({ sessionId: session.id, studentId: student.id, newName: 'fuck' }));
    expect(response.status).toBe(200);
  });
  it('passes the name rejection through to the phone without retrying', async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: 'Please choose a different name.' }) });
    await expect(registerStudentAttendance({ sessionId, clientId, newName: 'fuck' }, { request: send, retryDelaysMs: [0, 0] }))
      .rejects.toThrow('Please choose a different name.');
    expect(send).toHaveBeenCalledTimes(1);
  });
});

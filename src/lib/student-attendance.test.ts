import { describe, expect, it, vi } from 'vitest';
import { buildStudentRejoinPayload, registerStudentAttendance } from './student-attendance';

describe('student attendance registration', () => {
  it('re-registers a saved free-text student with the same client identity', () => {
    expect(buildStudentRejoinPayload('session-1', {
      clientId: 'client-1',
      studentId: null,
      displayName: 'Mia',
      avatarSeed: 'green',
    })).toEqual({
      sessionId: 'session-1',
      clientId: 'client-1',
      newName: 'Mia',
      avatarSeed: 'green',
    });
  });

  it('normalizes a legacy UUID avatar before automatic rejoin', () => {
    const payload = buildStudentRejoinPayload('session-1', {
      clientId: 'client-1',
      studentId: 'student-1',
      displayName: 'Mia',
      avatarSeed: 'bbb45fd4-d487-4d8e-85a2-b30957e5fe14',
    });

    expect(payload.avatarSeed).toMatch(/^(teal|amber|red|blue|violet|green|white|gold|black|pink|silver|rainbow|captain-)/);
    expect(payload.avatarSeed).not.toHaveLength(36);
  });

  it('retries a transient failure and returns only after attendance is authoritative', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ studentId: 'student-1', name: 'Mia' }) });

    await expect(registerStudentAttendance({
      sessionId: 'session-1',
      clientId: 'client-1',
      newName: 'Mia',
    }, { request, retryDelaysMs: [0, 0] })).resolves.toEqual({
      studentId: 'student-1',
      name: 'Mia',
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('rejects instead of allowing a local-only connected state', async () => {
    const request = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    await expect(registerStudentAttendance({
      sessionId: 'session-1',
      clientId: 'client-1',
      newName: 'Mia',
    }, { request, retryDelaysMs: [0, 0] })).rejects.toThrow('Student attendance registration failed');
  });
});

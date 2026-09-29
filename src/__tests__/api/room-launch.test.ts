import { beforeEach, describe, expect, it, vi } from 'vitest';

const broadcast = vi.fn(async () => ({ status: 'sent', elapsedMs: 1 }));
const verify = vi.fn(async (id: string) => ({ session: { id, class_id: 'c1', status: 'active' }, error: null }));
vi.mock('@/lib/auth-credits', () => ({ requireAuth: vi.fn(async () => ({ teacher: { id: 't1' }, error: null })) }));
vi.mock('@/lib/session-ownership', () => ({ verifyTeacherOwnsSession: (...a: [string]) => verify(...a) }));
vi.mock('@/lib/supabase/realtime-broadcast', () => ({ broadcastInputSpecFromServer: (...a: unknown[]) => broadcast(...(a as [])) }));

import { POST } from '@/app/api/session/room-launch/route';

const post = (body: unknown) => POST(new Request('http://x/api', { method: 'POST', body: JSON.stringify(body) }));

describe('room-launch route', () => {
  beforeEach(() => { broadcast.mockClear(); verify.mockClear(); });

  it('broadcasts the activity name on the session channel', async () => {
    const res = await post({ sessionId: 's1', name: 'Hot Take Arena' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ delivered: true });
    expect(verify).toHaveBeenCalledWith('s1', 't1', { requireActive: true });
    expect(broadcast).toHaveBeenCalledWith('session-input-spec:s1', 'room-launch', expect.objectContaining({ name: 'Hot Take Arena' }));
  });

  it('rejects a missing name', async () => {
    expect((await post({ sessionId: 's1' })).status).toBe(400);
    expect(broadcast).not.toHaveBeenCalled();
  });
});

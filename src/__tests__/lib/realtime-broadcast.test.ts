import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { broadcastInputSpecFromServer } from '@/lib/supabase/realtime-broadcast';

describe('server-owned Realtime Broadcast', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co/');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('posts the payload to the public topic endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 202 }));
    const payload = {
      spec: { type: 'binary' as const, gameKey: 'prediction-round', prompt: 'Ready?' },
      inputSpecRevision: 'revision-1',
      serverNow: 123,
      activityInstanceIdentity: null,
    };

    await expect(broadcastInputSpecFromServer('input-spec:session-1', 'input-spec', payload))
      .resolves.toMatchObject({ status: 'sent', httpStatus: 202 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/realtime/v1/api/broadcast/input-spec%3Asession-1/events/input-spec',
      expect.objectContaining({
        method: 'POST',
        headers: {
          apikey: 'test-service-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      }),
    );
  });

  it('returns a failed delivery without throwing when Realtime rejects it', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 503 }));

    await expect(broadcastInputSpecFromServer('topic', 'event', {
      spec: null,
      inputSpecRevision: 'revision-2',
      serverNow: 456,
      activityInstanceIdentity: null,
    })).resolves.toMatchObject({
      status: 'failed',
      reason: 'request-failed',
      httpStatus: 503,
    });
  });
});

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
      new URL('https://project.supabase.co/realtime/v1/api/broadcast/input-spec%3Asession-1/events/input-spec'),
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

  it('normalizes whitespace and matching quotes around the configured URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '  "https://project.supabase.co/"\r\n');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 202 }));

    await expect(broadcastInputSpecFromServer('topic', 'event', {
      spec: null,
      inputSpecRevision: 'revision-normalized',
      serverNow: 123,
      activityInstanceIdentity: null,
    })).resolves.toMatchObject({ status: 'sent', httpStatus: 202 });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://project.supabase.co/realtime/v1/api/broadcast/topic/events/event'),
      expect.any(Object),
    );
  });

  it.each([
    'NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co',
    'javascript:alert(1)',
    'https://project.supabase.co/unexpected-path',
  ])('rejects an invalid configured URL without calling fetch: %s', async (configuredUrl) => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', configuredUrl);
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(broadcastInputSpecFromServer('topic', 'event', {
      spec: null,
      inputSpecRevision: 'revision-invalid',
      serverNow: 123,
      activityInstanceIdentity: null,
    })).resolves.toMatchObject({
      status: 'failed',
      reason: 'invalid-configuration',
    });

    expect(fetchMock).not.toHaveBeenCalled();
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

  it('returns safe exception metadata without exposing an error message', async () => {
    const cause = Object.assign(new Error('socket unavailable'), { code: 'UND_ERR_CONNECT_TIMEOUT' });
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed', { cause }));

    const result = await broadcastInputSpecFromServer('topic', 'event', {
      spec: null,
      inputSpecRevision: 'revision-3',
      serverNow: 789,
      activityInstanceIdentity: null,
    });

    expect(result).toMatchObject({
      status: 'failed',
      reason: 'request-failed',
      errorName: 'TypeError',
      errorCode: 'UND_ERR_CONNECT_TIMEOUT',
    });
    expect(result).not.toHaveProperty('errorMessage');
  });
});

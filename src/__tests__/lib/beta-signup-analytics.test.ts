import { beforeEach, describe, expect, it, vi } from 'vitest';

const analytics = vi.hoisted(() => ({ ready: true, identified: true, identifies: [] as unknown[][] }));
vi.mock('@/lib/analytics/posthog', () => ({
  initPostHog: () => analytics.ready,
  getPostHogDistinctId: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  identifyTeacher: (...args: unknown[]) => { analytics.identifies.push(args); return analytics.identified; },
}));

import { captureBetaSignupCompleted } from '@/lib/beta/signup-analytics';

describe('beta signup analytics client', () => {
  beforeEach(() => { analytics.ready = true; analytics.identified = true; analytics.identifies = []; vi.unstubAllGlobals(); });

  it('uses the server capture path even when the browser SDK is unavailable', async () => {
    analytics.ready = false;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ claimed: true, analyticsCaptured: true }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await captureBetaSignupCompleted({ id: 'teacher' })).toEqual({ outcome: 'captured' });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(analytics.identifies).toEqual([]);
  });

  it('does not capture when no row was claimed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ claimed: false }) }));
    expect(await captureBetaSignupCompleted({ id: 'teacher' })).toEqual({ outcome: 'not-claimed' });
    expect(analytics.identifies).toEqual([['teacher', null]]);
  });

  it('captures once after successful identification and claim', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      claimed: true,
      analyticsCaptured: true,
    }) }));
    expect(await captureBetaSignupCompleted({ id: 'teacher', email: 'teacher@example.com' })).toEqual({ outcome: 'captured' });
    expect(analytics.identifies).toEqual([['teacher', 'teacher@example.com']]);
    expect(fetch).toHaveBeenCalledWith('/api/beta/status', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ analyticsDistinctId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }),
    }));
  });
});

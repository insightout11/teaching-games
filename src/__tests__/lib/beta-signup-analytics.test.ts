import { beforeEach, describe, expect, it, vi } from 'vitest';

const analytics = vi.hoisted(() => ({ ready: true, identified: true, events: [] as unknown[][] }));
vi.mock('@/lib/analytics/posthog', () => ({
  initPostHog: () => analytics.ready,
  isPostHogReady: () => analytics.ready,
  identifyTeacher: () => analytics.identified,
  trackEvent: (...args: unknown[]) => { analytics.events.push(args); return true; },
}));

import { captureBetaSignupCompleted } from '@/lib/beta/signup-analytics';

describe('beta signup analytics client', () => {
  beforeEach(() => { analytics.ready = true; analytics.identified = true; analytics.events = []; vi.unstubAllGlobals(); });

  it('does not claim when PostHog is unavailable', async () => {
    analytics.ready = false;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await captureBetaSignupCompleted({ id: 'teacher' })).toEqual({ outcome: 'analytics-unavailable' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not capture when no row was claimed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ claimed: false }) }));
    expect(await captureBetaSignupCompleted({ id: 'teacher' })).toEqual({ outcome: 'not-claimed' });
    expect(analytics.events).toEqual([]);
  });

  it('captures once after successful identification and claim', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ claimed: true, properties: { program: 'founding-captains' } }) }));
    expect(await captureBetaSignupCompleted({ id: 'teacher', email: 'teacher@example.com' })).toEqual({ outcome: 'captured' });
    expect(analytics.events).toEqual([['beta_signup_completed', { program: 'founding-captains' }]]);
  });
});

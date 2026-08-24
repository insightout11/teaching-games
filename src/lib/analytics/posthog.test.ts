import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  capture: vi.fn(() => ({ uuid: 'event-id' })),
  identify: vi.fn(),
  init: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('posthog-js', () => ({ default: sdk }));

describe('PostHog client transport', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'public-test-key');
    sdk.capture.mockClear();
    sdk.identify.mockClear();
    sdk.init.mockClear();
    sdk.reset.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('uses an immediate beacon and deterministic UUID for conversion events', async () => {
    const analytics = await import('./posthog');
    expect(analytics.initPostHog()).toBe(true);

    expect(analytics.trackEventImmediately('beta_signup_completed', { program: 'beta' }, '11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(sdk.capture).toHaveBeenCalledWith(
      'beta_signup_completed',
      { program: 'beta' },
      { send_instantly: true, transport: 'sendBeacon', uuid: '11111111-1111-4111-8111-111111111111' },
    );
  });

  it('clears the identified person on sign-out', async () => {
    const analytics = await import('./posthog');
    analytics.initPostHog();
    analytics.identifyTeacher('teacher-1', 'teacher@example.com');
    analytics.resetPostHog();
    expect(sdk.reset).toHaveBeenCalledOnce();
  });
});

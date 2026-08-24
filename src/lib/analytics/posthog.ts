'use client';

import posthog from 'posthog-js';

let initialized = false;

// No-ops in dev/test/preview environments where NEXT_PUBLIC_POSTHOG_KEY isn't set.
export function initPostHog(): boolean {
  if (initialized) return true;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return false;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    // 'true' only fires on full page loads — Next.js client-side <Link> navigations
    // never trigger one. history_change tracks pushState/replaceState too, which is
    // what SPA route changes actually use.
    capture_pageview: 'history_change',
    person_profiles: 'identified_only',
    // Never record screens: the teacher view is shared/projected and students join
    // anonymously — neither flow has consent handling for session recording.
    disable_session_recording: true,
  });
  initialized = true;
  return true;
}

export function isPostHogReady(): boolean {
  return initialized;
}

export function trackEvent(event: string, properties?: Record<string, unknown>): boolean {
  if (!initialized) return false;
  return Boolean(posthog.capture(event, properties));
}

export function trackEventImmediately(
  event: string,
  properties?: Record<string, unknown>,
  eventId?: string,
): boolean {
  if (!initialized) return false;
  return Boolean(posthog.capture(event, properties, {
    send_instantly: true,
    transport: 'sendBeacon',
    ...(eventId ? { uuid: eventId } : {}),
  }));
}

// Teachers only — never call for students (they must stay anonymous).
export function identifyTeacher(teacherId: string, email: string | null): boolean {
  if (!initialized) return false;
  posthog.identify(teacherId, email ? { email } : undefined);
  return true;
}

// Call on every teacher sign-out so the next anonymous visitor cannot inherit
// the previous teacher's PostHog distinct ID or person association.
export function resetPostHog(): void {
  if (!initialized) return;
  posthog.reset();
}

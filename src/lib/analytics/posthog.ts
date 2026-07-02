'use client';

import posthog from 'posthog-js';

let initialized = false;

// No-ops in dev/test/preview environments where NEXT_PUBLIC_POSTHOG_KEY isn't set.
export function initPostHog() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: true,
    person_profiles: 'identified_only',
    // Never record screens: the teacher view is shared/projected and students join
    // anonymously — neither flow has consent handling for session recording.
    disable_session_recording: true,
  });
  initialized = true;
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

// Teachers only — never call for students (they must stay anonymous).
export function identifyTeacher(teacherId: string, email: string | null) {
  if (!initialized) return;
  posthog.identify(teacherId, email ? { email } : undefined);
}

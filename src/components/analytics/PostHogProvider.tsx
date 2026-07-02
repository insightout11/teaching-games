'use client';

import { useEffect } from 'react';
import { initPostHog } from '@/lib/analytics/posthog';

export function PostHogProvider() {
  useEffect(() => {
    initPostHog();
  }, []);
  return null;
}

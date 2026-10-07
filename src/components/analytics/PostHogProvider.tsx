'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initPostHog } from '@/lib/analytics/posthog';
import { isStudentPath } from '@/lib/analytics/student-paths';

export function PostHogProvider() {
  const pathname = usePathname();
  useEffect(() => {
    // No analytics on pages students (often children) use or that are shared with families
    // (docs/kids-privacy-review.md): nothing is set on their devices.
    if (isStudentPath(pathname)) return;
    initPostHog();
  }, [pathname]);
  return null;
}

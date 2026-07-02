'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { identifyTeacher } from '@/lib/analytics/posthog';

// Identifies the signed-in teacher to PostHog. Mounted in the dashboard layout only —
// students never pass through here, so this can never leak into their anonymous events.
export function TeacherIdentify() {
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }: { data: { user: { id: string; email?: string | null } | null } }) => {
        const user = data.user;
        if (user) identifyTeacher(user.id, user.email ?? null);
      })
      .catch(() => {});
  }, []);
  return null;
}

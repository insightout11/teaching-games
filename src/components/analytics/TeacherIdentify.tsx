'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { captureBetaSignupCompleted } from '@/lib/beta/signup-analytics';

// Identifies the signed-in teacher to PostHog. Mounted in the dashboard layout only —
// students never pass through here, so this can never leak into their anonymous events.
export function TeacherIdentify() {
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }: { data: { user: { id: string; email?: string | null } | null } }) => {
        const user = data.user;
        if (!user) return;
        void captureBetaSignupCompleted(user).catch(() => {});
      })
      .catch(() => {});
  }, []);
  return null;
}

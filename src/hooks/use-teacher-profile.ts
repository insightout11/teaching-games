'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { EMPTY_PROFILE, type TeacherProfile } from '@/lib/teacher-profile';

export interface TeacherProfileInfo {
  loading: boolean;
  profile: TeacherProfile;
}

/**
 * Reads the current teacher's onboarding profile (migration 034) client-side, so launch
 * flows can pre-fill from it (e.g. default difficulty from level). Defensive: any error
 * (incl. pre-migration) resolves to an empty profile rather than throwing.
 */
export function useTeacherProfile(): TeacherProfileInfo {
  const [info, setInfo] = useState<TeacherProfileInfo>({ loading: true, profile: EMPTY_PROFILE });

  useEffect(() => {
    if (isMockMode()) {
      setInfo({ loading: false, profile: EMPTY_PROFILE });
      return;
    }
    const supabase = createClient();

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setInfo({ loading: false, profile: EMPTY_PROFILE });
          return;
        }
        const { data, error } = await supabase
          .from('teachers')
          .select('profile_class_size, profile_level, profile_focus, profile_age, profile_mode')
          .eq('id', user.id)
          .single();
        if (error || !data) {
          setInfo({ loading: false, profile: EMPTY_PROFILE });
          return;
        }
        setInfo({
          loading: false,
          profile: {
            classSize: (data.profile_class_size as TeacherProfile['classSize']) ?? null,
            level: (data.profile_level as TeacherProfile['level']) ?? null,
            focus: (data.profile_focus as TeacherProfile['focus']) ?? null,
            age: (data.profile_age as TeacherProfile['age']) ?? null,
            mode: (data.profile_mode as TeacherProfile['mode']) ?? null,
          },
        });
      } catch {
        setInfo({ loading: false, profile: EMPTY_PROFILE });
      }
    }
    load();
  }, []);

  return info;
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';

export interface TeacherTierInfo {
  loading: boolean;
  isPro: boolean;
  isDeveloper: boolean;
  credits: number;
}

const PRO_TIER: TeacherTierInfo = { loading: false, isPro: true, isDeveloper: true, credits: 0 };
const LOADING_TIER: TeacherTierInfo = { loading: true, isPro: false, isDeveloper: false, credits: 0 };

/**
 * Reads the current teacher's entitlement tier from the DB.
 *
 * isPro = true if:
 *   - is_developer = true
 *   - subscription_status = 'active'
 *   - promo_expires_at > NOW()
 *
 * credits = remaining onboarding Pro credits (0 when exhausted or when isPro).
 */
export function useTeacherTier(): TeacherTierInfo {
  const [info, setInfo] = useState<TeacherTierInfo>(LOADING_TIER);

  useEffect(() => {
    if (isMockMode()) {
      setInfo(PRO_TIER);
      return;
    }

    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setInfo({ loading: false, isPro: false, isDeveloper: false, credits: 0 });
        return;
      }

      const { data } = await supabase
        .from('teachers')
        .select('is_developer, subscription_status, promo_expires_at, generation_credits')
        .eq('id', user.id)
        .single();

      if (!data) {
        setInfo({ loading: false, isPro: false, isDeveloper: false, credits: 0 });
        return;
      }

      const teacher = data as {
        is_developer: boolean;
        subscription_status: string;
        promo_expires_at: string | null;
        generation_credits: number;
      };

      const hasActivePromo =
        teacher.promo_expires_at != null &&
        new Date(teacher.promo_expires_at) > new Date();

      const isPro =
        teacher.is_developer ||
        teacher.subscription_status === 'active' ||
        hasActivePromo;

      setInfo({
        loading: false,
        isPro,
        isDeveloper: teacher.is_developer,
        credits: isPro ? 0 : teacher.generation_credits,
      });
    }

    load();
  }, []);

  return info;
}

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

      // The RPC (not a direct teachers select) so the monthly credit trickle
      // for exhausted accounts fires on read — see migration 052.
      const { data } = await supabase.rpc('get_teacher_credits', { teacher_id: user.id });

      const row = (Array.isArray(data) ? data[0] : data) as {
        credits: number;
        is_pro: boolean;
        is_developer: boolean;
      } | undefined;

      if (!row) {
        setInfo({ loading: false, isPro: false, isDeveloper: false, credits: 0 });
        return;
      }

      setInfo({
        loading: false,
        isPro: row.is_pro,
        isDeveloper: row.is_developer,
        credits: row.is_pro ? 0 : row.credits,
      });
    }

    load();
  }, []);

  return info;
}

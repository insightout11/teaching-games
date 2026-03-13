'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';

interface CreditInfo {
  credits: number;
  isPro: boolean;
}

/**
 * Shows remaining generation credits in the sidebar.
 * Pro users see "Pro" badge; free users see "N sessions left".
 */
export function CreditBadge() {
  const [info, setInfo] = useState<CreditInfo | null>(null);

  useEffect(() => {
    if (isMockMode()) {
      setInfo({ credits: 999, isPro: false });
      return;
    }

    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: teacher } = await supabase
        .from('teachers')
        .select('generation_credits, subscription_status')
        .eq('id', user.id)
        .single();
      if (teacher) {
        setInfo({
          credits: (teacher as { generation_credits: number; subscription_status: string }).generation_credits,
          isPro: (teacher as { subscription_status: string }).subscription_status === 'active',
        });
      }
    }
    load();
  }, []);

  if (!info) return null;

  if (info.isPro) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-lc-blue/15 text-lc-blue font-medium">
        Pro
      </span>
    );
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      info.credits > 0
        ? 'bg-emerald-500/10 text-emerald-400'
        : 'bg-amber-500/10 text-amber-400'
    }`}>
      {info.credits > 0 ? `${info.credits} sessions left` : 'No credits'}
    </span>
  );
}

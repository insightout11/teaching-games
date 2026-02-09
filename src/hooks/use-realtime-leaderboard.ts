'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/session-store';
import { isMockMode } from '@/lib/mock/auth';
import type { Score } from '@/lib/supabase/types';

export function useRealtimeLeaderboard(sessionId: string | null) {
  const addRealtimeScore = useSessionStore((s) => s.addRealtimeScore);

  useEffect(() => {
    if (!sessionId) return;

    // In mock mode, skip realtime subscription
    // Scores update via local Zustand store already
    if (isMockMode()) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`scores:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scores',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: unknown }) => {
          addRealtimeScore(payload.new as Score);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, addRealtimeScore]);
}

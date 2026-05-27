'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import type { StudentSubmission } from '@/lib/supabase/types';

interface UseSubmissionsFeedReturn {
  submissions: StudentSubmission[];
  isLoading: boolean;
}

export function useSubmissionsFeed(
  sessionId: string | null,
  filterGameKey?: string | null,
): UseSubmissionsFeedReturn {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    if (isMockMode()) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    setIsLoading(true);

    async function loadSubmissions() {
      let query = supabase
        .from('student_submissions')
        .select('*')
        .eq('session_id', sessionId)
        .in('status', ['pending', 'approved'])
        .not('game_key', 'is', null)
        .neq('game_key', 'cabin-mystery');

      if (filterGameKey) {
        query = query.eq('game_key', filterGameKey);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setSubmissions(data as StudentSubmission[]);
      }
      setIsLoading(false);
    }

    loadSubmissions();

    const channel = supabase
      .channel(`cockpit-feed:${sessionId}:${filterGameKey ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_submissions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: unknown }) => {
          const sub = payload.new as StudentSubmission;
          if (sub.game_key === null || sub.game_key === 'cabin-mystery') return;
          if (filterGameKey && sub.game_key !== filterGameKey) return;
          setSubmissions((prev) => [sub, ...prev].slice(0, 50));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_submissions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: unknown }) => {
          const updated = payload.new as StudentSubmission;
          setSubmissions((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, filterGameKey]);

  return { submissions, isLoading };
}

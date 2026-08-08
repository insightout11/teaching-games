'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import type { StudentSubmission } from '@/lib/supabase/types';

interface UseSubmissionsFeedReturn {
  submissions: StudentSubmission[];
  isLoading: boolean;
}

const VISIBLE_STATUSES = new Set<StudentSubmission['status']>(['pending', 'approved']);

export function isVisibleSubmission(
  submission: StudentSubmission,
  filterGameKey?: string | null,
): boolean {
  return VISIBLE_STATUSES.has(submission.status)
    && submission.game_key !== null
    && submission.game_key !== 'cabin-mystery'
    && (!filterGameKey || submission.game_key === filterGameKey);
}

export function normalizeSubmissions(
  submissions: StudentSubmission[],
  filterGameKey?: string | null,
): StudentSubmission[] {
  const byId = new Map<string, StudentSubmission>();
  for (const submission of submissions) {
    if (isVisibleSubmission(submission, filterGameKey)) byId.set(submission.id, submission);
  }
  return Array.from(byId.values())
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id))
    .slice(0, 50);
}

export function mergeSubmissionEvent(
  current: StudentSubmission[],
  incoming: StudentSubmission,
  filterGameKey?: string | null,
): StudentSubmission[] {
  return normalizeSubmissions(
    [...current.filter((submission) => submission.id !== incoming.id), incoming],
    filterGameKey,
  );
}

export function useSubmissionsFeed(
  sessionId: string | null,
  filterGameKey?: string | null,
): UseSubmissionsFeedReturn {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setSubmissions([]);
      setIsLoading(false);
      return;
    }

    if (isMockMode()) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    let cancelled = false;
    let reconcileSequence = 0;
    setIsLoading(true);

    async function reconcileSubmissions() {
      const sequence = ++reconcileSequence;
      let query = supabase
        .from('student_submissions')
        .select('*')
        .eq('session_id', sessionId)
        .in('status', ['pending', 'approved'])
        .not('game_key', 'is', null)
        .neq('game_key', 'cabin-mystery');

      if (filterGameKey) query = query.eq('game_key', filterGameKey);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (cancelled || sequence !== reconcileSequence) return;
      if (!error && data) {
        setSubmissions(normalizeSubmissions(data as StudentSubmission[], filterGameKey));
      } else if (error && process.env.NODE_ENV === 'development') {
        console.warn('[cockpit-feed] reconciliation failed', error.message);
      }
      setIsLoading(false);
    }

    void reconcileSubmissions();

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
          reconcileSequence += 1;
          const submission = payload.new as StudentSubmission;
          setSubmissions((current) => mergeSubmissionEvent(current, submission, filterGameKey));
          setIsLoading(false);
        },
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
          reconcileSequence += 1;
          const submission = payload.new as StudentSubmission;
          setSubmissions((current) => mergeSubmissionEvent(current, submission, filterGameKey));
          setIsLoading(false);
        },
      )
      .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        if (status === 'SUBSCRIBED') {
          void reconcileSubmissions();
        } else if (
          process.env.NODE_ENV === 'development'
          && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
        ) {
          console.warn(`[cockpit-feed] realtime ${status.toLowerCase()}; polling fallback remains active`);
        }
      });

    const reconciliationInterval = setInterval(() => {
      void reconcileSubmissions();
    }, 15_000);

    return () => {
      cancelled = true;
      clearInterval(reconciliationInterval);
      void supabase.removeChannel(channel);
    };
  }, [sessionId, filterGameKey]);

  return { submissions, isLoading };
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import type { StudentSubmission } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  logRealtimeDiagnostic,
  reconcileIntervalFor,
  startRealtimeChannelLifecycle,
  type RealtimeHealth,
} from '@/lib/realtime-health';

interface UseSubmissionsFeedReturn {
  submissions: StudentSubmission[];
  isLoading: boolean;
  realtimeHealth: RealtimeHealth;
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
  const [realtimeHealth, setRealtimeHealth] = useState<RealtimeHealth>('connecting');

  useEffect(() => {
    if (!sessionId) {
      setSubmissions([]);
      setIsLoading(false);
      setRealtimeHealth('closed');
      return;
    }

    if (isMockMode()) {
      setIsLoading(false);
      setRealtimeHealth('subscribed');
      return;
    }

    const supabase = createClient();
    let cancelled = false;
    let reconcileSequence = 0;
    let currentHealth: RealtimeHealth = 'connecting';
    let channelHealth: RealtimeHealth = 'connecting';
    let reconciliationTimer: ReturnType<typeof setTimeout> | null = null;
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
        logRealtimeDiagnostic('cockpit-feed', 'canonical_reconcile', { count: data.length });
      } else if (error) {
        logRealtimeDiagnostic('cockpit-feed', 'reconcile_failed');
        setIsLoading(false);
        throw new Error(error.message);
      }
      setIsLoading(false);
    }

    const createChannel = () => supabase
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
          logRealtimeDiagnostic('cockpit-feed', 'database_change_apply', { event: 'insert' });
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
          logRealtimeDiagnostic('cockpit-feed', 'database_change_apply', { event: 'update' });
        },
      );

    const stopLifecycle = startRealtimeChannelLifecycle<RealtimeChannel>({
      scope: 'cockpit-feed',
      createChannel,
      removeChannel: (channel) => supabase.removeChannel(channel),
      reconcile: reconcileSubmissions,
      onHealth: (health) => {
        channelHealth = health;
        currentHealth = health;
        setRealtimeHealth(health);
      },
    });

    const runReconciliationLoop = async () => {
      try {
        await reconcileSubmissions();
        currentHealth = channelHealth;
        setRealtimeHealth(channelHealth);
      } catch {
        currentHealth = 'degraded';
        setRealtimeHealth('degraded');
      }
      if (cancelled) return;
      reconciliationTimer = setTimeout(runReconciliationLoop, reconcileIntervalFor(currentHealth));
    };
    void runReconciliationLoop();

    return () => {
      cancelled = true;
      if (reconciliationTimer) clearTimeout(reconciliationTimer);
      stopLifecycle();
    };
  }, [sessionId, filterGameKey]);

  return { submissions, isLoading, realtimeHealth };
}

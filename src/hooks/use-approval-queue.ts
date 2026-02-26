'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import type { StudentSubmission } from '@/lib/supabase/types';

interface UseApprovalQueueReturn {
  pending: StudentSubmission[];
  approve: (submissionId: string) => Promise<void>;
  reject: (submissionId: string) => Promise<void>;
  setError: (submissionId: string, errorMessage: string) => Promise<void>;
  isLoading: boolean;
}

export function useApprovalQueue(sessionId: string | null): UseApprovalQueueReturn {
  const [pending, setPending] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial pending submissions and subscribe to changes
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

    // Load initial pending submissions — exclude game_key=null (those are Class Questions, not game responses)
    async function loadPending() {
      const { data, error } = await supabase
        .from('student_submissions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'pending')
        .not('game_key', 'is', null)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setPending(data as StudentSubmission[]);
      }
      setIsLoading(false);
    }

    loadPending();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`submissions:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_submissions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: unknown }) => {
          const newSubmission = payload.new as StudentSubmission;
          // Only add to approval queue if it's a game response (game_key present)
          if (newSubmission.status === 'pending' && newSubmission.game_key !== null) {
            setPending((prev) => [...prev, newSubmission]);
          }
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
          // Remove from pending if status changed
          if (updated.status !== 'pending') {
            setPending((prev) => prev.filter((s) => s.id !== updated.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const approve = useCallback(async (submissionId: string) => {
    if (isMockMode()) return;

    const supabase = createClient();
    await supabase
      .from('student_submissions')
      .update({ status: 'approved' })
      .eq('id', submissionId);

    // Optimistically remove from list
    setPending((prev) => prev.filter((s) => s.id !== submissionId));
  }, []);

  const reject = useCallback(async (submissionId: string) => {
    if (isMockMode()) return;

    const supabase = createClient();
    await supabase
      .from('student_submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId);

    setPending((prev) => prev.filter((s) => s.id !== submissionId));
  }, []);

  const setError = useCallback(async (submissionId: string, errorMessage: string) => {
    if (isMockMode()) return;

    const supabase = createClient();
    await supabase
      .from('student_submissions')
      .update({ status: 'error', error_message: errorMessage })
      .eq('id', submissionId);

    setPending((prev) => prev.filter((s) => s.id !== submissionId));
  }, []);

  return { pending, approve, reject, setError, isLoading };
}

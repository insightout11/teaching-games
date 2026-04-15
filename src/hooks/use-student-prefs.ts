'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import type { StudentSessionPref } from '@/lib/supabase/types';

// Returns a Map keyed by client_id → pref row.
// Also exposes a studentIdToClientId map built from scores so that
// roster students (who have a student_id) can be looked up by either key.
export function useStudentPrefs(sessionId: string | null): Map<string, StudentSessionPref> {
  const [prefsMap, setPrefsMap] = useState<Map<string, StudentSessionPref>>(new Map());

  const applyUpdate = useCallback((pref: StudentSessionPref) => {
    setPrefsMap((prev) => {
      const next = new Map(prev);
      next.set(pref.client_id, pref);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!sessionId || isMockMode()) return;

    const supabase = createClient();

    // Load existing prefs on mount
    supabase
      .from('student_session_prefs')
      .select('*')
      .eq('session_id', sessionId)
      .then(({ data }: { data: StudentSessionPref[] | null }) => {
        if (!data) return;
        setPrefsMap(new Map(data.map((p: StudentSessionPref) => [p.client_id, p])));
      });

    // Subscribe to inserts and updates
    const channel = supabase
      .channel(`student_session_prefs:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_session_prefs',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: unknown }) => {
          applyUpdate(payload.new as StudentSessionPref);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, applyUpdate]);

  return prefsMap;
}

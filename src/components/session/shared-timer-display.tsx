'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';

interface SharedTimerPayload {
  type?: 'timer';
  totalSeconds?: number;
  remainingSeconds?: number;
  running?: boolean;
  startedAt?: string | null;
}

/** Remaining time, adjusted for wall-clock elapsed since the teacher started it. */
function getSyncedRemaining(payload: SharedTimerPayload): number {
  const remaining = Math.max(0, Math.floor(payload.remainingSeconds ?? 0));
  if (!payload.running || !payload.startedAt) return remaining;
  const elapsed = Math.floor((Date.now() - new Date(payload.startedAt).getTime()) / 1000);
  return Math.max(0, remaining - Math.max(0, elapsed));
}

/**
 * Display-only countdown for the shared/projected screen. The teacher runs the Timer tool in the
 * cockpit, which broadcasts state to session_private_state('timer'); this mirrors it so the class
 * can see the clock. No controls — the cockpit owns those.
 */
export function SharedTimerDisplay({ sessionId }: { sessionId: string }) {
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const apply = useCallback((payload: SharedTimerPayload) => {
    if (payload.type && payload.type !== 'timer') return;
    const t = Math.max(1, Math.floor(payload.totalSeconds ?? 0));
    const rem = getSyncedRemaining(payload);
    setTotal(t);
    setRemaining(rem);
    setRunning(Boolean(payload.running && rem > 0));
    // Shown once the timer is running, paused mid-count, or just hit zero — not while it sits
    // freshly set-but-unstarted.
    setEngaged(Boolean(payload.running) || (rem > 0 && rem < t) || rem === 0);
  }, []);

  useEffect(() => {
    if (!sessionId || isMockMode()) return;
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from('session_private_state')
        .select('payload')
        .eq('session_id', sessionId)
        .eq('key', 'timer')
        .maybeSingle();
      if (!cancelled && data?.payload) apply(data.payload as SharedTimerPayload);
    }
    void load();

    const channel = supabase
      .channel(`shared-timer:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_private_state', filter: `session_id=eq.${sessionId}` },
        (payload: { new: unknown }) => {
          const row = payload.new as { key?: string; payload?: SharedTimerPayload } | null;
          if (row?.key === 'timer' && row.payload) apply(row.payload);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [sessionId, apply]);

  // Local tick between broadcasts so the countdown is smooth.
  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, remaining]);

  const finished = engaged && remaining === 0;

  // Clear the "time's up" beat after a few seconds.
  useEffect(() => {
    if (finished) {
      const t = setTimeout(() => setEngaged(false), 5000);
      return () => clearTimeout(t);
    }
  }, [finished]);

  // Hide a fresh, unstarted timer (set to full, not running).
  const show = engaged && !(remaining === total && !running);
  if (!show) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const urgent = remaining <= 10 && remaining > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="fixed left-1/2 top-4 z-[150] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-cyan-400/30 bg-[#0d1a2e]/95 px-5 py-2.5 shadow-lg shadow-cyan-500/10"
      >
        <Timer className={`h-5 w-5 ${finished ? 'text-red-400' : urgent ? 'text-orange-400' : 'text-cyan-300'}`} aria-hidden />
        <span
          className={`font-mono text-3xl font-bold tabular-nums tracking-wider ${
            finished ? 'animate-pulse text-red-400' : urgent ? 'text-orange-400' : 'text-cyan-200'
          }`}
        >
          {finished ? "Time's up!" : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

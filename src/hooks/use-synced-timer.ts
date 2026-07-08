'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { computeTimerState } from '@/lib/input-spec';

export interface SyncedTimer {
  /** Whole seconds left in the answer window (0 once expired). */
  timeLeft: number;
  /** Whole seconds until answers open (0 once open / during the grace beat). */
  opensIn: number;
  /** True once the grace beat has elapsed. */
  answersOpen: boolean;
  /** Extend the deadline by N seconds (teacher "+time" escape hatch). */
  addSeconds: (seconds: number) => void;
}

/**
 * Teacher-side countdown that agrees with student devices within a tick.
 *
 * When a server-stamped timed round is live (populated by the input-spec API
 * response), remaining time is derived from the SAME startedAt/answersOpenAt the
 * students receive from the poll, via the shared computeTimerState. Until the
 * server clock lands (~1 poll round-trip) — or if it is unavailable — it falls
 * back to a local decrement from `timerSeconds`, so the countdown always runs and
 * always terminates.
 *
 * `active` should track the phase in which the timer is running; flipping it false
 * freezes the timer, flipping it true (re)seeds the local fallback.
 */
export function useSyncedTimer(timerSeconds: number, active: boolean): SyncedTimer {
  const round = useSessionStore((s) => s.activeTimedRound);
  const clockOffset = useSessionStore((s) => s.serverClockOffset);

  // Does the store's round clock describe the same window this timer is counting?
  const matchedRound = round && round.timerSeconds === timerSeconds ? round : null;

  const extraMsRef = useRef(0);
  const localStartRef = useRef<number | null>(null);

  const compute = useCallback((): { timeLeft: number; opensIn: number; answersOpen: boolean } => {
    if (matchedRound) {
      return computeTimerState(matchedRound, clockOffset, extraMsRef.current);
    }
    // Local fallback: decrement from the moment this timer went active.
    if (localStartRef.current == null) localStartRef.current = Date.now();
    const totalMs = timerSeconds * 1000 + extraMsRef.current;
    const timeLeft = Math.max(0, Math.ceil((localStartRef.current + totalMs - Date.now()) / 1000));
    return { timeLeft, opensIn: 0, answersOpen: true };
  }, [matchedRound, clockOffset, timerSeconds]);

  const [state, setState] = useState(() => ({ timeLeft: timerSeconds, opensIn: 0, answersOpen: !matchedRound }));

  // Reset the local fallback anchor whenever a fresh window begins.
  useEffect(() => {
    if (!active) {
      localStartRef.current = null;
      extraMsRef.current = 0;
      return;
    }
    if (!matchedRound) localStartRef.current = Date.now();
  }, [active, matchedRound]);

  useEffect(() => {
    if (!active) return;
    setState(compute());
    const interval = setInterval(() => setState(compute()), 250);
    return () => clearInterval(interval);
  }, [active, compute]);

  const addSeconds = useCallback((seconds: number) => {
    extraMsRef.current += seconds * 1000;
    setState(compute());
  }, [compute]);

  return { ...state, addSeconds };
}

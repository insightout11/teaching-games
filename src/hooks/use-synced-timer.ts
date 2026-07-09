'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { computeTimerState, ANSWERS_OPEN_GRACE_MS } from '@/lib/input-spec';

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
 * students receive from the poll, via the shared computeTimerState.
 *
 * Until the server clock lands (~1 round-trip after broadcast) it falls back to a
 * LOCAL clock that already includes the grace window — so a teacher screen shows
 * the same 3-2-1 "get ready" beat immediately, instead of briefly flashing the
 * answers open and then snapping shut when the server clock arrives.
 *
 * `roundNonce` is the game's local `startedAt` for the current round. When given,
 * the server round is only adopted once its `clientStartedAt` matches — this stops
 * a STALE previous round (still in the store during the ~1s handoff, same
 * timerSeconds) from being mistaken for the new one.
 *
 * `active` should track the phase in which the timer is running; flipping it false
 * freezes the timer, flipping it true (re)seeds the local fallback.
 */
export function useSyncedTimer(timerSeconds: number, active: boolean, roundNonce?: number): SyncedTimer {
  const round = useSessionStore((s) => s.activeTimedRound);
  const clockOffset = useSessionStore((s) => s.serverClockOffset);

  // The store's round clock only counts as "this round" when the window length
  // matches AND (if a nonce was given) it is the same broadcast — not a stale one.
  const matchedRound =
    round &&
    round.timerSeconds === timerSeconds &&
    (roundNonce == null || round.clientStartedAt === roundNonce)
      ? round
      : null;

  const extraMsRef = useRef(0);
  const localStartRef = useRef<number | null>(null);

  const compute = useCallback((): { timeLeft: number; opensIn: number; answersOpen: boolean } => {
    if (matchedRound) {
      const { timeLeft, opensIn, answersOpen } = computeTimerState(matchedRound, clockOffset, extraMsRef.current);
      return { timeLeft, opensIn, answersOpen };
    }
    // Local fallback: synthesize the same grace + window from when this timer went
    // active, so the pre-stamp beat matches the server-stamped one that follows.
    if (localStartRef.current == null) localStartRef.current = Date.now();
    const localClock = {
      timerSeconds,
      startedAt: localStartRef.current,
      answersOpenAt: localStartRef.current + ANSWERS_OPEN_GRACE_MS,
    };
    const { timeLeft, opensIn, answersOpen } = computeTimerState(localClock, 0, extraMsRef.current);
    return { timeLeft, opensIn, answersOpen };
  }, [matchedRound, clockOffset, timerSeconds]);

  const [state, setState] = useState(() => ({ timeLeft: timerSeconds, opensIn: 0, answersOpen: false }));

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

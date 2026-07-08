'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { computeTimerState } from '@/lib/input-spec';

export interface RaceSolver<T = Record<string, unknown>> {
  studentId: string;
  displayName: string;
  position: number;
  data: T;
}

interface UseRaceModeOptions {
  studentCount: number;
  timerSeconds: number;
  minStudentsForRace?: number;
}

export function useRaceMode<T = Record<string, unknown>>({
  studentCount,
  timerSeconds,
  minStudentsForRace = 2,
}: UseRaceModeOptions) {
  const isSimultaneous = studentCount >= minStudentsForRace;

  const [raceSolvers, setRaceSolvers] = useState<RaceSolver<T>[]>([]);
  const [raceFinished, setRaceFinished] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(timerSeconds);
  const [raceActive, setRaceActive] = useState(false);

  const raceFinishedRef = useRef(false);
  raceFinishedRef.current = raceFinished;

  // Server-stamped clock for the live round (set from the input-spec API response),
  // so the teacher countdown matches student devices within a tick. Falls back to a
  // local decrement until the clock lands / when unavailable.
  const round = useSessionStore(s => s.activeTimedRound);
  const clockOffset = useSessionStore(s => s.serverClockOffset);
  const matchedRound = round && round.timerSeconds === timerSeconds ? round : null;
  // The teacher "+time" button extends the shared deadline instead of a local-only bump.
  const extraMsRef = useRef(0);
  const localStartRef = useRef<number | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!raceActive || raceFinished) return;
    const tick = () => {
      let remaining: number;
      if (matchedRound) {
        remaining = computeTimerState(matchedRound, clockOffset, extraMsRef.current).timeLeft;
      } else {
        if (localStartRef.current == null) localStartRef.current = Date.now();
        const totalMs = timerSeconds * 1000 + extraMsRef.current;
        remaining = Math.max(0, Math.ceil((localStartRef.current + totalMs - Date.now()) / 1000));
      }
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        setRaceFinished(true);
        setRaceActive(false);
      }
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [raceActive, raceFinished, matchedRound, clockOffset, timerSeconds]);

  const startRace = useCallback(() => {
    setRaceSolvers([]);
    setRaceFinished(false);
    extraMsRef.current = 0;
    localStartRef.current = null;
    setTimeRemaining(timerSeconds);
    setRaceActive(true);
  }, [timerSeconds]);

  const endRace = useCallback(() => {
    setRaceFinished(true);
    setRaceActive(false);
  }, []);

  const resetRace = useCallback(() => {
    setRaceSolvers([]);
    setRaceFinished(false);
    setRaceActive(false);
    extraMsRef.current = 0;
    localStartRef.current = null;
    setTimeRemaining(timerSeconds);
  }, [timerSeconds]);

  const addSolver = useCallback((studentId: string, displayName: string, data: T): number | null => {
    let position: number | null = null;

    setRaceSolvers(prev => {
      if (prev.some(s => s.studentId === studentId)) return prev;
      position = prev.length + 1;
      return [...prev, { studentId, displayName, position, data }];
    });

    return position;
  }, []);

  const hasSolver = useCallback((studentId: string): boolean => {
    return raceSolvers.some(s => s.studentId === studentId);
  }, [raceSolvers]);

  const addTime = useCallback((seconds: number) => {
    if (!raceActive || raceFinished) return;
    extraMsRef.current += seconds * 1000;
    setTimeRemaining(prev => prev + seconds);
  }, [raceActive, raceFinished]);

  return {
    isSimultaneous,
    raceSolvers,
    setRaceSolvers,
    raceFinished,
    raceFinishedRef,
    timeRemaining,
    raceActive,
    startRace,
    endRace,
    resetRace,
    addSolver,
    hasSolver,
    addTime,
  };
}

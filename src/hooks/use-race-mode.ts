'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
  minStudentsForRace = 3,
}: UseRaceModeOptions) {
  const isSimultaneous = studentCount >= minStudentsForRace;

  const [raceSolvers, setRaceSolvers] = useState<RaceSolver<T>[]>([]);
  const [raceFinished, setRaceFinished] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(timerSeconds);
  const [raceActive, setRaceActive] = useState(false);

  const raceFinishedRef = useRef(false);
  raceFinishedRef.current = raceFinished;

  // Timer countdown
  useEffect(() => {
    if (!raceActive || raceFinished) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setRaceFinished(true);
          setRaceActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [raceActive, raceFinished]);

  const startRace = useCallback(() => {
    setRaceSolvers([]);
    setRaceFinished(false);
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
  };
}

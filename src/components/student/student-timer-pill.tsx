'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

export interface SharedTimerState {
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
  startedAt: string | null;
}

/** Remaining seconds on the server clock (Date.now() + offset), never the raw device clock. */
function remainingAt(timer: SharedTimerState, clockOffsetMs: number): number {
  const base = Math.max(0, Math.floor(timer.remainingSeconds));
  if (!timer.running || !timer.startedAt) return base;
  const elapsed = Math.floor((Date.now() + clockOffsetMs - new Date(timer.startedAt).getTime()) / 1000);
  return Math.max(0, base - Math.max(0, elapsed));
}

/**
 * Phone mirror of the cockpit Timer tool — the same countdown the shared screen
 * shows. Hidden while the timer sits set-but-unstarted, like SharedTimerDisplay.
 */
export function StudentTimerPill({ timer, clockOffsetMs }: { timer: SharedTimerState | null; clockOffsetMs: number }) {
  const [, setTick] = useState(0);
  const running = !!timer?.running;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [running]);

  // Time's up: buzz (where the phone supports it) and flash the screen once.
  const remNow = timer ? remainingAt(timer, clockOffsetMs) : -1;
  const [flashing, setFlashing] = useState(false);
  const hitZero = running && remNow === 0;
  useEffect(() => {
    if (!hitZero) return;
    try { navigator.vibrate?.([220, 120, 220]); } catch { /* not supported */ }
    setFlashing(true);
    const t = setTimeout(() => setFlashing(false), 1400);
    return () => clearTimeout(t);
  }, [hitZero]);

  // "Time's up" shows for a few seconds, then gets out of the way.
  const atZero = !!timer && remNow === 0;
  const [zeroGone, setZeroGone] = useState(false);
  useEffect(() => {
    if (!atZero) { setZeroGone(false); return; }
    const t = setTimeout(() => setZeroGone(true), 6000);
    return () => clearTimeout(t);
  }, [atZero]);

  if (!timer) return null;
  const rem = remNow;
  const engaged = timer.running || (rem > 0 && rem < timer.totalSeconds) || rem === 0;
  if (!engaged || (rem === 0 && zeroGone)) return null;

  const mm = Math.floor(rem / 60);
  const ss = String(rem % 60).padStart(2, '0');
  const urgent = rem <= 10;
  return (
    <>
    {flashing && <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] animate-pulse bg-amber-300/25" />}
    <div
      role="timer"
      aria-live="off"
      className={[
        'fixed right-3 top-[84px] z-40 flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-base font-semibold tabular-nums shadow-lg backdrop-blur-md',
        rem === 0
          ? 'border-red-400/50 bg-red-950/80 text-red-200'
          : urgent
            ? 'border-amber-300/50 bg-amber-950/80 text-amber-100'
            : 'border-white/15 bg-slate-950/80 text-white',
      ].join(' ')}
    >
      <Timer className="h-4 w-4" aria-hidden />
      {rem === 0 ? "Time's up" : `${mm}:${ss}`}
      {!timer.running && rem > 0 && <span className="text-xs font-normal text-white/60">paused</span>}
    </div>
    </>
  );
}

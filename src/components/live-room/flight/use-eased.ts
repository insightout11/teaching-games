'use client';

import { useEffect, useRef, useState } from 'react';

/** How a value should move: how long a full swing takes, and how long to wait before starting. */
export interface Ramp {
  seconds: number;
  delay?: number;
}

/**
 * Numbers that glide toward their target instead of jumping to it. Weather uses this: when it turns, the clouds come in
 * over tens of seconds and the deck thickens after them, rather than the whole sky changing in one frame. `range` is
 * the size of a full swing (1 for a 0 to 1 amount, 255 for a colour channel). A value that is rising and one that is
 * falling can take different ramps. The first value shown is the target itself, so nothing glides on first load.
 * Updates are published in coarse steps, so a long glide re-renders the component tens of times, not hundreds.
 */
export function useEasedVector(target: number[], range: number, up: Ramp, down: Ramp = up): number[] {
  const current = useRef(target.slice());
  const shown = useRef(target.slice());
  const [value, setValue] = useState(target);
  const key = target.join(',');

  useEffect(() => {
    const goal = key.split(',').map(Number);
    const rising = goal.reduce((a, b) => a + b, 0) >= current.current.reduce((a, b) => a + b, 0);
    const ramp = rising ? up : down;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      let last = performance.now();
      timer = setInterval(() => {
        const now = performance.now();
        const step = (range / ramp.seconds) * ((now - last) / 1000);
        last = now;
        let done = true;
        current.current = current.current.map((c, i) => {
          const d = goal[i] - c;
          if (Math.abs(d) <= step) return goal[i];
          done = false;
          return c + Math.sign(d) * step;
        });
        if (done || current.current.some((c, i) => Math.abs(c - shown.current[i]) >= range * 0.01)) {
          shown.current = current.current.slice();
          setValue(shown.current);
        }
        if (done && timer) clearInterval(timer);
      }, 60);
    }, (ramp.delay ?? 0) * 1000);
    return () => {
      clearTimeout(start);
      if (timer) clearInterval(timer);
    };
    // The ramps are fixed per call site; only the target (as `key`) and the range start a new glide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, range]);

  return value;
}

/** One number gliding toward its target; see `useEasedVector`. */
export function useEased(target: number, up: Ramp, down: Ramp = up): number {
  return useEasedVector([target], 1, up, down)[0];
}

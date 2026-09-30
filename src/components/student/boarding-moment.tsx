'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BoardingLane } from '@/components/session/live-room/boarding-lane';
import { buzz, BUZZ } from '@/components/student/phone-shell';

const MONO = 'font-[family-name:var(--font-instrument)] uppercase tracking-[0.14em]';

/**
 * The phone's boarding moment, shown once per session right after joining:
 * your own character walks up the airstairs, then your seat gets stamped.
 * Tap anywhere to skip.
 */
export function BoardingMoment({ sessionId, name, seed, seat }: { sessionId: string; name: string; seed: string | null; seat: string | null }) {
  const key = `lc-boarded:${sessionId}`;
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);
  const [aboard, setAboard] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // storage blocked: still show it once for this page load
    }
    setShow(true);
  }, [key]);

  useEffect(() => {
    if (!aboard) return;
    buzz(BUZZ.stamp);
    const t = window.setTimeout(() => setShow(false), 2200);
    return () => window.clearTimeout(t);
  }, [aboard]);

  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => setShow(false)}
      aria-label="Skip boarding"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-lc-bg px-5 text-center"
    >
      <p className={`${MONO} text-[11px] text-emerald-300`}>Now boarding</p>
      <p className="font-display text-3xl text-lc-text">Welcome aboard, {name}</p>
      <div className="w-full max-w-sm">
        <BoardingLane arrivals={[{ id: 'me', name, seed }]} onBoarded={() => setAboard(true)} />
      </div>
      {aboard ? (
        <motion.div
          initial={reduce ? false : { scale: 2, rotate: -14, opacity: 0 }}
          animate={{ scale: 1, rotate: -8, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 14 }}
          className="rounded-lg border-[3px] border-rose-400 px-4 py-2 text-rose-300"
        >
          <p className={`${MONO} text-xs`}>Boarded</p>
          <p className="font-display text-3xl leading-none">{seat ? `Seat ${seat}` : 'Find your seat'}</p>
        </motion.div>
      ) : (
        <p className={`${MONO} text-[11px] text-lc-text3`}>Tap to skip</p>
      )}
    </button>
  );
}

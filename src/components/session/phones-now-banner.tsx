'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';
import { play } from '@/lib/audio/manager';
import { useFocusBus } from '@/stores/focus-bus-store';

const TAKEOVER_MS = 1800;
const SETTLE_MS = 5000;

/**
 * On the shared screen: tells the class plainly when their phones want an answer.
 * The moment phones open, the whole screen says so (with the seatbelt chime, which the
 * class hears through Zoom), then it settles into a banner at the top while phones are open.
 */
export function PhonesNowBanner() {
  const spec = useSessionStore((s) => !!s.inputSpec);
  const asks = useFocusBus((s) => s.phoneAsks.length > 0);
  const active = spec || asks;
  const [takeover, setTakeover] = useState(false);
  const was = useRef(active);
  useEffect(() => {
    const opened = active && !was.current;
    was.current = active;
    if (!opened) { if (!active) setTakeover(false); return; }
    setTakeover(true);
    try { play('seatbelt'); } catch { /* sound off */ }
    const t = window.setTimeout(() => setTakeover(false), TAKEOVER_MS);
    return () => window.clearTimeout(t);
  }, [active]);

  // After a few seconds the banner shrinks to a small phone chip in the corner, out of the way.
  const [small, setSmall] = useState(false);
  useEffect(() => {
    setSmall(false);
    if (!active || takeover) return;
    const t = window.setTimeout(() => setSmall(true), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [active, takeover]);

  return (
    <>
      <AnimatePresence>
        {active && takeover && (
          <motion.div
            key="takeover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -8 }}
              animate={{ scale: 1, rotate: [0, -6, 6, -4, 0] }}
              transition={{ scale: { type: 'spring', stiffness: 300, damping: 18 }, rotate: { duration: 0.7, delay: 0.2 } }}
              className="flex flex-col items-center gap-4 rounded-[2rem] border-4 border-amber-300 bg-amber-300 px-14 py-10 text-slate-900 shadow-[0_0_80px_rgba(252,211,77,0.6)]"
            >
              <Smartphone className="h-24 w-24" strokeWidth={2.2} aria-hidden />
              <p className="font-game text-6xl leading-none">Phones now!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && !takeover && !small && (
          <motion.div
            key="banner"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="pointer-events-none fixed left-1/2 top-16 z-[70] -translate-x-1/2"
          >
            <div className="flex items-center gap-2.5 rounded-full border-2 border-amber-300 bg-amber-300 px-5 py-2 font-game text-xl text-slate-900 shadow-[0_0_30px_rgba(252,211,77,0.55)]">
              <Smartphone className="h-6 w-6 animate-bounce" aria-hidden />
              On your phones
            </div>
          </motion.div>
        )}
        {active && !takeover && small && (
          <motion.div
            key="chip"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.85, scale: 1 }}
            exit={{ opacity: 0 }}
            title="Phones are open"
            className="pointer-events-none fixed right-4 top-16 z-[70]"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-amber-300 px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-md">
              <Smartphone className="h-3.5 w-3.5" aria-hidden /> Phones
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

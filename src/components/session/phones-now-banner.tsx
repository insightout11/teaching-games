'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { useSessionStore } from '@/stores/session-store';

/** On the shared screen: tells the class plainly when their phones want an answer. */
export function PhonesNowBanner() {
  const active = useSessionStore((s) => !!s.inputSpec);
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="pointer-events-none fixed left-1/2 top-3 z-[70] -translate-x-1/2"
        >
          <div className="flex items-center gap-2.5 rounded-full border-2 border-amber-300 bg-amber-300 px-5 py-2 font-game text-xl text-slate-900 shadow-[0_0_30px_rgba(252,211,77,0.55)]">
            <Smartphone className="h-6 w-6 animate-bounce" aria-hidden />
            On your phones
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, Plane, Star } from 'lucide-react';
import { souvenirIcon } from '@/components/session/live-room/souvenir-icons';
import type { WorldFlightRecordData } from '@/components/session/live-room/world-flight-record';
import { play } from '@/lib/audio/manager';

type Landing = NonNullable<WorldFlightRecordData['landing']>;

/**
 * The arrival reward sequence (cabin moments): after touchdown, one beat per tap on the shared screen: the passport
 * stamp, each souvenir, then the flight hour and stars. Then the Welcome card takes over. The teacher taps to move on.
 */
export function RewardReel({ landing, onDone }: { landing: Landing; onDone: () => void }) {
  const reduce = useReducedMotion();
  const beats: Array<{ key: string; kind: 'stamp' | 'souvenir' | 'hours'; souvenir?: NonNullable<Landing['souvenirs']>[number] }> = [
    { key: 'stamp', kind: 'stamp' },
    ...(landing.souvenirs ?? []).map((s) => ({ key: `sv-${s.id}`, kind: 'souvenir' as const, souvenir: s })),
    { key: 'hours', kind: 'hours' },
  ];
  const [i, setI] = useState(0);
  const beat = beats[i];
  const next = () => {
    if (i + 1 >= beats.length) { onDone(); return; }
    try { play('brandResolve'); } catch { /* sound off */ }
    setI(i + 1);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center" onClick={next} role="button" tabIndex={0} aria-label="Next reward" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') next(); }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={beat.key}
          initial={reduce ? false : { y: 40, opacity: 0, rotate: beat.kind === 'stamp' ? -8 : 2, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, rotate: beat.kind === 'stamp' ? -3 : 0, scale: 1 }}
          exit={reduce ? undefined : { y: -30, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 160, damping: 16 }}
          className="relative w-[min(460px,80vw)] rounded-2xl bg-[#f4efe3] px-8 py-7 text-center text-[#1b2233] shadow-2xl"
        >
          {beat.kind === 'stamp' && (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1b2233]/60">{landing.newCity ? 'New stamp' : 'Stamped again'}</p>
              <motion.div
                initial={reduce ? false : { scale: 1.8, opacity: 0, rotate: -18 }}
                animate={{ scale: 1, opacity: 1, rotate: -8 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 12 }}
                className="mx-auto mt-4 flex h-40 w-40 flex-col items-center justify-center rounded-full border-[5px] border-double border-[#d4537e] text-[#d4537e]"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.25em]">Arrived</span>
                <span className="mt-1 max-w-[8.5rem] font-display text-2xl leading-tight">{landing.city}</span>
                <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em]">{new Date().toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
              </motion.div>
              {landing.lesson && <p className="mt-4 text-sm text-[#1b2233]/70">{landing.lesson}</p>}
            </>
          )}
          {beat.kind === 'souvenir' && beat.souvenir && (() => {
            const Icon = souvenirIcon(beat.souvenir.icon);
            return (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1b2233]/60">Souvenir from {landing.city}</p>
                <motion.div initial={reduce ? false : { scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 11 }} className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-amber-300/50">
                  <Icon className="h-12 w-12 text-[#b7791f]" />
                </motion.div>
                <p className="mt-4 font-display text-3xl">{beat.souvenir.name}</p>
                <p className="mt-2 text-base text-[#1b2233]/75">{beat.souvenir.description}</p>
              </>
            );
          })()}
          {beat.kind === 'hours' && (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#1b2233]/60">Flight log</p>
              <div className="mt-4 flex items-center justify-center gap-8">
                <span className="flex flex-col items-center"><Plane className="h-10 w-10" /><span className="mt-1 font-display text-3xl">+1</span><span className="text-sm text-[#1b2233]/70">flight hour</span></span>
                <span className="flex flex-col items-center"><Star className="h-10 w-10 text-amber-600" /><span className="mt-1 font-display text-3xl">+{landing.stars}</span><span className="text-sm text-[#1b2233]/70">star{landing.stars === 1 ? '' : 's'}</span></span>
              </div>
              <p className="mt-3 text-sm text-[#1b2233]/70">
                {[landing.everyoneAboard && 'Everyone Aboard', landing.strongLanding && 'Strong Landing'].filter(Boolean).join(' · ') || 'Stars come from everyone joining in and a strong landing.'}
              </p>
            </>
          )}
          <p className="mt-6 flex items-center justify-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#1b2233]/50">
            {i + 1 < beats.length ? 'Tap for next' : 'Tap to continue'} <ChevronRight className="h-3.5 w-3.5" />
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

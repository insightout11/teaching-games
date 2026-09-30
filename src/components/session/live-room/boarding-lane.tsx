'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CrewWalker } from '@/components/ui/crew-walker';
import { resolveLook } from '@/lib/crew-look';

export interface Boarder {
  id: string;
  name: string;
  seed: string | null;
  /** Late arrivals jog. */
  late?: boolean;
}

const WALK_MS = 4200;
const GAP_MS = 900;

/**
 * Big-screen boarding: each arriving student walks across the tarmac, climbs
 * the airstairs and steps into the plane. Arrivals queue so a rush of phones
 * becomes a little parade instead of a pile-up. `onBoarded` fires as each one
 * disappears through the door (the cabin seat lights up then).
 */
export function BoardingLane({ arrivals, onBoarded }: { arrivals: Boarder[]; onBoarded?: (id: string) => void }) {
  const reduce = useReducedMotion();
  const [walking, setWalking] = useState<Array<Boarder & { key: string }>>([]);
  const seen = useRef<Set<string>>(new Set());
  const nextStart = useRef(0);

  useEffect(() => {
    const fresh = arrivals.filter((a) => !seen.current.has(a.id));
    if (!fresh.length) return;
    const timers: number[] = [];
    for (const a of fresh) {
      seen.current.add(a.id);
      const now = Date.now();
      const startAt = Math.max(now, nextStart.current);
      nextStart.current = startAt + GAP_MS;
      const dur = a.late ? WALK_MS * 0.65 : WALK_MS;
      timers.push(window.setTimeout(() => {
        setWalking((w) => [...w, { ...a, key: `${a.id}-${startAt}` }]);
        timers.push(window.setTimeout(() => {
          setWalking((w) => w.filter((x) => x.id !== a.id));
          onBoarded?.(a.id);
        }, reduce ? 300 : dur));
      }, startAt - now));
    }
    return () => { /* timers run to completion so nobody gets stuck on the tarmac */ };
  }, [arrivals, onBoarded, reduce]);

  return (
    <div className="relative mx-auto aspect-[600/160] max-h-36 w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-sm">
      <svg viewBox="0 0 600 160" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 h-full w-full" aria-hidden>
        {/* tarmac + painted line */}
        <rect x="0" y="128" width="600" height="32" fill="#1C2A44" />
        <path d="M0 144 L600 144" stroke="#F6C177" strokeWidth="2" strokeDasharray="18 14" opacity=".5" />
        {/* plane fuselage (side view, nose off to the right) */}
        <path d="M440 44 Q470 36 520 36 L600 36 L600 108 L470 108 Q440 106 430 84 Q428 60 440 44Z" fill="#EAF1FF" />
        <path d="M430 84 L600 84 L600 96 L446 96Z" fill="#4DA3FF" opacity=".85" />
        {[492, 516, 540, 564, 588].map((x) => <circle key={x} cx={x} cy="58" r="6" fill="#0B1220" opacity=".8" />)}
        {/* open door */}
        <rect x="452" y="46" width="22" height="40" rx="5" fill="#0B1220" />
        <rect x="452" y="46" width="22" height="40" rx="5" fill="none" stroke="#F6C177" strokeWidth="2" />
        {/* airstairs */}
        <path d="M450 88 L384 132 L372 132 L440 86Z" fill="#6F7F9C" />
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M${446 - i * 9.5} ${90 + i * 6.3} l-10 0`} stroke="#A9B7D0" strokeWidth="2" />
        ))}
        <path d="M456 80 L392 124" stroke="#A9B7D0" strokeWidth="2.5" />
      </svg>

      {walking.map((b) => {
        const dur = (b.late ? WALK_MS * 0.65 : WALK_MS) / 1000;
        return (
          <motion.div
            key={b.key}
            className="absolute flex flex-col items-center"
            style={{ translateX: '-50%', translateY: '-100%' }}
            initial={{ left: '-4%', top: '82%', opacity: 1, scale: 1 }}
            animate={reduce ? { left: '76%', top: '52%', opacity: 0 } : {
              left: ['-4%', '63%', '75.5%', '76.5%'],
              top: ['82%', '82%', '54%', '54%'],
              opacity: [1, 1, 1, 0],
              scale: [1, 1, 0.92, 0.8],
            }}
            transition={{ duration: reduce ? 0.3 : dur, times: [0, 0.62, 0.9, 1], ease: 'linear' }}
          >
            <span className="mb-0.5 whitespace-nowrap rounded-full bg-slate-950/80 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
              {b.name}
            </span>
            <CrewWalker look={resolveLook(b.seed, b.name)} height={64} />
          </motion.div>
        );
      })}
    </div>
  );
}

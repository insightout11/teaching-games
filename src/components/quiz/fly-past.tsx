'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Send, Stamp } from 'lucide-react';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { Clouds, type SkyPilot } from '@/components/quiz/sky-race';

/**
 * The quiz podium as an air-show fly-past (Oct 2026; the owner found the landing order boring after pilot 001).
 * Third and second fly across trailing banners, each pilot in the cockpit window. Then the teacher brings in the
 * winner: a loop-the-loop, their name written in smoke, paper-plane confetti and the "Captain of the quiz" stamp.
 */

const PLANE_COLORS = ['#fcd34d', '#cbd5e1', '#f0a36b'];

/** A side-view plane facing right, with a round cockpit window the pilot's avatar sits in. */
function SidePlane({ color, pilot, size }: { color: string; pilot: SkyPilot; size: number }) {
  return (
    <div className="relative" style={{ width: size, height: size * 0.42 }}>
      <svg viewBox="0 0 200 84" className="absolute inset-0 h-full w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]" aria-hidden>
        <path d="M18 18 L40 18 L62 44 L18 44 Z" fill={color} />
        <path d="M14 46 C14 36 30 32 60 32 L150 32 C176 32 196 40 196 48 C196 56 178 62 150 62 L44 62 C26 62 14 56 14 46 Z" fill={color} />
        <path d="M150 32 C170 32 188 38 194 46 L160 46 C156 40 154 36 150 32 Z" fill="#1b2233" opacity="0.35" />
        <path d="M84 52 L128 52 L100 80 L80 80 Z" fill={color} style={{ filter: 'brightness(0.85)' }} />
        <line x1="40" y1="47" x2="140" y2="47" stroke="#1b2233" strokeOpacity="0.15" strokeWidth="2" />
        <circle cx="128" cy="44" r="15" fill="#f8fafc" stroke="#1b2233" strokeOpacity="0.25" strokeWidth="2" />
      </svg>
      <div className="absolute overflow-hidden rounded-full" style={{ left: size * (113 / 200), top: size * 0.42 * (29 / 84), width: size * 0.15, height: size * 0.15 }}>
        <CrewAvatar seed={pilot.seed ?? pilot.id} name={pilot.name} size={size * 0.15} />
      </div>
    </div>
  );
}

const place = (i: number) => ['1st', '2nd', '3rd'][i];

export function FlyPast({ pilots }: { pilots: SkyPilot[] }) {
  const reduce = useReducedMotion();
  const podium = pilots.slice(0, 3);
  // passes: third, then second (whoever exists), then a pause until the teacher brings in the winner
  const passes = podium.length === 3 ? [2, 1] : podium.length === 2 ? [1] : [];
  // step k < passes.length = that pass is flying; passes.length = waiting for the winner; +1 = winner's show
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduce) { setStep(passes.length); return; }
    const ts = passes.map((_, k) => setTimeout(() => setStep(k + 1), 4200 * (k + 1)));
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podium.length, reduce]);
  const done = new Set(passes.slice(0, step));
  const winner = podium[0];
  const show = step > passes.length;

  // the loop: in from the left, up and over backwards, down and through, then away off the right edge
  const loop = useMemo(() => {
    const cx = 50, cy = 38, rx = 16, ry = 24, left: string[] = ['-30%'], top: string[] = [`${cy + ry}%`], rotate: number[] = [0];
    for (let k = 0; k <= 16; k++) {
      const a = Math.PI / 2 - (k / 16) * Math.PI * 2; // from the bottom, counter-clockwise on screen
      left.push(`${cx + rx * Math.cos(a) - 12}%`);
      top.push(`${cy + ry * Math.sin(a)}%`);
      rotate.push(-(k / 16) * 360);
    }
    left.push('120%'); top.push('6%'); rotate.push(-372);
    return { left, top, rotate };
  }, []);

  if (!winner) return null;
  return (
    <div className="relative h-[400px] overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(180deg,#1d2a5a 0%,#5b4f9a 36%,#e98a7c 70%,#f6b26b 92%)' }}>
      <Clouds top="12%" height={90} seed={11} alpha={0.55} speed={70} />
      <Clouds top="62%" height={110} seed={4} alpha={0.75} speed={45} />
      <p className="absolute left-5 top-4 z-[6] font-display text-2xl text-white drop-shadow">The fly-past</p>

      {/* third and second: a pass across the sky trailing a banner */}
      {passes.map((pi, k) => step === k && (
        <motion.div
          key={pi}
          className="absolute z-[3] flex items-center"
          style={{ top: pi === 2 ? '44%' : '24%' }}
          initial={{ left: k % 2 === 0 ? '-60%' : '110%' }}
          animate={{ left: k % 2 === 0 ? '110%' : '-60%' }}
          transition={{ duration: 4, ease: 'linear' }}
        >
          <div className={`flex items-center ${k % 2 === 0 ? '' : 'flex-row-reverse'}`}>
            <div className="flex items-center">
              <span className="h-[2px] w-6 bg-white/70" />
              <span className="whitespace-nowrap rounded-sm border-2 border-white/80 bg-white px-3 py-1 font-display text-xl text-[#1b2233] shadow-lg">{place(pi)} · {podium[pi].name} · {podium[pi].points}</span>
              <span className="h-[2px] w-10 bg-white/70" />
            </div>
            <div style={{ transform: k % 2 === 0 ? undefined : 'scaleX(-1)' }}>
              <SidePlane color={PLANE_COLORS[pi]} pilot={podium[pi]} size={170} />
            </div>
          </div>
        </motion.div>
      ))}

      {/* waiting for the winner */}
      {step === passes.length && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-x-0 top-[34%] z-[5] flex flex-col items-center gap-3">
          <p className="font-display text-3xl text-white drop-shadow">And the Captain of the quiz is…</p>
          <button type="button" onClick={() => setStep(passes.length + 1)} className="rounded-full bg-amber-300 px-6 py-2.5 text-base font-bold text-[#1b2233] shadow-lg hover:bg-amber-200">
            Bring in the winner
          </button>
        </motion.div>
      )}

      {/* the winner's show */}
      {show && (
        <>
          <motion.div
            className="absolute z-[4]"
            initial={{ left: loop.left[0], top: loop.top[0], rotate: 0 }}
            animate={reduce ? { left: '120%', top: '6%' } : loop}
            transition={{ duration: 4.2, ease: 'easeInOut' }}
          >
            <SidePlane color={PLANE_COLORS[0]} pilot={winner} size={190} />
          </motion.div>
          {/* the name written in smoke */}
          <svg className="pointer-events-none absolute inset-x-0 top-[30%] z-[3] h-28 w-full" viewBox="0 0 800 110" aria-hidden>
            <motion.text
              x="400" y="80" textAnchor="middle" fontSize="84" fontFamily="var(--font-display, serif)"
              fill="rgba(255,255,255,0)" stroke="rgba(255,255,255,0.92)" strokeWidth="3" strokeDasharray="1600" strokeLinecap="round"
              initial={{ strokeDashoffset: 1600 }} animate={{ strokeDashoffset: 0, fill: 'rgba(255,255,255,0.85)' }}
              transition={{ strokeDashoffset: { delay: 4.2, duration: 2.6, ease: 'easeInOut' }, fill: { delay: 6.4, duration: 0.8 } }}
              style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' }}
            >
              {winner.name}
            </motion.text>
          </svg>
          {/* paper-plane confetti */}
          {!reduce && Array.from({ length: 22 }, (_, i) => (
            <motion.span
              key={i}
              className="absolute z-[5]"
              style={{ left: `${(i * 47) % 100}%`, top: -30, color: ['#fcd34d', '#ffffff', '#7dd3fc', '#f9a8d4'][i % 4] }}
              initial={{ y: 0, rotate: 0, opacity: 0 }}
              animate={{ y: 470, rotate: (i % 2 ? 1 : -1) * 220, opacity: [0, 1, 1, 0.9] }}
              transition={{ delay: 6.6 + (i % 7) * 0.18, duration: 3.4 + (i % 5) * 0.3, ease: 'easeIn' }}
            >
              <Send className="h-5 w-5" />
            </motion.span>
          ))}
          {/* the winner steps out */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 6.8, type: 'spring', stiffness: 200, damping: 16 }} className="absolute inset-x-0 bottom-4 z-[6] flex flex-col items-center">
            <CrewAvatar seed={winner.seed ?? winner.id} name={winner.name} captain size={92} />
            <span className="mt-1 rounded-full bg-amber-300 px-4 py-1 font-display text-2xl text-[#1b2233] shadow-lg">{winner.name} · {winner.points}</span>
          </motion.div>
          <motion.div initial={{ scale: 2.6, opacity: 0, rotate: -28 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} transition={{ delay: 7.2, type: 'spring', stiffness: 240, damping: 13 }} className="absolute right-6 top-14 z-[6] flex items-center gap-1.5 rounded-lg border-[3px] border-amber-300 bg-[#1b2233]/40 px-3 py-1 font-mono text-base font-black uppercase text-amber-200">
            <Stamp className="h-5 w-5" /> Captain of the quiz
          </motion.div>
        </>
      )}

      {/* second and third, parked at the bottom once they have flown past */}
      <div className="absolute bottom-4 left-4 z-[6] flex flex-col gap-2">
        {[1, 2].filter((pi) => done.has(pi) || (show && podium[pi])).map((pi) => podium[pi] && (
          <motion.div key={pi} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 rounded-full bg-black/45 py-1 pl-1 pr-3 text-white backdrop-blur-sm">
            <CrewAvatar seed={podium[pi].seed ?? podium[pi].id} name={podium[pi].name} size={36} />
            <span className="font-display text-lg">{place(pi)} · {podium[pi].name}</span>
            <span className="font-mono text-sm text-white/70">{podium[pi].points}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

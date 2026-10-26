'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plane, Stamp, Sun } from 'lucide-react';
import { CrewAvatar } from '@/components/ui/crew-avatar';

/**
 * Quiz scoreboards, flight style (Oct 2026), shared by World Quiz and Flash Quiz.
 * SkyRace: each pilot is a plane climbing with their score; the leader breaks through the cloud deck into the sun.
 * LandingOrder: the finale. Third lands first, then second (names hidden until touchdown); the winner circles in the
 * clouds until the teacher brings them in, then lands under a water-cannon arch with their avatar.
 * Junior classes: one class plane, never a ranking.
 */

export interface SkyPilot { id: string; name: string; points: number; color?: string; seed?: string; out?: boolean }

const COLORS = ['#7dd3fc', '#fca5a5', '#c4b5fd', '#86efac', '#fcd34d', '#f9a8d4', '#fdba74', '#a5f3fc'];
const colorOf = (p: SkyPilot, i: number) => p.color ?? COLORS[i % COLORS.length];

/** Soft drifting clouds made of noise (the same recipe as the room's cloud deck), seen from the side. */
function cloudLayer(seed: number, alpha: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="160"><filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.03" numOctaves="4" seed="${seed}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 ${2.4 * alpha} -0.7"/></filter><rect width="100%" height="100%" filter="url(#f)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function Clouds({ top, height, seed, alpha = 1, speed = 90, className = '' }: { top: string; height: number; seed: number; alpha?: number; speed?: number; className?: string }) {
  const img = useMemo(() => cloudLayer(seed, alpha), [seed, alpha]);
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 ${className}`}
      style={{ top, height, backgroundImage: img, backgroundRepeat: 'repeat-x', backgroundSize: '900px 100%', maskImage: 'linear-gradient(transparent, black 30%, black 70%, transparent)', WebkitMaskImage: 'linear-gradient(transparent, black 30%, black 70%, transparent)' }}
      animate={{ backgroundPositionX: ['0px', '900px'] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
    />
  );
}

const SKY = 'linear-gradient(180deg,#0b1a3a 0%,#1d4f8a 30%,#4f93cc 55%,#94c7ea 78%,#d6ecf9 100%)';
const DECK = 0.5; // the cloud deck, as a share of the height from the top (broken through about halfway to the best score)
const RISE = 68;  // how far up the sky (%) a perfect score climbs: room above for the names and the label

export function SkyRace({ pilots, junior = false, height = 380, ceiling }: { pilots: SkyPilot[]; junior?: boolean; height?: number; /** The best score possible in the whole quiz: everyone climbs toward it question by question (measured against the leader, the leader sat at the top after one question). */ ceiling?: number }) {
  const list = junior
    ? [{ id: 'class', name: 'Our class', points: pilots.reduce((n, p) => n + p.points, 0), color: '#fcd34d' }]
    : pilots.slice(0, 8);
  const top = Math.max(1, ...list.map((p) => p.points));
  // Junior: the class plane climbs toward the top over the quiz (no ranking, no comparison)
  const scale = ceiling && ceiling > 0 ? (junior ? ceiling * Math.max(1, pilots.length) : ceiling) : Math.max(junior ? 60 : 1, top * 1.25);
  const share = (p: SkyPilot) => Math.max(0, Math.min(1, p.points / scale));
  const leader = !junior && list[0] && list[0].points > 0 ? list[0].id : null;
  if (!list.length) return <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/50">No pilots yet: planes appear here as students answer.</p>;
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ height, background: SKY }}>
      <Sun className="absolute right-6 top-4 h-10 w-10 text-amber-200 drop-shadow-[0_0_18px_rgba(253,230,138,0.8)]" />
      <div className="absolute inset-y-3 left-2 flex flex-col justify-between font-mono text-[10px] text-white/55">
        {['40,000 ft', '30,000 ft', '20,000 ft', '10,000 ft', ''].map((t, i) => <span key={i}>{t}</span>)}
      </div>
      <Clouds top="74%" height={70} seed={11} alpha={0.55} speed={140} />
      <Clouds top={`${DECK * 100 - 7}%`} height={78} seed={4} speed={110} className="z-[2]" />
      {list.map((p, i) => {
        const h = share(p);
        const x = list.length === 1 ? 50 : 12 + (i * 80) / Math.max(1, list.length - 1);
        const above = 4 + h * RISE > (1 - DECK) * 100 + 4;
        return (
          <motion.div
            key={p.id}
            className={`absolute flex -translate-x-1/2 flex-col items-center ${above ? 'z-[3]' : 'z-[1]'}`}
            style={{ left: `${x}%` }}
            initial={{ bottom: '3%' }}
            animate={{ bottom: `${4 + h * RISE}%` }}
            transition={{ type: 'spring', stiffness: 38, damping: 12, delay: i * 0.06 }}
          >
            {p.id === leader && above && <span className="mb-1 whitespace-nowrap rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-[#1b2233]">Above the clouds</span>}
            <Plane className="h-7 w-7 -rotate-45 drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]" style={{ color: colorOf(p, i), fill: colorOf(p, i), opacity: p.out ? 0.4 : 1 }} />
            <span className="mt-0.5 max-w-[7rem] truncate rounded-full bg-black/45 px-2 text-xs font-semibold text-white">{p.name}</span>
            {!junior && <span className="font-mono text-[10px] text-white/85">{p.points}</span>}
            <span className="absolute top-7 -z-10 h-20 w-[3px] rounded-full" style={{ background: `linear-gradient(${colorOf(p, i)}aa, transparent)` }} />
          </motion.div>
        );
      })}
      <div className="absolute inset-x-0 bottom-0 h-[3%] bg-[#334155]" />
    </div>
  );
}

/** The finale. `onDone` is not needed: the teacher taps to bring the winner in. */
export function LandingOrder({ pilots, junior = false, title }: { pilots: SkyPilot[]; junior?: boolean; title?: string }) {
  const podium = junior ? [{ id: 'class', name: 'Our class', points: pilots.reduce((n, p) => n + p.points, 0), color: '#fcd34d' }] : pilots.slice(0, 3);
  // step: 0 = third approaching, 1 = third down, 2 = second down, 3 = winner circling, 4 = winner landed
  const [step, setStep] = useState(0);
  const order = podium.length === 3 ? [2, 1] : podium.length === 2 ? [1] : [];
  useEffect(() => {
    if (junior || podium.length <= 1) { setStep(3); return; }
    const ts: ReturnType<typeof setTimeout>[] = [];
    order.forEach((_, k) => ts.push(setTimeout(() => setStep(k + 1 + (order.length === 1 ? 1 : 0)), 2600 + k * 3200)));
    ts.push(setTimeout(() => setStep(3), 2600 + order.length * 3200));
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [junior, podium.length]);
  const landedPlaces = podium.length === 3 ? (step >= 2 ? [2, 1] : step >= 1 ? [2] : []) : podium.length === 2 && step >= 2 ? [1] : [];
  const winner = podium[0];
  const slotX = (place: number) => [50, 22, 78][place];
  if (!winner) return null;
  return (
    <div className="relative h-[360px] overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(180deg,#24305e 0%,#7c6aa6 38%,#f59e8b 70%,#f6b26b 88%)' }}>
      <Clouds top="8%" height={90} seed={7} alpha={0.75} speed={80} />
      <p className="absolute left-5 top-4 z-[4] font-display text-2xl text-white drop-shadow">{title ?? (junior ? 'Coming in to land' : 'Landing order')}</p>
      {/* runway with lights that run toward the touchdown point while the winner circles */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[#2a2f3a]">
        <div className="absolute inset-x-0 top-1/2 flex justify-around">{Array.from({ length: 12 }).map((_, i) => <span key={i} className="h-1 w-8 bg-white/60" />)}</div>
        <div className="absolute inset-x-4 top-2 flex justify-between">
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-amber-200" animate={step === 3 ? { opacity: [0.15, 1, 0.15] } : { opacity: 0.35 }} transition={step === 3 ? { duration: 1.1, repeat: Infinity, delay: i * 0.07 } : {}} />
          ))}
        </div>
      </div>
      {/* the planes that have landed, or the one on approach */}
      {podium.slice(1).map((p, k) => {
        const place = k + 1;
        const landed = landedPlaces.includes(place);
        const approaching = !landed && ((place === 2 && step === 0) || (place === 1 && step === (podium.length === 3 ? 1 : 0)));
        if (!landed && !approaching) return null;
        return (
          <motion.div key={p.id} className="absolute z-[3] flex -translate-x-1/2 flex-col items-center" initial={{ left: '-10%', bottom: 240 }} animate={{ left: `${slotX(place)}%`, bottom: 66 }} transition={{ duration: 2.4, ease: [0.3, 0.7, 0.4, 1] }}>
            {/* once down, the pilot steps out: avatar, place and points (pilot 001 asked for a better scoreboard) */}
            {landed && <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><CrewAvatar seed={p.seed ?? p.id} name={p.name} size={48} /></motion.span>}
            <span className="mb-1 whitespace-nowrap rounded-full bg-black/55 px-2 text-sm font-bold text-white">{landed ? `${place + 1}. ${p.name} · ${p.points}` : `Plane ${place + 1}…`}</span>
            <Plane className="h-11 w-11 rotate-[6deg]" style={{ color: colorOf(p, place), fill: colorOf(p, place) }} />
            {landed && <motion.span initial={{ opacity: 0.8, scale: 0.4 }} animate={{ opacity: 0, scale: 2.2 }} transition={{ duration: 1.2 }} className="absolute -bottom-1 h-5 w-14 rounded-full bg-white/70 blur-md" />}
          </motion.div>
        );
      })}
      {/* the winner: circles high in the clouds until the teacher brings them in */}
      <AnimatePresence>
        {step === 3 && (
          <motion.div key="circling" className="absolute z-[2] flex flex-col items-center" style={{ left: '50%', top: 70 }} initial={{ opacity: 0 }} animate={{ opacity: 1, x: [-160, 0, 160, 0, -160], y: [0, -24, 0, 24, 0] }} exit={{ opacity: 0 }} transition={{ x: { duration: 7, repeat: Infinity, ease: 'linear' }, y: { duration: 7, repeat: Infinity, ease: 'linear' }, opacity: { duration: 0.6 } }}>
            <span className="mb-1 rounded-full bg-black/55 px-2 text-sm font-bold text-white">{junior ? 'Our class' : 'Plane 1…'}</span>
            <Plane className="h-10 w-10" style={{ color: colorOf(winner, 0), fill: colorOf(winner, 0) }} />
          </motion.div>
        )}
      </AnimatePresence>
      {step === 3 && (
        <button type="button" onClick={() => setStep(4)} className="absolute bottom-28 left-1/2 z-[5] -translate-x-1/2 rounded-full bg-amber-300 px-5 py-2 text-sm font-bold text-[#1b2233] shadow-lg hover:bg-amber-200">
          {junior ? 'Bring us in to land' : 'Bring in the winner'}
        </button>
      )}
      {step === 4 && (
        <>
          {/* water-cannon arch: two fire trucks spraying over the runway */}
          <svg className="pointer-events-none absolute inset-x-0 bottom-16 z-[2] h-48 w-full" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden>
            {[0, 1].map((s) => (
              <motion.path key={s} d={s === 0 ? 'M120 118 Q200 -10 280 118' : 'M280 118 Q200 -10 120 118'} fill="none" stroke="rgba(186,230,253,0.75)" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, delay: 0.8 + s * 0.15 }} />
            ))}
          </svg>
          <motion.div className="absolute z-[3] flex -translate-x-1/2 flex-col items-center" initial={{ left: '-10%', bottom: 260 }} animate={{ left: `${slotX(0)}%`, bottom: 66 }} transition={{ duration: 2.2, ease: [0.3, 0.7, 0.4, 1] }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2 }} className="mb-1 flex flex-col items-center">
              {!junior && <CrewAvatar seed={winner.seed ?? winner.id} name={winner.name} captain size={72} />}
              <span className="mt-1 whitespace-nowrap rounded-full bg-amber-300 px-3 py-0.5 font-display text-xl text-[#1b2233]">{junior ? 'We made it!' : `${winner.name} · ${winner.points}`}</span>
            </motion.div>
            <Plane className="h-14 w-14 rotate-[6deg]" style={{ color: colorOf(winner, 0), fill: colorOf(winner, 0) }} />
          </motion.div>
          {!junior && (
            <motion.div initial={{ scale: 2.6, opacity: 0, rotate: -28 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} transition={{ delay: 2.7, type: 'spring', stiffness: 240, damping: 13 }} className="absolute left-5 top-14 z-[4] flex items-center gap-1.5 rounded-lg border-[3px] border-amber-300 px-3 py-1 font-mono text-base font-black uppercase text-amber-200">
              <Stamp className="h-5 w-5" /> Captain of the quiz
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

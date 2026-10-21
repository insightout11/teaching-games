'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Sun, Stamp } from 'lucide-react';
import { SkyRace as RealSkyRace, LandingOrder as RealLanding } from '@/components/quiz/sky-race';

/**
 * Quiz look mockup (Oct 2026), for the owner: a flight-themed quiz that feels like ours. Not wired to anything.
 * 1. Sky race: planes climb through real cloud layers with their score; the leader breaks into the sunlight.
 * 2. Departure board question: a split-flap header, gate cards for the choices, a fuel-gauge timer.
 * 3. Reveal: the right gate gets a CLEARED passport stamp; the fact arrives as a boarding-pass stub.
 * 4. Landing order: the podium as planes touching down on a runway.
 */

const PILOTS = [
  { name: 'Mai', color: '#7dd3fc', points: 820 },
  { name: 'Ken', color: '#fca5a5', points: 760 },
  { name: 'Lina', color: '#c4b5fd', points: 610 },
  { name: 'Omar', color: '#86efac', points: 540 },
  { name: 'Sofia', color: '#fcd34d', points: 400 },
  { name: 'Ben', color: '#f9a8d4', points: 250 },
];
const OPTIONS = ['Thailand', 'Vietnam', 'Laos', 'Cambodia'];
const GATE_TONES = ['#22d3ee', '#a78bfa', '#fbbf24', '#fb7185'];

function SplitFlap({ text }: { text: string }) {
  return (
    <div className="flex gap-[3px]">
      {text.split('').map((ch, i) => (
        <motion.span key={i} initial={{ rotateX: 90 }} animate={{ rotateX: 0 }} transition={{ delay: i * 0.04, duration: 0.25 }}
          className="flex h-9 w-6 items-center justify-center rounded-[3px] bg-[#111827] font-mono text-lg font-bold text-amber-300 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08),inset_0_1px_0_rgba(0,0,0,0.6)]">
          {ch === ' ' ? '' : ch}
        </motion.span>
      ))}
    </div>
  );
}

export function OldSkyRace() {
  const top = 1000;
  return (
    <div className="relative h-[460px] overflow-hidden rounded-3xl" style={{ background: 'linear-gradient(180deg,#0b1a3a 0%,#1d4f8a 38%,#5fa3d6 62%,#a9d3ef 78%,#dbeefa 100%)' }}>
      {/* altitude scale */}
      <div className="absolute inset-y-4 left-3 flex flex-col justify-between font-mono text-[10px] text-white/60">
        {['40,000 ft', '30,000 ft', '20,000 ft', '10,000 ft', 'Runway'].map((t) => <span key={t}>{t}</span>)}
      </div>
      {/* the cloud deck the leaders break through, and the sun above it */}
      <div className="absolute inset-x-0" style={{ top: '34%', height: 46, background: 'radial-gradient(ellipse 18% 60% at 15% 50%,rgba(255,255,255,.9),transparent 70%),radial-gradient(ellipse 22% 70% at 45% 40%,rgba(255,255,255,.85),transparent 70%),radial-gradient(ellipse 20% 60% at 78% 55%,rgba(255,255,255,.9),transparent 70%)' }} />
      <Sun className="absolute right-8 top-6 h-12 w-12 text-amber-200" />
      {/* the planes */}
      {PILOTS.map((p, i) => {
        const h = (p.points / top) * 82;
        return (
          <motion.div key={p.name} className="absolute flex flex-col items-center" style={{ left: `${14 + i * 14}%` }} initial={{ bottom: '4%' }} animate={{ bottom: `${4 + h}%` }} transition={{ type: 'spring', stiffness: 40, damping: 12, delay: i * 0.08 }}>
            {i === 0 && <span className="mb-1 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-[#1b2233]">ABOVE THE CLOUDS</span>}
            <Plane className="h-8 w-8 -rotate-45 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]" style={{ color: p.color, fill: p.color }} />
            <span className="mt-1 rounded-full bg-black/40 px-2 text-xs font-semibold text-white">{p.name}</span>
            <span className="font-mono text-[10px] text-white/80">{Math.round((p.points / top) * 40000).toLocaleString()} ft</span>
            {/* contrail */}
            <span className="absolute top-8 h-24 w-[3px] rounded-full" style={{ background: `linear-gradient(${p.color}88, transparent)` }} />
          </motion.div>
        );
      })}
      <div className="absolute inset-x-0 bottom-0 h-[4%] bg-[#334155]" />
    </div>
  );
}

function DepartureQuestion({ reveal }: { reveal: boolean }) {
  const [t, setT] = useState(20);
  useEffect(() => { if (reveal) return; const id = setInterval(() => setT((x) => (x > 0 ? x - 1 : 20)), 1000); return () => clearInterval(id); }, [reveal]);
  return (
    <div className="space-y-5 rounded-3xl bg-[#0b1220] p-6">
      <div className="flex items-center justify-between">
        <SplitFlap text="Q3  FLAGS" />
        {/* fuel gauge timer */}
        <div className="relative h-16 w-16">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke="#1f2937" strokeWidth="4" /><circle cx="18" cy="18" r="15" fill="none" stroke={t < 6 ? '#fb7185' : '#fbbf24'} strokeWidth="4" strokeDasharray={`${(t / 20) * 94} 94`} strokeLinecap="round" /></svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-bold text-white">{reveal ? '·' : t}</span>
          <span className="absolute -bottom-4 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-white/50">fuel</span>
        </div>
      </div>
      <p className="text-center font-display text-3xl text-white">We flew over this country today. Which one is it?</p>
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/flags/la.svg" alt="" className="h-28 rounded shadow-[0_10px_30px_rgba(0,0,0,0.5)]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o, i) => {
          const right = reveal && i === 2;
          return (
            <div key={o} className={`relative overflow-hidden rounded-2xl border-2 bg-[#0f172a] px-4 py-3 ${reveal && !right ? 'opacity-35' : ''}`} style={{ borderColor: GATE_TONES[i] }}>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: GATE_TONES[i] }}>Gate {'ABCD'[i]}</p>
              <p className="font-display text-2xl text-white">{o}</p>
              <div className="mt-1 flex gap-1">{Array.from({ length: [1, 0, 4, 1][i] }).map((_, k) => <span key={k} className="h-1.5 w-1.5 rounded-full" style={{ background: GATE_TONES[i] }} />)}</div>
              {right && (
                <motion.div initial={{ scale: 2.4, opacity: 0, rotate: -25 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="absolute right-3 top-2 flex items-center gap-1 rounded-md border-[3px] border-emerald-400 px-2 py-0.5 font-mono text-lg font-black text-emerald-400">
                  <Stamp className="h-4 w-4" /> CLEARED
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
      {reveal && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mx-auto flex max-w-xl overflow-hidden rounded-xl bg-[#f6f1e4] text-[#1b2233]">
          <div className="flex-1 p-3"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#1b2233]/50">Boarding pass · fact</p><p className="text-lg">Laos is the only landlocked country in Southeast Asia.</p></div>
          <div className="w-24 border-l-2 border-dashed border-[#1b2233]/25 p-3 text-center"><p className="font-mono text-[10px] text-[#1b2233]/50">RIGHT</p><p className="font-display text-3xl">6/8</p></div>
        </motion.div>
      )}
    </div>
  );
}

export function OldLandingOrder() {
  const podium = PILOTS.slice(0, 3);
  return (
    <div className="relative h-[320px] overflow-hidden rounded-3xl" style={{ background: 'linear-gradient(180deg,#f6b26b 0%,#f59e8b 40%,#7c6aa6 75%,#2b2d4f 100%)' }}>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[#2a2f3a]">
        <div className="absolute inset-x-0 top-1/2 flex justify-around">{Array.from({ length: 12 }).map((_, i) => <span key={i} className="h-1 w-8 bg-white/70" />)}</div>
      </div>
      {podium.map((p, i) => (
        <motion.div key={p.name} className="absolute flex flex-col items-center" style={{ bottom: 70 }} initial={{ left: '-15%', bottom: 220 - i * 30 }} animate={{ left: `${62 - i * 24}%`, bottom: 70 }} transition={{ duration: 2.2, delay: (2 - i) * 0.9, ease: 'easeOut' }}>
          <span className="mb-1 rounded-full bg-black/50 px-2 text-sm font-bold text-white">{i + 1}. {p.name}</span>
          <Plane className="h-12 w-12 rotate-[8deg]" style={{ color: p.color, fill: p.color }} />
        </motion.div>
      ))}
      <p className="absolute left-5 top-4 font-display text-3xl text-white drop-shadow">Landing order</p>
    </div>
  );
}

export function QuizLookMockup() {
  const [view, setView] = useState<'race' | 'question' | 'reveal' | 'landing' | 'junior'>('race');
  const [nonce, setNonce] = useState(0);
  const tabs: Array<[typeof view, string]> = [['race', 'Sky race (scores)'], ['question', 'Question: departure board'], ['reveal', 'Reveal: cleared stamp'], ['landing', 'Landing order (podium)'], ['junior', 'Junior landing']];
  return (
    <div className="min-h-screen bg-[#05070d] p-6 text-white">
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="mr-2 font-mono text-xs uppercase tracking-[0.16em] text-white/50">Quiz look mockup</span>
        {tabs.map(([k, l]) => <button key={k} type="button" onClick={() => { setView(k); setNonce((n) => n + 1); }} className={`rounded-full border px-3 py-1 text-xs ${view === k ? 'border-amber-300/70 bg-amber-300/15 text-amber-100' : 'border-white/15 text-white/70'}`}>{l}</button>)}
      </div>
      <div key={nonce} className="mx-auto max-w-4xl">
        {view === 'race' && <RealSkyRace pilots={PILOTS.map((p) => ({ ...p, id: p.name }))} height={460} />}
        {view === 'question' && <DepartureQuestion reveal={false} />}
        {view === 'reveal' && <DepartureQuestion reveal />}
        {view === 'junior' && <RealLanding junior pilots={PILOTS.map((p) => ({ ...p, id: p.name }))} />}
        {view === 'landing' && <RealLanding pilots={PILOTS.map((p) => ({ ...p, id: p.name }))} />}
      </div>
    </div>
  );
}

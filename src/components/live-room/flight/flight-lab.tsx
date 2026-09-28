'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SkyBackground, type WeatherState } from '@/components/ui/sky-background';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import { arrivalTimeline, DEPARTURE_DURATION_MS } from '@/components/world-flight/arrival-scene/cinematic-motion';
import type { TimeOfDay, WeatherCondition } from '@/components/world-flight/arrival-scene/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { CockpitClouds } from '@/components/live-room/flight/cockpit-clouds';

/**
 * Dev-only flight lab: the Live Room windscreen as one flight with two cameras.
 *  - side camera: the existing World Flight departure / arrival cinematics
 *  - cockpit camera: pilot's-eye sky (house SkyBackground) + approaching clouds
 * Used to iterate on the look before it is wired into the flight deck.
 */

type Phase = 'gate' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'landing' | 'landed';
const ARRIVAL_MS = 5200;
const CLIMB_MS = 4200;

const PHASE_LABEL: Record<Phase, string> = {
  gate: 'At the gate · boarding',
  takeoff: 'Taking off',
  climb: 'Climbing',
  cruise: 'Cruising',
  descent: 'Descending',
  landing: 'Landing',
  landed: 'Landed',
};

export function FlightLab() {
  const cities = useMemo(() => WORLD_DESTINATIONS.filter((d) => d.scene), []);
  const [originId, setOriginId] = useState('lisbon');
  const [destId, setDestId] = useState('tokyo');
  const [phase, setPhase] = useState<Phase>('gate');
  const [progress, setProgress] = useState(0);
  const [tod, setTod] = useState<TimeOfDay>('day');
  const [weather, setWeather] = useState<WeatherCondition>('clear');
  const [activity, setActivity] = useState(false);
  const origin = cities.find((c) => c.id === originId) ?? cities[0];
  const dest = cities.find((c) => c.id === destId) ?? cities[1];

  // Drive the timed phases (side-camera cinematics and the climb).
  const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const dur = phase === 'takeoff' ? DEPARTURE_DURATION_MS : phase === 'landing' ? ARRIVAL_MS : phase === 'climb' ? CLIMB_MS : 0;
    if (!dur) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setProgress(t);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setPhase(phase === 'takeoff' ? 'climb' : phase === 'climb' ? 'cruise' : 'landed');
    };
    setProgress(0);
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [phase]);

  const sideCamera = phase === 'gate' || phase === 'takeoff' || phase === 'landing' || phase === 'landed';
  const sideScene = phase === 'landing' || phase === 'landed' ? dest : origin;
  const sideFrame =
    phase === 'gate' ? { mode: 'departure' as const, phase: 'approach' as const, progress: 0 }
      : phase === 'takeoff' ? { mode: 'departure' as const, phase: 'approach' as const, progress }
        : phase === 'landing' ? { mode: 'arrival' as const, ...arrivalTimeline(progress) }
          : { mode: 'arrival' as const, phase: 'landed' as const, progress: 1 };

  // The cockpit sky follows the chosen time of day (the side scenes already do).
  const cockpitWeather: WeatherState = tod === 'dusk' ? 'golden' : tod === 'night' ? 'idle' : tod === 'dawn' ? 'climbing' : 'day';
  const cockpitAlt = phase === 'climb' ? 0.85 : phase === 'descent' ? 0.35 : 0.85;
  const cockpitAltInitial = phase === 'climb' ? 0.05 : undefined;
  const cloudSpeed = phase === 'climb' ? 1.4 : phase === 'descent' ? 0.7 : 0.55;

  const run = (p: Phase) => setPhase(p);

  return (
    <div className="min-h-screen bg-[#05070D] p-4 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <h1 className="font-display text-2xl">Flight lab</h1>

        <div className="relative aspect-[16/8.2] w-full overflow-hidden rounded-[28px_28px_16px_16px] bg-[#0b1a33] shadow-[inset_0_0_0_6px_#121a2a]">
          <AnimatePresence mode="sync">
            {sideCamera ? (
              <motion.div key={`side-${sideScene.id}-${sideFrame.mode}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                <DestinationArrivalScene
                  destinationId={sideScene.id}
                  scene={sideScene.scene!}
                  mode={sideFrame.mode}
                  phase={sideFrame.phase}
                  progress={sideFrame.progress}
                  timeOfDay={tod}
                  weather={weather}
                  fit="slice"
                  className="absolute inset-0"
                />
              </motion.div>
            ) : (
              <motion.div key="cockpit" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                <SkyBackground
                  className="!absolute"
                  weatherState={cockpitWeather}
                  earthState={phase === 'descent' ? 'landing' : 'flight'}
                  altitude={cockpitAlt}
                  altitudeInitial={cockpitAltInitial}
                  showEarth={phase === 'descent'}
                  showSkyline={phase === 'descent'}
                  intensity="moderate"
                  parallaxScale={2}
                  parallaxDuration={phase === 'climb' ? CLIMB_MS / 1000 : 3}
                />
                <CockpitClouds speed={cloudSpeed} tint={[236, 244, 255]} density={activity ? 0.4 : 1} horizon={phase === 'descent' ? 0.62 : 0.58} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pointer-events-none absolute left-4 top-3 flex gap-2">
            <span className="rounded-full border border-amber-300/45 bg-slate-950/55 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-amber-300">{PHASE_LABEL[phase]}</span>
            <span className="rounded-full border border-white/20 bg-slate-950/55 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em]">{origin.city} → {dest.city}</span>
            <span className="rounded-full border border-white/20 bg-slate-950/55 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em]">{sideCamera ? 'Camera: outside' : 'Camera: cockpit'}</span>
          </div>

          {phase === 'gate' && (
            <div className="absolute inset-x-0 bottom-8 flex justify-center">
              <button type="button" onClick={() => run('takeoff')} className="rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-7 py-3.5 font-display text-lg text-[#1a1204] shadow-[0_10px_30px_rgba(255,160,60,.35)]">
                Take off
              </button>
            </div>
          )}
          {activity && !sideCamera && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[70%] rounded-3xl border border-white/15 bg-slate-950/60 px-8 py-6 text-center backdrop-blur-md">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-300">Flash Quiz · question 2 of 5</p>
                <p className="mt-2 font-display text-3xl">Which country has won the most World Cups?</p>
              </div>
            </div>
          )}
          {phase === 'landed' && (
            <div className="absolute inset-x-0 top-14 flex justify-center">
              <div className="-rotate-2 rounded-2xl bg-[#f4efe3] px-6 py-4 text-[#1b2233] shadow-2xl">
                <p className="font-display text-2xl">Welcome to {dest.city}</p>
                <p className="mt-1 text-sm">Passport stamped · {dest.country}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {(['gate', 'takeoff', 'cruise', 'descent', 'landing'] as Phase[]).map((p) => (
            <button key={p} type="button" onClick={() => run(p)} className={['rounded-lg border px-3 py-1.5', phase === p ? 'border-emerald-300 text-emerald-200' : 'border-white/15 text-white/75'].join(' ')}>
              {PHASE_LABEL[p].split(' ·')[0]}
            </button>
          ))}
          <label className="ml-2 flex items-center gap-1.5">From
            <select value={originId} onChange={(e) => setOriginId(e.target.value)} className="rounded-md border border-white/15 bg-slate-900 px-2 py-1">
              {cities.map((c) => <option key={c.id} value={c.id}>{c.city}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5">To
            <select value={destId} onChange={(e) => setDestId(e.target.value)} className="rounded-md border border-white/15 bg-slate-900 px-2 py-1">
              {cities.map((c) => <option key={c.id} value={c.id}>{c.city}</option>)}
            </select>
          </label>
          <select value={tod} onChange={(e) => setTod(e.target.value as TimeOfDay)} className="rounded-md border border-white/15 bg-slate-900 px-2 py-1" aria-label="Time of day">
            {(['dawn', 'day', 'dusk', 'night'] as TimeOfDay[]).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={weather} onChange={(e) => setWeather(e.target.value as WeatherCondition)} className="rounded-md border border-white/15 bg-slate-900 px-2 py-1" aria-label="Weather">
            {(['clear', 'overcast', 'rain', 'storm', 'snow', 'aurora'] as WeatherCondition[]).map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
          <button type="button" onClick={() => setActivity((a) => !a)} className={['rounded-lg border px-3 py-1.5', activity ? 'border-emerald-300 text-emerald-200' : 'border-white/15 text-white/75'].join(' ')}>
            Activity on screen
          </button>
        </div>
      </div>
    </div>
  );
}

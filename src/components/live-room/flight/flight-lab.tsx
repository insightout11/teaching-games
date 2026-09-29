'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import { arrivalTimeline, DEPARTURE_DURATION_MS } from '@/components/world-flight/arrival-scene/cinematic-motion';
import type { TimeOfDay, WeatherCondition } from '@/components/world-flight/arrival-scene/types';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { CockpitClouds } from '@/components/live-room/flight/cockpit-clouds';
import { CockpitSky, cockpitCloudTint } from '@/components/live-room/flight/cockpit-sky';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';

/**
 * Dev-only flight lab: the Live Room windscreen as one flight with two cameras.
 *  - side camera: the existing World Flight departure / arrival cinematics
 *  - cockpit camera: pilot's-eye sky (house SkyBackground) + approaching clouds
 * Used to iterate on the look before it is wired into the flight deck.
 */

type Phase = 'gate' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'landing' | 'landed';
const ARRIVAL_MS = 5200;
const CLIMB_MS = 4200;
/** The descent shows the first part of the arrival timeline (the approach), slowed down. */
const DESCENT_MS = 9000;
/** First part of the descent: the cockpit dives into the cloud layer until it whites out. */
const DIVE = 0.35;
/** Then the clouds part over the arrival scene. */
const CLEAR = 0.22;
const APPROACH_SPLIT = 0.45;

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
  /** Freeze a timed phase at a chosen moment, for tuning. */
  const [scrub, setScrub] = useState<number | null>(null);
  const origin = cities.find((c) => c.id === originId) ?? cities[0];
  const dest = cities.find((c) => c.id === destId) ?? cities[1];

  // Drive the timed phases (side-camera cinematics and the climb).
  const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const dur = phase === 'takeoff' ? DEPARTURE_DURATION_MS
      : phase === 'descent' ? DESCENT_MS
        : phase === 'landing' ? ARRIVAL_MS * (1 - APPROACH_SPLIT)
          : phase === 'climb' ? CLIMB_MS : 0;
    if (!dur) return;
    if (scrub !== null) {
      setProgress(scrub);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setProgress(t);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setPhase(phase === 'takeoff' ? 'climb' : phase === 'climb' ? 'cruise' : phase === 'descent' ? 'landing' : 'landed');
    };
    setProgress(0);
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [phase, scrub]);

  // Outside camera for everything on or near the ground; cockpit only for the
  // climb and cruise. Descent + landing are one continuous arrival shot.
  const diving = phase === 'descent' && progress < DIVE;
  const sideCamera = phase !== 'climb' && phase !== 'cruise' && !diving;
  const approachT = phase === 'descent' ? Math.max(0, (progress - DIVE) / (1 - DIVE)) : 0;
  const arriving = phase === 'descent' || phase === 'landing' || phase === 'landed';
  const sideScene = arriving ? dest : origin;
  const sideFrame =
    phase === 'gate' ? { mode: 'departure' as const, phase: 'approach' as const, progress: 0 }
      : phase === 'takeoff' ? { mode: 'departure' as const, phase: 'approach' as const, progress }
        : phase === 'descent' ? { mode: 'arrival' as const, ...arrivalTimeline(approachT * APPROACH_SPLIT) }
          : phase === 'landing' ? { mode: 'arrival' as const, ...arrivalTimeline(APPROACH_SPLIT + progress * (1 - APPROACH_SPLIT)) }
            : { mode: 'arrival' as const, phase: 'landed' as const, progress: 1 };

  // The cockpit is graded from the destination's own palette for this time of
  // day: the same colours the arrival cinematic uses, so the cut is seamless.
  const palette = useMemo(() => composeTimedPalette(tod, dest.scene!), [tod, dest]);
  const cloudTint = useMemo(() => cockpitCloudTint(palette, tod), [palette, tod]);
  const cockpitAlt = phase === 'climb' ? Math.min(1, progress * 1.1) : 1;
  // Whiteout: builds while diving into the layer, then clears to reveal the city.
  const whiteout = phase !== 'descent' ? 0
    : diving ? Math.pow(progress / DIVE, 1.6) * 0.96
      : Math.max(0, 1 - (progress - DIVE) / CLEAR) * 0.96;
  const parting = phase === 'descent' && !diving ? Math.min(1, (progress - DIVE) / CLEAR) : 0;
  const cloudSpeed = phase === 'climb' ? 1.4 : diving ? 1.2 + progress * 3 : 0.55;

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
                <CockpitSky palette={palette} timeOfDay={tod} altitude={cockpitAlt} />
                {/* Cloud deck far below the horizon */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0"
                  style={{ top: '60%', background: `linear-gradient(180deg, rgba(${cloudTint.join(',')},0) 0%, rgba(${cloudTint.join(',')},0.55) 35%, rgba(${cloudTint.join(',')},0.8) 100%)` }}
                />
                <CockpitClouds speed={cloudSpeed} tint={cloudTint} density={activity && !diving ? 0.4 : 1} horizon={diving ? 0.58 - progress * 0.4 : 0.58} dive={diving} />
              </motion.div>
            )}
          </AnimatePresence>

          {whiteout > 0.001 && (
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: whiteout }}>
              {/* Two banks of cloud that part as the plane drops out of the layer */}
              <div className="absolute inset-y-[-20%] left-[-10%] w-[70%]" style={{ transform: `translateX(${-parting * 70}%)`, background: `radial-gradient(ellipse 70% 60% at 60% 50%, rgb(${cloudTint.join(',')}) 0%, rgba(${cloudTint.join(',')},0.9) 45%, rgba(${cloudTint.join(',')},0) 80%)`, filter: 'blur(18px)' }} />
              <div className="absolute inset-y-[-20%] right-[-10%] w-[70%]" style={{ transform: `translateX(${parting * 70}%)`, background: `radial-gradient(ellipse 70% 60% at 40% 50%, rgb(${cloudTint.join(',')}) 0%, rgba(${cloudTint.join(',')},0.9) 45%, rgba(${cloudTint.join(',')},0) 80%)`, filter: 'blur(18px)' }} />
              <div className="absolute inset-0" style={{ background: `rgba(${cloudTint.join(',')},${0.85 * (1 - parting)})` }} />
            </div>
          )}

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
          <label className="flex items-center gap-1.5">Scrub
            <input
              id="flight-lab-scrub"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={scrub ?? progress}
              onChange={(e) => setScrub(Number(e.target.value))}
              className="w-40"
            />
          </label>
          {scrub !== null && (
            <button type="button" onClick={() => setScrub(null)} className="rounded-lg border border-white/15 px-3 py-1.5 text-white/75">Play</button>
          )}
          <button type="button" onClick={() => setActivity((a) => !a)} className={['rounded-lg border px-3 py-1.5', activity ? 'border-emerald-300 text-emerald-200' : 'border-white/15 text-white/75'].join(' ')}>
            Activity on screen
          </button>
        </div>
      </div>
    </div>
  );
}

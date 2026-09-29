'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import { arrivalTimeline, DEPARTURE_DURATION_MS } from '@/components/world-flight/arrival-scene/cinematic-motion';
import type { TimeOfDay, WeatherCondition } from '@/components/world-flight/arrival-scene/types';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import type { DestinationScene } from '@/lib/world-flight/types';
import { CockpitClouds } from '@/components/live-room/flight/cockpit-clouds';
import { CockpitSky, cockpitCloudTint } from '@/components/live-room/flight/cockpit-sky';
import { CockpitGround, type Terrain } from '@/components/live-room/flight/cockpit-ground';

/**
 * The Live Room windscreen as one flight (tuned in /dev/flight-lab).
 *   stage 'gate'    → outside camera at the origin's runway
 *   stage 'flying'  → departure cinematic → cockpit climb → cockpit cruise
 *   stage 'landing' → cockpit dives into cloud → reveal → arrival touchdown → onLanded
 */
export type FlightStage = 'gate' | 'flying' | 'landing';
type Phase = 'gate' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'landing' | 'landed';

export interface FlightCity {
  id: string;
  city: string;
  scene: DestinationScene;
}

const CLIMB_MS = 4200;
const DESCENT_MS = 9000;
const ARRIVAL_MS = 5200;
const APPROACH_SPLIT = 0.45;
const DIVE = 0.35;
const CLEAR = 0.22;

export function timeOfDayNow(date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

export interface WindscreenFlightProps {
  stage: FlightStage;
  origin: FlightCity;
  destination: FlightCity;
  timeOfDay: TimeOfDay;
  weather?: WeatherCondition;
  terrain: Terrain;
  /** An activity or text is on screen: calmer, fewer clouds. */
  calm?: boolean;
  onLanded?: () => void;
  /** Reports whether the outside camera is showing (a cinematic owns the screen). */
  onCinematic?: (cinematic: boolean) => void;
}

export function WindscreenFlight({ stage, origin, destination, timeOfDay, weather = 'clear', terrain, calm = false, onLanded, onCinematic }: WindscreenFlightProps) {
  const [phase, setPhase] = useState<Phase>(stage === 'landing' ? 'descent' : stage === 'flying' ? 'cruise' : 'gate');
  const [progress, setProgress] = useState(0);
  const landedRef = useRef(onLanded);
  landedRef.current = onLanded;

  // Stage changes from the deck start the matching sequence.
  useEffect(() => {
    if (stage === 'gate') setPhase('gate');
    else if (stage === 'flying') setPhase((p) => (p === 'gate' ? 'takeoff' : p === 'descent' || p === 'landing' || p === 'landed' ? 'cruise' : p));
    else setPhase((p) => (p === 'descent' || p === 'landing' || p === 'landed' ? p : 'descent'));
  }, [stage]);

  const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const dur = phase === 'takeoff' ? DEPARTURE_DURATION_MS
      : phase === 'climb' ? CLIMB_MS
        : phase === 'descent' ? DESCENT_MS
          : phase === 'landing' ? ARRIVAL_MS * (1 - APPROACH_SPLIT) : 0;
    if (!dur) return;
    const start = performance.now();
    setProgress(0);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setProgress(t);
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      if (phase === 'takeoff') setPhase('climb');
      else if (phase === 'climb') setPhase('cruise');
      else if (phase === 'descent') setPhase('landing');
      else {
        setPhase('landed');
        landedRef.current?.();
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [phase]);

  const diving = phase === 'descent' && progress < DIVE;
  const outside = phase !== 'climb' && phase !== 'cruise' && !diving;
  useEffect(() => onCinematic?.(outside && phase !== 'gate'), [outside, phase, onCinematic]);

  const arriving = phase === 'descent' || phase === 'landing' || phase === 'landed';
  const sideCity = arriving ? destination : origin;
  const approachT = phase === 'descent' ? Math.max(0, (progress - DIVE) / (1 - DIVE)) : 0;
  const sideFrame =
    phase === 'gate' ? { mode: 'departure' as const, phase: 'approach' as const, progress: 0 }
      : phase === 'takeoff' ? { mode: 'departure' as const, phase: 'approach' as const, progress }
        : phase === 'descent' ? { mode: 'arrival' as const, ...arrivalTimeline(approachT * APPROACH_SPLIT) }
          : phase === 'landing' ? { mode: 'arrival' as const, ...arrivalTimeline(APPROACH_SPLIT + progress * (1 - APPROACH_SPLIT)) }
            : { mode: 'arrival' as const, phase: 'landed' as const, progress: 1 };

  const palette = useMemo(() => composeTimedPalette(timeOfDay, destination.scene), [timeOfDay, destination]);
  const cloudTint = useMemo(() => cockpitCloudTint(palette, timeOfDay), [palette, timeOfDay]);
  const altitude = phase === 'climb' ? Math.min(1, progress * 1.1) : 1;
  const cloudSpeed = phase === 'climb' ? 1.4 : diving ? 1.2 + progress * 3 : 0.55;
  const whiteout = phase !== 'descent' ? 0 : diving ? Math.pow(progress / DIVE, 1.6) * 0.96 : Math.max(0, 1 - (progress - DIVE) / CLEAR) * 0.96;
  const parting = phase === 'descent' && !diving ? Math.min(1, (progress - DIVE) / CLEAR) : 0;
  const tint = cloudTint.join(',');

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        {outside ? (
          <motion.div key={`side-${sideCity.id}-${sideFrame.mode}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <DestinationArrivalScene
              destinationId={sideCity.id}
              scene={sideCity.scene}
              mode={sideFrame.mode}
              phase={sideFrame.phase}
              progress={sideFrame.progress}
              timeOfDay={timeOfDay}
              weather={weather}
              fit="slice"
              className="absolute inset-0"
            />
          </motion.div>
        ) : (
          <motion.div key="cockpit" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <CockpitSky palette={palette} timeOfDay={timeOfDay} altitude={altitude} />
            <CockpitGround terrain={terrain} palette={palette} night={timeOfDay === 'night'} speed={cloudSpeed} />
            <div
              className="absolute inset-x-0 bottom-0"
              style={{ top: '57%', background: `radial-gradient(ellipse 30% 12% at 20% 30%, rgba(${tint},0.7), transparent 70%), radial-gradient(ellipse 26% 10% at 70% 22%, rgba(${tint},0.6), transparent 70%), radial-gradient(ellipse 40% 16% at 45% 75%, rgba(${tint},0.45), transparent 70%)` }}
            />
            <CockpitClouds speed={cloudSpeed} tint={cloudTint} density={calm && !diving ? 0.4 : 1} horizon={diving ? 0.58 - progress * 0.4 : 0.58} dive={diving} />
          </motion.div>
        )}
      </AnimatePresence>
      {whiteout > 0.001 && (
        <div className="absolute inset-0 overflow-hidden" style={{ opacity: whiteout }}>
          <div className="absolute inset-y-[-20%] left-[-10%] w-[70%]" style={{ transform: `translateX(${-parting * 70}%)`, background: `radial-gradient(ellipse 70% 60% at 60% 50%, rgb(${tint}) 0%, rgba(${tint},0.9) 45%, rgba(${tint},0) 80%)`, filter: 'blur(18px)' }} />
          <div className="absolute inset-y-[-20%] right-[-10%] w-[70%]" style={{ transform: `translateX(${parting * 70}%)`, background: `radial-gradient(ellipse 70% 60% at 40% 50%, rgb(${tint}) 0%, rgba(${tint},0.9) 45%, rgba(${tint},0) 80%)`, filter: 'blur(18px)' }} />
          <div className="absolute inset-0" style={{ background: `rgba(${tint},${0.85 * (1 - parting)})` }} />
        </div>
      )}
      {calm && !outside && <div className="absolute inset-0 bg-slate-950/25" />}
    </div>
  );
}

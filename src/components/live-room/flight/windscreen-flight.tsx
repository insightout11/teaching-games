'use client';

import { IssPass } from '@/components/live-room/flight/iss-pass';
import { MeteorStreaks, PlanetPoint } from '@/components/live-room/flight/sky-extras';
import type { SceneEvent } from '@/components/live-room/flight/event-art';
import type { Waters } from '@/lib/live-room/waters-ahead';
import type { Coast } from '@/lib/live-room/coast-ahead';
import type { HighGround } from '@/lib/live-room/elevation-ahead';
import type { WorldLandmark } from '@/components/live-room/flight/world-landmarks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DestinationArrivalScene } from '@/components/world-flight/arrival-scene/destination-arrival-scene';
import { A_TOUCHDOWN_END, arrivalTimeline, DEPARTURE_DURATION_MS } from '@/components/world-flight/arrival-scene/cinematic-motion';
import { play, playDescent, playTakeoff } from '@/lib/audio/manager';
import { getPlaneAsset } from '@/lib/plane-progression';
import type { TimeOfDay, WeatherCondition } from '@/components/world-flight/arrival-scene/types';
import { composeTimedPalette } from '@/components/world-flight/arrival-scene/palettes';
import { skyForSun, lightSpot } from '@/components/live-room/flight/sun-sky';
import { WindscreenWeather } from '@/components/session/cockpit-scene';
import type { MoonPosition, SunPosition } from '@/lib/live-room/sun';
import type { DestinationScene } from '@/lib/world-flight/types';
import { CockpitClouds } from '@/components/live-room/flight/cockpit-clouds';
import { CloudDeck } from '@/components/live-room/flight/cloud-deck';
import { CockpitSky, cockpitCloudTint, hexToRgb, mixRgb, weatherDeckTint, weatherUndercast } from '@/components/live-room/flight/cockpit-sky';
import { useEased, useEasedVector } from '@/components/live-room/flight/use-eased';
import type { Terrain } from '@/components/live-room/flight/cockpit-ground';
import { CockpitWorld, type DistantCity, type SeaGlint } from '@/components/live-room/flight/cockpit-world';
import { useCabinShake } from '@/components/session/turbulence-beat';

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
  /** Region below (e.g. 'Asia'): gives farmland its local character. */
  region?: string | null;
  /** The real sun over the ground below, and the plane's heading: drives the cockpit sky. */
  sun?: SunPosition & { heading: number };
  /** The real moon over the same ground, for the moon's place in the sky and its phase. */
  moon?: MoonPosition;
  /** Big cities within about 150 km, drawn as lights (or a smudge of haze by day) on the ground ahead. */
  cities?: DistantCity[];
  /** Real landmarks standing in the scenery ahead (Landmark Quest). */
  landmarks?: WorldLandmark[];
  /** Real rivers and lakes around the plane. */
  waters?: Waters;
  /** Real coastlines around the plane. */
  coast?: Coast;
  /** Real high ground around the plane. */
  highGround?: HighGround;
  /** Real natural events within sight (NASA's list): smoke, ash, storm clouds. */
  events?: SceneEvent[];
  /** The International Space Station passing over (when it is really visible): when it started and from which side. */
  iss?: { start: number; side: 'left' | 'right' } | null;
  /** Real things in the sky now: a nearby plane (and whether the live feed works), the brightest planet, shooting stars on
   *  a meteor-shower night, the northern or southern lights. */
  sky?: { realPlane?: { id: string; side: 'left' | 'right'; near: boolean } | null; livePlanes?: boolean; planet?: { rel: number; elevation: number; bright: boolean } | null; meteors?: boolean; aurora?: boolean; test?: boolean };
  /** Real cloud cover below (0–100), when known. */
  cloudCover?: number;
  /** An activity or text is on screen: the view is dimmed slightly behind it (the weather itself does not change). */
  calm?: boolean;
  /** Rough air: the view outside lurches (more than the cabin does) and cloud streams past. */
  turbulence?: boolean;
  /** A video is playing over the windscreen: the scenery holds still so playback stays smooth. */
  paused?: boolean;
  onLanded?: () => void;
  /** The class's plane: take-off and landing sound like its engine. */
  planeKey?: string | null;
  /** Reports whether the outside camera is showing (a cinematic owns the screen). */
  onCinematic?: (cinematic: boolean) => void;
  /** 1 = cruise; lower during the descent, so the ground comes closer before touchdown. */
  altitude?: number;
}

export function WindscreenFlight({ stage, origin, destination, timeOfDay, weather = 'clear', terrain, region = null, sun, moon, cities, landmarks, waters, coast, highGround, events, iss = null, sky, cloudCover, calm = false, turbulence = false, paused = false, planeKey = null, onLanded, onCinematic, altitude: descentAltitude = 1 }: WindscreenFlightProps) {
  const [phase, setPhase] = useState<Phase>(stage === 'landing' ? 'descent' : stage === 'flying' ? 'cruise' : 'gate');
  const [progress, setProgress] = useState(0);
  const lurch = useCabinShake(turbulence, 1.6);
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

  // Engine sound rides the flight, as it did in the older flight scenes: the class plane's own take-off, then on
  // the way down its approach engine and the wheels touching the runway. Nothing plays during the cruise (the
  // lesson itself). The sound settings and the browser's first-tap rule are handled by the audio manager.
  const planeKeyRef = useRef(planeKey);
  planeKeyRef.current = planeKey;
  const approachRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const engine = getPlaneAsset(planeKeyRef.current).engineClass;
    // The seatbelt chime first, then the engine.
    if (phase === 'takeoff') {
      const stopChime = play('seatbelt');
      const stopEngine = playTakeoff(engine, { delayMs: 1400 });
      return () => { stopChime(); stopEngine(); };
    }
    if (phase === 'descent') {
      play('seatbelt');
      approachRef.current?.();
      approachRef.current = playDescent(engine, { delayMs: 1200 });
      return undefined;
    }
    if (phase === 'landing') {
      // Contact is at A_TOUCHDOWN_END of the arrival timeline; this phase runs its last (1 - APPROACH_SPLIT).
      const contact = Math.max(0, (A_TOUCHDOWN_END - APPROACH_SPLIT) / (1 - APPROACH_SPLIT)) * ARRIVAL_MS * (1 - APPROACH_SPLIT);
      return play('touchdown', { delayMs: contact });
    }
    if (phase === 'gate' || phase === 'cruise') { approachRef.current?.(); approachRef.current = null; }
    return undefined;
  }, [phase]);
  useEffect(() => () => { approachRef.current?.(); }, []);

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

  const sunSky = useMemo(() => (sun ? skyForSun(sun, destination.scene) : null), [sun, destination]);
  const skyTime = sunSky?.timeOfDay ?? timeOfDay;
  const palette = useMemo(() => sunSky?.palette ?? composeTimedPalette(timeOfDay, destination.scene), [sunSky, timeOfDay, destination]);
  const cloudTint = useMemo(() => cockpitCloudTint(palette, skyTime), [palette, skyTime]);
  // The ground's colours follow the sky in coarse steps: rebuilding its texture is costly.
  const groundSun = sun ? Math.round(sun.elevation / 5) * 5 : null;
  const groundPalette = useMemo(
    () => (sun && groundSun !== null ? skyForSun({ elevation: groundSun, azimuth: sun.azimuth < 180 ? 90 : 270 }, destination.scene).palette : palette),
    // Only when the stepped sun height, morning/evening or the destination changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groundSun, sun ? sun.azimuth < 180 : null, destination, sun ? null : palette],
  );
  const cover = cloudCover ?? (weather === 'clear' || weather === 'aurora' ? 25 : 85);
  const cloudDensity = diving ? 1 : Math.min(1, 0.3 + (cover / 100) * 0.8);
  // The weather outside is the same whatever is on the windscreen (Boarding, Talk, Show, Game, Scores, Map): a cloudy
  // sky used to clear the moment an activity or the map opened. `calm` only dims the view behind content.
  // Weather arrives gradually: see useEased.
  const undercastTarget = phase === 'cruise' ? weatherUndercast(weather, cover) : 0;
  const deckStrength = useEased(undercastTarget, { seconds: 26, delay: 8 }, { seconds: 14 });
  const easedDensity = useEased(cloudDensity, { seconds: 12 }, { seconds: 12 });
  const deckRgb = useEasedVector(weatherDeckTint(cloudTint, weather), 255, { seconds: 20 });
  const deck = deckRgb.map((c) => Math.round(c)).join(',');
  const cloudsTint = deckStrength > 0.01 ? mixRgb(cloudTint, deckRgb as [number, number, number], Math.min(1, deckStrength)) : cloudTint;
  const spot = sun ? lightSpot(sun, sun.heading, palette.light === 'moon', moon) : undefined;
  // The sun's (or the moon's) glitter path on the sea, under the light where it is in the window. Strongest with the
  // sun low; a pale path from a bright moon.
  const seaGlint = useMemo<SeaGlint | undefined>(() => {
    if (!sun || !spot || !spot.visible) return undefined;
    const isMoon = palette.light === 'moon';
    const el = isMoon ? moon?.elevation ?? 0 : sun.elevation;
    if (el < 0.5) return undefined;
    const lightRgb = hexToRgb(palette.lightColor.startsWith('#') ? palette.lightColor : '#fff2c8');
    return { x: parseFloat(spot.x) / 100, strength: isMoon ? 0.4 * (moon?.illumination ?? 0.5) : Math.max(0.4, Math.min(1, 1.1 - el / 60)), color: lightRgb };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot?.x, spot?.visible, sun?.elevation, moon?.elevation, moon?.illumination, palette.light, palette.lightColor]);
  const altitude = phase === 'climb' ? Math.min(1, progress * 1.1) : 1;
  const cloudSpeed = phase === 'climb' ? 1.4 : diving ? 1.2 + progress * 3 : 0.55;
  const whiteout = phase !== 'descent' ? 0 : diving ? Math.pow(progress / DIVE, 1.6) * 0.96 : Math.max(0, 1 - (progress - DIVE) / CLEAR) * 0.96;
  const parting = phase === 'descent' && !diving ? Math.min(1, (progress - DIVE) / CLEAR) : 0;
  const tint = cloudTint.join(',');

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        {outside ? (
          <motion.div key={`side-${sideCity.id}-${sideFrame.mode}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: "easeInOut" }}>
            <DestinationArrivalScene
              destinationId={sideCity.id}
              scene={sideCity.scene}
              mode={sideFrame.mode}
              phase={sideFrame.phase}
              progress={sideFrame.progress}
              timeOfDay={timeOfDay}
              weather={weather}
              skyLight={sun && moon ? { sun, moon, heading: sun.heading } : undefined}
              fit="slice"
              planeKey={planeKey}
              className="absolute inset-0"
            />
          </motion.div>
        ) : (
          <motion.div key="cockpit" className="absolute inset-[-4%]" style={{ x: lurch.x, y: lurch.y, rotate: lurch.rotate }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: "easeInOut" }}>
            <CockpitSky palette={palette} timeOfDay={skyTime} altitude={altitude} spot={spot} realPlane={sky?.realPlane ?? null} livePlanes={sky?.livePlanes ?? false} />
            {phase === 'cruise' && (skyTime === 'night' || sky?.test) && sky?.planet && <PlanetPoint {...sky.planet} />}
            {phase === 'cruise' && (skyTime === 'night' || sky?.test) && sky?.meteors && <MeteorStreaks />}
            {phase === 'cruise' && sky?.aurora && weather !== 'aurora' && <WindscreenWeather weather="aurora" />}
            {iss && phase === 'cruise' && <IssPass start={iss.start} side={iss.side} />}
            <CockpitWorld altitude={descentAltitude} terrain={terrain} region={region} palette={groundPalette} night={skyTime === 'night'} speed={cloudSpeed} paused={paused} cities={cities} landmarks={landmarks} glint={seaGlint} cloudCover={cover} waters={waters} coast={coast} highGround={highGround} events={events} />
            <div
              className="absolute inset-x-0 bottom-0"
              style={{ top: '57%', background: `radial-gradient(ellipse 30% 12% at 20% 30%, rgba(${tint},0.7), transparent 70%), radial-gradient(ellipse 26% 10% at 70% 22%, rgba(${tint},0.6), transparent 70%), radial-gradient(ellipse 40% 16% at 45% 75%, rgba(${tint},0.45), transparent 70%)` }}
            />
            {/* Thick cloud below: an undercast deck hides the ground, storms glow inside it. */}
            {deckStrength > 0.01 && (
              <div className="absolute inset-x-0 bottom-0" style={{ top: '50%', background: `linear-gradient(180deg, rgba(${deck},0) 0%, rgba(${deck},${deckStrength * 0.35}) 14%, rgba(${deck},${deckStrength * 0.75}) 34%, rgba(${deck},${deckStrength * 0.92}) 60%, rgba(${deck},${deckStrength * 0.95}) 100%)` }} />
            )}
            {deckStrength > 0.01 && <CloudDeck tint={deck} strength={deckStrength} speed={cloudSpeed} paused={paused} />}
            {/* the far edge of the cloud deck: a soft bright haze where it meets the sky (no hard grey line) */}
            {deckStrength > 0.01 && (
              <div className="absolute inset-x-0" style={{ top: '49%', height: '16%', background: `linear-gradient(180deg, rgba(232,238,248,0) 0%, rgba(232,238,248,${deckStrength * 0.55}) 50%, rgba(232,238,248,0) 100%)` }} />
            )}
            {weather === 'storm' && phase === 'cruise' && deckStrength > 0.6 && (
              <motion.div
                className="absolute inset-x-0 bottom-0"
                style={{ top: '60%', background: 'radial-gradient(ellipse 30% 40% at 35% 60%, rgba(220,230,255,0.9), transparent 70%)' }}
                animate={{ opacity: [0, 0, 0.9, 0.1, 0.7, 0, 0, 0] }}
                transition={{ duration: 7, repeat: Infinity, times: [0, 0.6, 0.62, 0.65, 0.67, 0.72, 0.9, 1] }}
              />
            )}
            {/* rain or snow on the glass thins out as the plane climbs above it (it stopped all at once at the cruise),
                and thickens on the way down */}
            {(phase === 'climb' || phase === 'descent') && weather !== 'clear' && (
              <div className="absolute inset-0" style={{ opacity: phase === 'climb' ? Math.max(0, 1 - progress * 1.15) : Math.min(1, progress * 2) }}>
                <WindscreenWeather weather={weather} />
              </div>
            )}
            {phase === 'cruise' && weather === 'aurora' && <WindscreenWeather weather="aurora" />}
            <CockpitClouds speed={turbulence ? cloudSpeed + 1.6 : cloudSpeed} tint={cloudsTint} density={turbulence || diving ? 1 : easedDensity} horizon={diving ? 0.58 - progress * 0.4 : 0.58} dive={diving} paused={paused} />
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

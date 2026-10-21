'use client';

import { IssPass } from '@/components/live-room/flight/iss-pass';
import { composeWindscreen } from '@/components/live-room/flight/photo-moment';
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

const CLIMB_MS = 14000; // the climb: the ground drops away, into the clouds, then out on top into the sun
const CLIMB_IN = 0.3, CLIMB_THICK = 0.47, CLIMB_OUT = 0.64; // where in the climb the cloud starts, is thickest, has parted
/** A landmark by the departure city: shown ahead once above the clouds, with the plane slowed so the class can look. */
const SCENIC_MS = 70000;
const SCENIC_AHEAD_KM = 80;
const SCENIC_SPEED = 0.15;
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
  /** A drawn landmark close to the departure city (Giza from Cairo, Fuji from Tokyo): shown after the climb, slowly. */
  scenicLandmark?: { id: string; kind: WorldLandmark['kind']; name: string; side: 'left' | 'right' } | null;
  /** The same for the arrival: a drawn landmark close to the destination, shown slowly once the descent starts. */
  arrivalScenic?: { id: string; kind: WorldLandmark['kind']; name: string; side: 'left' | 'right' } | null;
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
  sky?: { realPlane?: { id: string; side: 'left' | 'right'; near: boolean } | null; livePlanes?: boolean; planet?: { rel: number; elevation: number; bright: boolean; name?: string; highlight?: boolean } | null; meteors?: boolean; aurora?: boolean; test?: boolean };
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

export function WindscreenFlight({ stage, origin, destination, timeOfDay, weather = 'clear', terrain, region = null, sun, moon, cities, landmarks, scenicLandmark = null, arrivalScenic = null, waters, coast, highGround, events, iss = null, sky, cloudCover, calm = false, turbulence = false, paused = false, planeKey = null, onLanded, onCinematic, altitude: descentAltitude = 1 }: WindscreenFlightProps) {
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

  // The scenic landmark: starts when the climb ends, runs for SCENIC_MS
  const [scenicAt, setScenicAt] = useState<number | null>(null);
  const [scenic, setScenic] = useState<NonNullable<WindscreenFlightProps['scenicLandmark']> | null>(null);
  const prevPhase = useRef(phase);
  useEffect(() => {
    if (prevPhase.current === 'climb' && phase === 'cruise' && scenicLandmark) { setScenic(scenicLandmark); setScenicAt(Date.now()); }
    if (phase === 'gate') setScenicAt(null);
    prevPhase.current = phase;
  }, [phase, scenicLandmark]);
  // arriving: starts once, when the deck says the descent has begun
  const arrivalStarted = useRef<string | null>(null);
  useEffect(() => {
    if (!arrivalScenic || arrivalStarted.current === arrivalScenic.id) return;
    arrivalStarted.current = arrivalScenic.id;
    setScenic(arrivalScenic);
    setScenicAt(Date.now());
  }, [arrivalScenic]);
  const scenicArriving = !!arrivalScenic && scenic?.id === arrivalScenic.id;
  const [, setTick] = useState(0);
  useEffect(() => {
    if (scenicAt == null) return;
    const id = setInterval(() => { if (Date.now() - scenicAt > SCENIC_MS) setScenicAt(null); setTick((n) => n + 1); }, 1000);
    return () => clearInterval(id);
  }, [scenicAt]);
  const scenicOn = scenicAt != null && scenic != null;
  const scenicSince = scenicAt != null ? Date.now() - scenicAt : 0;
  const allLandmarks = useMemo(() => {
    // a landmark kept for the slow look (by the departure or arrival city) never shows in the normal scenery: it passed
    // at full speed in the climb from Manila (Pinatubo), before the slow look began
    const held = new Set([scenicLandmark?.id, arrivalScenic?.id].filter(Boolean) as string[]);
    const normal = (landmarks ?? []).filter((l) => !held.has(l.id));
    if (!scenicOn || !scenic) return normal;
    const own = { id: scenic.id, kind: scenic.kind, ahead: SCENIC_AHEAD_KM, lateral: scenic.side === 'left' ? -9 : 9 };
    return [...normal, own];
  }, [scenicOn, scenic, landmarks, scenicLandmark?.id, arrivalScenic?.id]);
  // The climb through the clouds: how deep in cloud the plane is (0 clear, 1 thick), and when it breaks out on top
  const climbing = phase === 'climb';
  const inCloud = !climbing ? 0 : progress < CLIMB_IN ? 0 : progress < CLIMB_THICK ? (progress - CLIMB_IN) / (CLIMB_THICK - CLIMB_IN) : progress < CLIMB_OUT ? 1 : 0;
  const climbParting = climbing && progress >= CLIMB_THICK && progress < CLIMB_OUT ? (progress - CLIMB_THICK) / (CLIMB_OUT - CLIMB_THICK) : 0;
  const breakout = climbing && progress >= CLIMB_OUT ? Math.max(0, 1 - (progress - CLIMB_OUT) / 0.3) : 0;
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
  const cloudDensity = diving ? 1 : scenicOn ? 0.18 : Math.min(1, 0.3 + (cover / 100) * 0.8);
  // The weather outside is the same whatever is on the windscreen (Boarding, Talk, Show, Game, Scores, Map): a cloudy
  // sky used to clear the moment an activity or the map opened. `calm` only dims the view behind content.
  // Weather arrives gradually: see useEased.
  // held back while a scenic landmark is in view (the overcast would hide the pyramids)
  const undercastTarget = phase === 'cruise' && !scenicOn ? weatherUndercast(weather, cover) : 0;
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
  // the ground: close under the plane early in the climb, falling away to cruise height
  const groundAltitude = climbing ? Math.min(descentAltitude, 0.3 + 0.7 * Math.min(1, progress / CLIMB_OUT)) : descentAltitude;
  const cloudSpeed = phase === 'climb' ? (inCloud > 0 ? 1.9 : 1.1) : scenicOn ? SCENIC_SPEED : diving ? 1.2 + progress * 3 : 0.55;
  const whiteout = climbing ? (progress < CLIMB_THICK ? Math.pow(inCloud, 1.4) * 0.96 : inCloud * 0.96 * (1 - climbParting)) : phase !== 'descent' ? 0 : diving ? Math.pow(progress / DIVE, 1.6) * 0.96 : Math.max(0, 1 - (progress - DIVE) / CLEAR) * 0.96;
  const parting = climbing ? climbParting : phase === 'descent' && !diving ? Math.min(1, (progress - DIVE) / CLEAR) : 0;
  const tint = cloudTint.join(',');
  // Photo mode: put the windscreen together into one picture when the room asks
  const shotRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const take = () => {
      const root = shotRef.current;
      const image = root ? composeWindscreen(root, { top: palette.skyTop, mid: palette.skyMid, bottom: palette.skyBottom }) : null;
      window.dispatchEvent(new CustomEvent('lc-photo-taken', { detail: { image } }));
    };
    window.addEventListener('lc-take-photo', take);
    return () => window.removeEventListener('lc-take-photo', take);
  }, [palette]);

  return (
    <div ref={shotRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
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
            <CockpitWorld altitude={groundAltitude} terrain={terrain} region={region} palette={groundPalette} night={skyTime === 'night'} speed={cloudSpeed} paused={paused} cities={cities} landmarks={allLandmarks} glint={seaGlint} cloudCover={cover} waters={waters} coast={coast} highGround={highGround} events={events} />
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
            <CockpitClouds speed={turbulence ? cloudSpeed + 1.6 : cloudSpeed} tint={cloudsTint} density={turbulence || diving ? 1 : easedDensity} horizon={diving ? 0.58 - progress * 0.4 : 0.58} dive={diving || (climbing && inCloud > 0.2 && climbParting < 0.5)} paused={paused} />
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
      {/* breaking out on top of the clouds: a warm burst of sunlight that fades */}
      {breakout > 0.001 && <div className="pointer-events-none absolute inset-0" style={{ opacity: breakout, background: `radial-gradient(ellipse 70% 55% at ${spot?.x ?? '70%'} 18%, rgba(255,244,214,0.75), rgba(255,236,200,0.18) 45%, transparent 75%)` }} />}
      {scenicOn && scenic && scenicSince < 9000 && (
        <p className="pointer-events-none absolute left-1/2 top-[14%] -translate-x-1/2 rounded-full bg-slate-950/75 px-4 py-2 text-sm text-white backdrop-blur">Captain: {scenic.name.charAt(0).toUpperCase() + scenic.name.slice(1)} {scenicArriving ? 'on the ' + scenic.side + ' as we come in' : 'coming up on the ' + scenic.side}. Get ready for a photo!</p>
      )}
      {calm && !outside && <div className="absolute inset-0 bg-slate-950/25" />}
    </div>
  );
}

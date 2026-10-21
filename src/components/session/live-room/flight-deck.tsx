'use client';

import { FactsBoard } from '@/components/session/live-room/facts-board';
import type { FactCard } from '@/lib/live-room/fact-cards';
import { momentQuestion, planMoments, type Moment, type NaturalEvent } from '@/lib/live-room/moments';
import type { FreePicture } from '@/lib/sources/wikimedia-images';
import { ArrivalCards } from './arrival-cards';
import { CityVoteBoard, type VoteCityCard } from './city-vote-board';
import { usePollVotes } from '@/hooks/use-poll-votes';
import { RoomGuide } from './room-guide';
import { markFirst, trackFunnel } from '@/lib/teacher-firsts';
import { TestFlightCoach } from './test-flight-coach';
import { CLASS_TYPES, classTypeName, type ClassProfile, type ClassType, type SecondScreens } from '@/lib/class-profile';
import { classFitMarks, withFallback } from '@/lib/class-fit';
import { flightClock } from '@/lib/live-room/flight-clock';
import { fairPick } from '@/lib/fair-pick';
import { preparedFocusKey } from '@/lib/prepared-lesson';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { HelpCircle, Lightbulb, GraduationCap, Undo2, Expand, PhoneOff, UserPlus, LayoutGrid, ArrowRight, UserX, Blend, BookOpen, Crosshair, ExternalLink, EyeOff, Eye, Hand, ListChecks, Maximize2, Menu, Minimize2, Package, Plane, PlaneLanding, Satellite, QrCode, Stamp, Search, Shuffle, TriangleAlert, Users, Video, Vote, Wind, X, ClipboardList, Camera, Smartphone } from 'lucide-react';
import { getActivity } from '@/activities/registry';
import { CopyLinkButton, CopyLinkText } from '@/components/session/live-room/copy-link';
import { openHandChannel, HAND_STALE_MS } from '@/lib/live-room/hands';
import { cabinSeatLabel } from '@/lib/live-room/seats';
import { BoardingLane, type Boarder } from '@/components/session/live-room/boarding-lane';
import { FlightPlanPanel, type CityLessonChoice } from '@/components/session/live-room/flight-plan-panel';
import { CityLessonsCard } from '@/components/session/live-room/city-lessons-card';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import { buildRoomFlightPlan } from '@/lib/live-room/room-flight-plan';
import { findTripDestination } from '@/lib/world-flight/trip-pack';
import type { WorldFlightDesignMissionContext } from '@/lib/world-flight/investigations';
import { LandingRewards, useWorldFlightRecord, WorldFlightRecordPanel } from '@/components/session/live-room/world-flight-record';
import { findPlanCity } from '@/lib/live-room/plan-city';
import type { LessonPlanPayload } from '@/lib/lesson-plan-payload';
import { parseWouldYouRather, quickVoteOptions } from '@/lib/live-room/talk-vote';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';
import type { SourceMaterial } from '@/types/source-material';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { FlightTracker } from '@/components/live-room/flight/flight-tracker';
import { DeckMap, type DeckMapPin } from '@/components/live-room/flight/deck-map';
import { WorldFlightMap } from '@/components/world-flight/world-flight-map';
import { aroundTheEarth, milestonePassed } from '@/lib/world-flight/milestones';
import { citySouvenirs, localWords, mysteryClues, packCityIds } from '@/lib/world-flight/souvenirs';
import { getDestinationById } from '@/data/world-flight/destinations';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import type { InputSpec } from '@/lib/input-spec';
import { WindscreenFlight, type FlightStage, type FlightCity } from '@/components/live-room/flight/windscreen-flight';
import { greatCirclePoint, LC_INTERNATIONAL_COORD, overflightAt, regionOf, type LatLng } from '@/lib/live-room/route-terrain';
import { bearingDeg, moonPosition, offsetClock, solarClock, sunChase, sunPosition } from '@/lib/live-room/sun';
import { drawnKindOf, drawnLandmarkNear, landmarksAhead } from '@/lib/live-room/landmarks-ahead';
import { openWindowViewChannel, WINDOW_VIEW_HEARTBEAT_MS, type WindowView } from '@/lib/live-room/window-view';
import { watersAhead, type Waters, toFrame } from '@/lib/live-room/waters-ahead';
import { realCoast, realRelief, realWaters, setRealCoast } from '@/components/live-room/flight/ground-texture';
import { highGroundAhead, type HighGround } from '@/lib/live-room/elevation-ahead';
import { eventKind, realEvents, type SceneEvent } from '@/components/live-room/flight/event-art';
import { ISS_PASS_MS } from '@/components/live-room/flight/iss-pass';
import { setFlightLog } from '@/lib/world-quiz/flight-log';
import { PhotoMoment } from '@/components/live-room/flight/photo-moment';
import { LANDMARK_CATALOG } from '@/data/world/landmark-catalog';
import { lensById, lensesFor } from '@/lib/lens';
import { animalsOf, migrationsNear } from '@/lib/animals-below';
import { activeShower, brightPlanet, METEOR_SHOWERS, moonPhaseName, sideOfSky } from '@/lib/live-room/journey-sky';
import { coastAhead, type Coast } from '@/lib/live-room/coast-ahead';
import { routePreview } from '@/lib/live-room/route-preview';
import { citiesAround, countryAt, featureNear, featureText, loadCountries, sideOf, townNear, type CountryShape } from '@/lib/live-room/places-below';
import type { LiveWeather } from '@/lib/live-room/live-weather';
import { rollWeather } from '@/components/world-flight/arrival-scene/weather';
import { useCabinShake } from '@/components/session/turbulence-beat';
import { play, startMusic, stopMusic } from '@/lib/audio/manager';
import { LOBBY_BED } from '@/lib/audio/sounds';
import type { TimeOfDay } from '@/components/world-flight/arrival-scene/types';
import { WORLD_DESTINATIONS, STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { destinationsWithinRange, distanceBetweenCoordsKm } from '@/lib/world-flight/geo';
import { HOME_BASE_ID, HOME_BASE_NAME, HOME_BASE_SCENE } from '@/lib/world-flight/home-base';
import { Leaderboard } from '@/components/session/leaderboard';
import { CatalogueDrawer } from '@/components/live-room/ui/cockpit-workspace/cockpit-panels';
import type { CatalogueEntry } from '@/components/live-room/ui/cockpit-workspace/types';
import { WIDGET_REGISTRY } from '@/components/session/widget-registry';
import { WidgetShell } from '@/components/session/widget-shell';
import { useWidgetStore } from '@/stores/widget-store';
import { useSnapZones, snappedPosition, type SnapAnchor } from '@/stores/snap-zones-store';
import { useFocusBus, type FocusRequest } from '@/stores/focus-bus-store';
import { useSessionStore } from '@/stores/session-store';
import { useLiveRoomStore, useRoom, type RoomItem } from '@/stores/live-room-store';
import { SourcesDrawer, hostOf } from '@/components/session/live-room/sources-drawer';
import { ShownItem } from '@/components/session/live-room/shown-item';
import { openRoomChannel } from '@/components/session/live-room/room-channel';
import { roomItemToSource } from '@/components/session/live-room/room-source';
import { useDeckDrag, type DeckDrop } from '@/components/session/live-room/use-deck-drag';
import { useLessonMemory } from '@/hooks/use-lesson-memory';
import { LessonLogbookDrawer } from '@/components/session/live-room/lesson-logbook-drawer';
import { AlbumStrip } from '@/components/session/live-room/album-strip';
import { lessonEntry, sanitizeLessonMemory, type LessonEntry } from '@/lib/lesson-memory';

/**
 * The Live Room flight deck. The windscreen is what the class sees (the teacher
 * shares this tab); everything around it is the teacher's panel. Runs on the
 * existing lesson engine: launching calls session-view's handlers, and the
 * running game/activity is portalled into `moduleHost`, which is mounted on the
 * windscreen in the Game view (and kept alive when another view is showing).
 */

export type DeckView = 'boarding' | 'talk' | 'show' | 'game' | 'scores' | 'map';
type Instrument = 'aboard' | 'answered' | 'clock' | 'top';

const VIEWS: { key: DeckView; label: string }[] = [
  { key: 'boarding', label: 'Boarding' },
  { key: 'talk', label: 'Talk' },
  { key: 'show', label: 'Show' },
  { key: 'game', label: 'Game' },
  { key: 'scores', label: 'Scores' },
  { key: 'map', label: 'Map' },
];
const INSTRUMENT_LABEL: Record<Instrument, string> = { aboard: 'On board', answered: 'Answered', clock: 'Flight time', top: 'Top score' };
const STAMP_TONES = ['border-orange-300/70 text-orange-200', 'border-emerald-300/70 text-emerald-200', 'border-sky-300/70 text-sky-200', 'border-violet-300/70 text-violet-200'];
type RouteCity = FlightCity & LatLng;
const HOME: RouteCity = { id: HOME_BASE_ID, city: HOME_BASE_NAME, scene: HOME_BASE_SCENE, ...LC_INTERNATIONAL_COORD };
/** Class lengths offered at boarding; the flight lands ~5 minutes before the end. */
const CLASS_MINUTES = [30, 45, 60, 90];
const CLASS_MINUTES_KEY = 'lc-class-minutes-last';
const TEST_FLIGHT_DONE_KEY = 'lc-test-flight-done';
/** The descent starts this many minutes before arrival. */
const DESCENT_MINUTES = 5;
// The guided test flight's pretend students: no device, never saved to the class list.
const PRETEND_STUDENTS = [
  { id: 'pretend-mia', name: 'Mia', avatar_seed: 'pretend-mia' },
  { id: 'pretend-leo', name: 'Leo', avatar_seed: 'pretend-leo' },
  { id: 'pretend-ava', name: 'Ava', avatar_seed: 'pretend-ava' },
];
const SCENE_CITIES = WORLD_DESTINATIONS.filter((d) => d.scene);
const toRouteCity = (d: (typeof SCENE_CITIES)[number]): RouteCity => ({ id: d.id, city: d.city, scene: d.scene!, lat: d.lat, lng: d.lng });
function hashOf(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}
const DEFAULT_STAMPS = ['flash-quiz', 'hot-take-arena', 'vocab-sprint', 'fact-detective', 'conversation-rounds'];
// Each class type's quick bar (after the class's own favourites and recent activities).
const TYPE_STAMPS: Record<ClassType, string[]> = {
  structured: ['flash-quiz', 'grammar-spotlight', 'read-aloud', 'radio-check', 'vocab-sprint', 'fact-detective'],
  'game-time': ['flash-quiz', 'imposter', 'mystery-flight', 'taboo-sprint', 'hot-seat', 'sector-strike'],
  conversation: ['scene-igniter', 'conversation-rounds', 'mystery-flight', 'pass-the-line', 'taboo-sprint', 'tag-team-debate'],
  'free-talk': ['conversation-rounds', 'hot-take-arena', 'would-you-rather', 'fact-detective', 'quick-fire', 'two-truths-and-a-lie'],
};

export interface DeckParticipant {
  id: string;
  student_id: string | null;
  client_id: string;
  display_name: string;
  avatar_seed: string | null;
  joined_at: string;
  /** On the class list but not on a device: the teacher speaks and taps for them. */
  deviceless?: boolean;
}

/** A student on the class list. */
export interface DeckRosterStudent {
  id: string;
  name: string;
  avatar_seed: string | null;
}

export interface FlightDeckProps {
  sessionId: string;
  className: string;
  /** The class, so its quick bar (favourites and recent activities) is remembered between lessons. */
  classId?: string;
  /** How the class usually runs (class type and settings); the room opens set up for it. */
  classProfile?: ClassProfile;
  /** How many students have a second screen (class settings, or the older devices setting). */
  classScreens?: SecondScreens;
  /** A class's first lesson: offer the guided test flight with pretend students. */
  offerTestFlight?: boolean;
  joinUrl: string;
  participants: DeckParticipant[];
  /** The class list: everyone gets a seat, with or without a device. */
  roster?: DeckRosterStudent[];
  /** Add a student to the class list (a trial student, someone unexpected). Resolves false when it failed. */
  onAddStudent?: (name: string) => Promise<boolean>;
  onRemoveParticipant: (id: string) => Promise<void>;
  removeConfirm: string | null;
  removeError: string | null;
  rosterCount: number;
  startedAt: string | null;
  games: GamePlugin[];
  activities: ActivityPlugin[];
  runningKey: string | null;
  moduleHost: ReactNode;
  onLaunchGame: (game: GamePlugin) => void;
  onLaunchActivity: (activity: ActivityPlugin) => void;
  onReturn: () => void;
  /** `arrivalId` = where the class is when the lesson ends (the end screen shows that city). */
  onEndSession: (arrivalId?: string) => void;
  /** End as a completed flight (World Flight records the landing and moves the class). */
  onCompleteSession: (arrivalId?: string) => void;
  /** Prepare an activity in the background for the item in focus. */
  onPrefetch?: (activity: ActivityPlugin, source: SourceMaterial) => void;
  /** Fly a flight plan in this session (built in the room's Flight plan panel). */
  onLaunchPlan: (plan: LessonPlanPayload) => void;
  /** The running flight plan, if any: the room shows its stage bar instead of "End activity". */
  flightPlan?: RoomFlightPlanStatus | null;
  /** A plan that arrived with the session (course page / planner): ready, waiting to start. */
  pendingPlan?: { name: string; topic: string; onStart: () => void } | null;
  /** Words of the loaded plan (topic, source, course theme): a city named there is suggested as the destination. */
  planText?: string | null;
  /** A World Flight lesson (chosen on the map): the room flies to this city and nowhere else. Its leg is already
   *  on the class's journey, so take-off does not record another. */
  fixedDestinationId?: string | null;
}

export interface RoomFlightPlanStatus {
  name: string;
  index: number;
  total: number;
  stage: string;
  nextLabel: string | null;
  inBreak: boolean;
  onNext: () => void;
  onTurbulence: () => void;
  /** When the last turbulence began (ms, 0 = never): the cockpit shakes for a few seconds from then. */
  turbulenceAt?: number;
  onEnd: () => void;
}

function keyOf(p: DeckParticipant) {
  return p.student_id || p.client_id;
}

function fmtClock(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

const TURBULENCE_MS = 4500;

export function FlightDeck({
  sessionId,
  className,
  classId,
  classProfile,
  classScreens,
  offerTestFlight = false,
  joinUrl,
  participants,
  roster = [],
  onAddStudent,
  onRemoveParticipant,
  removeConfirm,
  removeError,
  rosterCount,
  startedAt,
  games,
  activities,
  runningKey,
  moduleHost,
  onLaunchGame,
  onLaunchActivity,
  onReturn,
  onEndSession,
  onCompleteSession,
  onPrefetch,
  onLaunchPlan,
  flightPlan,
  pendingPlan,
  planText,
  fixedDestinationId,
}: FlightDeckProps) {
  const [planOpen, setPlanOpen] = useState(false);
  // "Land" in the top bar asks once more before it lands (it disarms itself after a few seconds).
  const [landArmed, setLandArmed] = useState(false);
  useEffect(() => {
    if (!landArmed) return;
    const t = setTimeout(() => setLandArmed(false), 4000);
    return () => clearTimeout(t);
  }, [landArmed]);
  const reduce = useReducedMotion();
  // Turbulence: the whole cockpit is thrown about for a few seconds, with the seatbelt sign and the rumble.
  const turbulenceAt = flightPlan?.turbulenceAt ?? 0;
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!turbulenceAt) return;
    const left = TURBULENCE_MS - (Date.now() - turbulenceAt);
    if (left <= 0) return;
    setShaking(true);
    const stop = play('turbulence');
    const t = setTimeout(() => setShaking(false), left);
    return () => { clearTimeout(t); stop?.(); setShaking(false); };
  }, [turbulenceAt]);
  const shake = useCabinShake(shaking && !reduce);
  const scores = useSessionStore((s) => s.scores);
  const setSourceMaterial = useSessionStore((s) => s.setSourceMaterial);
  const setCustomTopic = useSessionStore((s) => s.setCustomTopic);
  const setCurrentStudent = useSessionStore((s) => s.setCurrentStudent);
  const { material, shown } = useRoom(sessionId);
  // Live memory: what this lesson covers, recorded as it happens (docs/live-memory-concept.md).
  const lessonMemory = useLessonMemory(sessionId);
  const { material: recordMaterial, activity: recordActivity, topic: recordTopic, words: recordWords } = lessonMemory;
  useEffect(() => {
    material.forEach((m) => { if (m.kind !== 'note') recordMaterial(m.title, m.kind); });
  }, [material, recordMaterial]);
  const addItem = useLiveRoomStore((s) => s.add);
  const showItem = useLiveRoomStore((s) => s.show);
  const hideItem = useLiveRoomStore((s) => s.hide);
  const markRoom = useLiveRoomStore((s) => s.markRoom);
  useEffect(() => markRoom(sessionId), [sessionId, markRoom]);

  const [view, setView] = useState<DeckView>('boarding');
  const [flightStage, setFlightStage] = useState<FlightStage>('gate');
  const [cinematic, setCinematic] = useState(false);
  const [landed, setLanded] = useState(false);
  // After landing the room stays open as the arrivals hall until the teacher ends class.
  const [hall, setHall] = useState(false);
  const [takeoffAt, setTakeoffAt] = useState<number | null>(null);
  // The class type sets up the room; "change for today" overrides it for this lesson only.
  const todayTypeKey = `lc-room-type-${sessionId}`;
  const [todayOverride, setTodayOverride] = useState<ClassType | null>(null);
  useEffect(() => {
    try { const t = localStorage.getItem(todayTypeKey); if (t && CLASS_TYPES.some((c) => c.key === t)) setTodayOverride(t as ClassType); } catch { /* storage blocked */ }
  }, [todayTypeKey]);
  const todayType: ClassType | undefined = todayOverride ?? classProfile?.type;
  const changeForToday = (t: ClassType | '') => {
    const next = t && t !== classProfile?.type ? t : null;
    setTodayOverride(next);
    try { if (next) localStorage.setItem(todayTypeKey, next); else localStorage.removeItem(todayTypeKey); } catch { /* storage blocked */ }
  };
  // Free talk: nobody is ranked in the room (no Scores view, no top score).
  const scoresOff = todayType === 'free-talk';
  // The class clock starts when the room opens (kept across reloads); every flight lands 5 minutes before the end.
  const [classStartAt, setClassStartAt] = useState(() => Date.now());
  const [classMinutes, setClassMinutes] = useState(60);
  // The class journey is World Flight's: depart from the class's current city,
  // within the plane's range (LC International before its first flight).
  const [position, setPosition] = useState<{ currentDestinationId: string | null; rangeKm: number; planeKey?: string | null; nextDestinationId?: string | null; journey?: Array<{ from: string | null; to: string }> } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/session/${encodeURIComponent(sessionId)}/room-leg`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setPosition(d ?? { currentDestinationId: null, rangeKm: STARTER_PLANE_RANGE_KM }); })
      .catch(() => { if (!cancelled) setPosition({ currentDestinationId: null, rangeKm: STARTER_PLANE_RANGE_KM }); });
    return () => { cancelled = true; };
  }, [sessionId]);
  // A class that has never flown may start its journey from any city (LC International unless the teacher picks).
  const [startId, setStartId] = useState<string | null>(null);
  const canChooseStart = !!position && !position.currentDestinationId;
  const origin = useMemo<RouteCity>(() => {
    const id = position?.currentDestinationId ?? (canChooseStart ? startId : null);
    const d = id ? SCENE_CITIES.find((c) => c.id === id) : undefined;
    return d ? toRouteCity(d) : HOME;
  }, [position, canChooseStart, startId]);
  // Remembered once seen: the plan that named the city is dropped when its last stage ends, before the landing.
  const [lockedId, setLockedId] = useState<string | null>(fixedDestinationId ?? null);
  useEffect(() => { if (fixedDestinationId) setLockedId(fixedDestinationId); }, [fixedDestinationId]);
  const reachable = useMemo<RouteCity[]>(() => {
    const originPack = SCENE_CITIES.find((c) => c.id === origin.id);
    // First flight: anywhere (nearest to the hub first); otherwise within range. The
    // picker lists these 24, and the default is always one of them.
    const list = !originPack
      ? SCENE_CITIES.map(toRouteCity)
      : destinationsWithinRange(originPack, SCENE_CITIES, position?.rangeKm ?? STARTER_PLANE_RANGE_KM).map((r) => toRouteCity(r.destination));
    const locked = lockedId ? SCENE_CITIES.find((c) => c.id === lockedId) : undefined;
    if (locked) return [toRouteCity(locked)];
    return list.slice(0, 24);
  }, [origin, position, lockedId]);
  const [chosenId, setChosenId] = useState<string | null>(null);
  // World Flight in the room. `teachId`: an out-of-range city picked on the map (its lessons can be taught without
  // flying there). `cityLesson`: the city lesson being set up in the flight panel. `stayHome`: a far city's lesson
  // is running, so there is no take-off and the class stays where it is.
  // Passport / Hangar, opened over the room.
  const [recordTab, setRecordTab] = useState<'passport' | 'hangar' | null>(null);
  const [teachId, setTeachId] = useState<string | null>(null);
  const [cityLesson, setCityLesson] = useState<(CityLessonChoice & { cityId: string }) | null>(null);
  const [stayHome, setStayHome] = useState<string | null>(null);
  // The flight panel opened with a flight already chosen (the city card's Travel button).
  const [planPreset, setPlanPreset] = useState<string | undefined>(undefined);
  const flightKey = `lc-room-flight-${sessionId}`;
  // Saving waits until the saved flight has been read back (a save on the first render would overwrite it).
  const [flightRestored, setFlightRestored] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(flightKey) ?? 'null') as { stage?: string; takeoffAt?: number; chosenId?: string; lockedId?: string; stayHome?: string; classStartAt?: number; classMinutes?: number } | null;
      if (saved?.classStartAt) setClassStartAt(Math.min(saved.classStartAt, saved.takeoffAt ?? saved.classStartAt));
      if (saved?.classMinutes) setClassMinutes(saved.classMinutes);
      else {
        // A new lesson starts from the length this teacher used last time.
        const last = Number(localStorage.getItem(CLASS_MINUTES_KEY));
        // The class's usual length (Game time: its game minutes) wins over the last length used anywhere.
        if (classProfile?.minutes) setClassMinutes(classProfile.minutes);
        else if (last >= 15 && last <= 240) setClassMinutes(last);
      }
      if (saved?.chosenId) setChosenId(saved.chosenId);
      if (saved?.lockedId) setLockedId((cur) => cur ?? saved.lockedId ?? null);
      if (saved?.stayHome) setStayHome(saved.stayHome);
      if (saved?.stage === 'flying' && saved.takeoffAt) { setFlightStage('flying'); setTakeoffAt(saved.takeoffAt); }
    } catch { /* storage blocked */ }
    setFlightRestored(true);
    // Restore once per lesson; the class length read here is only a starting value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightKey]);
  useEffect(() => {
    if (!flightRestored) return;
    try {
      localStorage.setItem(flightKey, JSON.stringify({ stage: flightStage, takeoffAt, chosenId, lockedId, stayHome, classStartAt, classMinutes }));
      localStorage.setItem(CLASS_MINUTES_KEY, String(classMinutes));
    } catch { /* storage blocked */ }
  }, [flightRestored, flightKey, flightStage, takeoffAt, chosenId, lockedId, stayHome, classStartAt, classMinutes]);
  const destination = useMemo<RouteCity>(
    () => reachable.find((c) => c.id === chosenId) ?? reachable[hashOf(sessionId) % Math.max(1, reachable.length)] ?? HOME,
    [reachable, chosenId, sessionId],
  );
  // Journey map for the landing: every completed leg plus today's.
  const journeyPaths = useMemo(() => {
    const at = (id: string | null): LatLng => {
      const c = id ? SCENE_CITIES.find((d) => d.id === id) : undefined;
      return c ? toRouteCity(c) : HOME;
    };
    const legs = (position?.journey ?? []).map((l) => ({ a: at(l.from), b: at(l.to) }));
    return [...legs, { a: origin as LatLng, b: destination as LatLng }];
  }, [position, origin, destination]);

  // The plan is set somewhere (e.g. a Tokyo travel course lesson): suggest flying there, or to
  // the nearest city in range on the way when it's too far for today's plane.
  const citySuggestion = useMemo(() => {
    const target = planText ? findPlanCity(planText, SCENE_CITIES) : null;
    if (!target || target.id === destination.id || target.id === origin.id) return null;
    const there = reachable.find((c) => c.id === target.id);
    if (there) return { text: `This lesson is set in ${target.city}: fly there?`, fly: there };
    const t = toRouteCity(target);
    const near = [...reachable].sort((a, b) => distanceBetweenCoordsKm(a, t) - distanceBetweenCoordsKm(b, t))[0];
    if (!near || near.id === destination.id) return null;
    return { text: `${target.city} is out of range today: fly to ${near.city}, on the way?`, fly: near };
  }, [planText, destination.id, origin.id, reachable]);

  // "Where should we fly next, and why?": a poll of up to four cities in range
  // (the picked one first). The Poll widget's "Fly to …" sets the winner.
  const startPoll = async (question: string, options: string[], metadata: Record<string, unknown>, opened: string) => {
    const supabase = createClient();
    await supabase.from('polls').update({ is_active: false }).eq('session_id', sessionId).eq('is_active', true);
    const { error } = await supabase.from('polls').insert({ session_id: sessionId, question, options, is_active: true, metadata });
    if (error) { flash('Could not start the vote.'); return; }
    openTool('poll', window.innerWidth / 2, window.innerHeight / 2);
    flash(opened);
  };
  // The where-next vote at the start: the vote board on the big screen while students board (Phase 3.1).
  const [cityVote, setCityVote] = useState<{ pollId: string; revealed: boolean } | null>(null);
  const [cityReasons, setCityReasons] = useState<Array<{ name: string; choice: string; reason: string }>>([]);
  const { tallies: cityTallies, votes: cityVotes } = usePollVotes(cityVote?.pollId ?? null);
  const startCityPoll = async () => {
    // Every city in range is a choice (nearest first reads naturally as a list).
    const options = Array.from(new Set(reachable.map((c) => c.city)));
    if (options.length < 2) { flash('Only one city is in range right now.'); return; }
    if (isMockMode()) { setCityVote({ pollId: 'mock-city-vote', revealed: false }); setView('boarding'); return; }
    const supabase = createClient();
    await supabase.from('polls').update({ is_active: false }).eq('session_id', sessionId).eq('is_active', true);
    const { data, error } = await supabase.from('polls')
      .insert({ session_id: sessionId, question: 'Where should we fly next, and why?', options, is_active: true, metadata: { askWhy: true, purpose: 'next-city' } })
      .select('id').single();
    if (error || !data) { flash('Could not start the vote.'); return; }
    setCityVote({ pollId: (data as { id: string }).id, revealed: false });
    setCityReasons([]);
    setView('boarding');
    flash('Vote open on phones: where next, and why?');
  };
  const closeCityVote = async (reveal: boolean) => {
    if (!cityVote) return;
    if (!isMockMode()) {
      const supabase = createClient();
      await supabase.from('polls').update({ is_active: false }).eq('id', cityVote.pollId);
      if (reveal) {
        const { data } = await supabase.from('student_submissions').select('display_name, content').eq('session_id', sessionId).eq('game_key', `poll-reason:${cityVote.pollId}`).order('created_at', { ascending: true });
        setCityReasons(((data ?? []) as Array<{ display_name: string | null; content: string }>).flatMap((r) => {
          try { const v = JSON.parse(r.content) as { choice?: string; reason?: string }; return v.choice && v.reason ? [{ name: r.display_name ?? 'A student', choice: v.choice, reason: v.reason }] : []; } catch { return []; }
        }));
      }
    }
    setCityVote(reveal ? { ...cityVote, revealed: true } : null);
  };
  // Take off to the winner once the destination has switched to it.
  const [pendingTakeoff, setPendingTakeoff] = useState<string | null>(null);
  // After landing: where to next time? The cities in range of where the class has just landed.
  const nextReachable = useMemo<RouteCity[]>(() => {
    const here = SCENE_CITIES.find((c) => c.id === destination.id);
    if (!here) return [];
    return destinationsWithinRange(here, SCENE_CITIES, position?.rangeKm ?? STARTER_PLANE_RANGE_KM).map((r) => toRouteCity(r.destination)).slice(0, 8);
  }, [destination.id, position]);
  const startNextCityPoll = async () => {
    const options = Array.from(new Set(nextReachable.map((c) => c.city)));
    if (options.length < 2) { flash('Only one city is in range from here.'); return; }
    await startPoll('Where should we fly next time, and why?', options, { askWhy: true, purpose: 'next-city' }, 'Vote open on phones: where next time?');
  };

  // One journey: the flight plan rides on the room's flight. Leaving the first stage at the gate is
  // the take-off; the last stage's button is the landing (the room's landing + arrival).
  const beginLanding = () => {
    if (runningKey) onReturn();
    setFlightStage('landing');
    flash(`Beginning our descent into ${destination.city}`);
  };
  // The teacher lands the plane: from the button in the top bar (two taps, so it cannot happen by accident) or the menu.
  const landNow = () => {
    markFirst('landed');
    trackFunnel('lesson_landed', { classType: todayType ?? null });
    setPanel(null);
    setLandArmed(false);
    if (flightPlan) flightPlan.onEnd();
    beginLanding();
  };
  // Ending without arriving (a quick test, a class cut short): the session ends and the class stays where it
  // took off from, and it is not counted as a completed flight.
  const endWithoutLanding = () => {
    setPanel(null);
    if (flightPlan) flightPlan.onEnd();
    onEndSession(origin.id);
  };
  const planNext = () => {
    if (!flightPlan) return;
    if (!flightPlan.nextLabel) {
      flightPlan.onEnd();
      if (flightStage === 'flying') beginLanding();
      return;
    }
    if (flightStage === 'gate' && flightPlan.index === 0 && !stayHome) takeOff();
    flightPlan.onNext();
  };

  const takeOff = (focusId?: string) => {
    setFlightStage('flying');
    setTakeoffAt(Date.now());
    flash(`Flight to ${destination.city}: cleared for take-off`);
    // The room opens where this kind of class works (boarding always comes first).
    if (todayType === 'conversation' || todayType === 'free-talk') setView('talk');
    else if (todayType === 'game-time') setPanel('catalogue');
    else if (todayType === 'structured' && !flightPlan) setPlanOpen(true);
    if (lockedId) return;
    // Record the leg on the class's World Flight journey.
    void fetch(`/api/session/${encodeURIComponent(sessionId)}/room-leg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: destination.id, ...(focusId ? { focusId } : {}), ...(canChooseStart && startId ? { departureDestinationId: startId } : {}) }),
    }).catch(() => {});
  };

  useEffect(() => {
    if (!pendingTakeoff || destination.id !== pendingTakeoff) return;
    setPendingTakeoff(null);
    setCityVote(null);
    takeOff();
    // takeOff reads the current destination, which is why this waits for it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTakeoff, destination.id]);

  // A far city's lesson, taught from where the class is: recorded so it earns its hour, stars and clue (no stamp).
  const teachFromHere = (cityId: string, focusId: string) => {
    setStayHome(cityId);
    void fetch(`/api/session/${encodeURIComponent(sessionId)}/room-leg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: cityId, focusId, ...(canChooseStart && startId ? { departureDestinationId: startId } : {}) }),
    }).catch(() => {});
  };
  // What this lesson has earned, for the landing card (fetched once the plane is down).
  const { data: landingRecord } = useWorldFlightRecord(sessionId, landed ? 'landed' : 'flying');
  // Souvenirs on the World Flight map: one the class has in each visited city, and whether more are waiting there.
  const mapSouvenirs = useMemo(() => (landingRecord?.souvenirShelf ?? []).map((c) => ({
    destinationId: c.destinationId,
    icon: c.items.find((i) => i.owned)?.icon ?? null,
    waiting: c.items.some((i) => !i.owned),
  })), [landingRecord]);
  // The Design mission, started from the Passport: the class designs from the evidence it collected. It runs where
  // the class is (no take-off), like a city lesson taught from here.
  const startDesignMission = async (investigationId: string) => {
    setRecordTab(null);
    const preset = FLIGHT_PLAN_PRESETS.find((candidate) => candidate.id === 'design-studio-60');
    try {
      const res = await fetch(`/api/session/${encodeURIComponent(sessionId)}/design-mission`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ investigationId }) });
      const data = await res.json().catch(() => null) as { mission?: WorldFlightDesignMissionContext; content?: Record<string, unknown>; error?: string } | null;
      if (!res.ok || !data?.mission || !data.content || !preset) { flash(data?.error ?? 'Could not start the Design mission.'); return; }
      const plan = buildRoomFlightPlan({ preset, topic: data.mission.designMissionTitle, difficulty });
      setStayHome('design-mission');
      recordActivity(`Design mission: ${data.mission.designMissionTitle}`);
      flash(`Design mission: ${data.mission.designMissionTitle}`);
      onLaunchPlan({ ...plan, worldFlightDesignMissionContext: data.mission, generatedContent: { ...plan.generatedContent, 'design-studio': data.content } } as unknown as LessonPlanPayload);
    } catch { flash('Could not start the Design mission.'); }
  };
  const stayHomeCity = stayHome ? SCENE_CITIES.find((c) => c.id === stayHome) ?? null : null;
  const visitedIds = useMemo(() => new Set((position?.journey ?? []).flatMap((l) => (l.from ? [l.from, l.to] : [l.to]))), [position]);
  // The city whose lessons the map card shows: a far city if one is picked, otherwise today's destination.
  const cardCity = (teachId ? SCENE_CITIES.find((c) => c.id === teachId) : undefined) ?? SCENE_CITIES.find((c) => c.id === destination.id) ?? null;
  const cardIsFar = !!teachId && cardCity?.id === teachId;

  // Route planner (before take-off): home plus every city in range as a pin.
  // The World Flight map's tick marks: every city the class has stamped.
  const visitedList = useMemo(() => Array.from(visitedIds), [visitedIds]);
  const journeyLegs = useMemo(() => position?.journey ?? [], [position]);
  // The landing card's journey: every flight so far, ending with the one that just landed.
  const landingJourney = useMemo(() => {
    const legs = position?.journey ?? [];
    const last = legs[legs.length - 1];
    return last && last.to === destination.id ? legs : [...legs, { from: origin.id, to: destination.id }];
  }, [position, origin.id, destination.id]);
  // The class's whole journey in km (its flights so far), for the milestones and the route map line.
  const journeyKm = useMemo(() => {
    const at = (id: string | null) => { const c = id ? SCENE_CITIES.find((d) => d.id === id) : undefined; return c ? toRouteCity(c) : HOME; };
    return Math.round((position?.journey ?? []).reduce((km, l) => km + distanceBetweenCoordsKm(at(l.from), at(l.to)), 0));
  }, [position]);
  const [replayKey, setReplayKey] = useState(0);
  const [replayRunning, setReplayRunning] = useState(false);
  // A distance milestone this flight passed (the journey list may already include it once the class has landed).
  const landingMilestone = useMemo(() => {
    if (!landed) return null;
    const last = position?.journey?.[position.journey.length - 1];
    const thisKm = Math.round(distanceBetweenCoordsKm(origin, destination));
    const included = !!last && last.to === destination.id;
    const before = included ? journeyKm - thisKm : journeyKm;
    return milestonePassed(before, before + thisKm);
  }, [landed, position, origin, destination, journeyKm]);

  // Class pin map: every phone drops a pin (geo-point input); pins land live.
  const setInputSpec = useSessionStore((s) => s.setInputSpec);
  const phoneSpec = useSessionStore((s) => s.inputSpec);
  // One tap clears every phone: whatever task is on them (board, question, game input) and any open vote
  const clearPhones = async () => {
    await setInputSpec(null);
    if (!isMockMode()) await createClient().from('polls').update({ is_active: false }).eq('session_id', sessionId).eq('is_active', true);
    flash('Phones cleared');
  };
  const [pinRound, setPinRound] = useState<{ id: string; prompt: string } | null>(null);
  const [pins, setPins] = useState<DeckMapPin[]>([]);
  // A place tapped on the explore map, waiting for 'Make it the topic'
  const [placePick, setPlacePick] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'tracker' | 'pins'>('tracker');
  const startPins = (prompt: string): string => {
    const id = `room-pins-${Date.now()}`;
    setPinRound({ id, prompt });
    setPins([]);
    setMapMode('pins');
    setView('map');
    void setInputSpec({
      type: 'geo-point',
      gameKey: ROOM_PINS_KEY,
      prompt,
      instruction: 'Tap the map to drop your pin, then send it.',
      roundId: id,
      mapCenter: [10, 18],
      mapZoom: 0.8,
      mapLabels: true,
      mapMaxZoom: 9,
    } as InputSpec);
    return id;
  };

  // ── Boarding games (Where in the world? · Say hello like a local · How far is it?) ──
  // The two map games are pin rounds whose pins stay hidden until the reveal, so nobody copies a classmate.
  type PinGame = { kind: 'where' | 'hello'; roundId: string; city: { id: string; city: string; country: string; lat: number; lng: number }; clues: string[]; shown: number; word?: { word: string; meaning: string; say: string; language: string }; revealed: boolean };
  const [pinGame, setPinGame] = useState<PinGame | null>(null);
  const randomPackCity = (needWords: boolean) => {
    const ids = packCityIds().filter((id) => !!getDestinationById(id) && (needWords ? localWords(id).length > 0 : mysteryClues(id).length >= 4));
    const id = ids[Math.floor(Math.random() * ids.length)];
    const d = id ? getDestinationById(id) : undefined;
    return d ? { id: d.id, city: d.city, country: d.country, lat: d.lat, lng: d.lng } : null;
  };
  const startPinGame = (kind: 'where' | 'hello') => {
    const city = randomPackCity(kind === 'hello');
    if (!city) return;
    // Keep the boarding QR code in a corner so late arrivals can still join.
    if (view === 'boarding') shrinkToCorner(QR_WIDGET, 'tr', 'map');
    if (kind === 'where') {
      const roundId = startPins('Where in the world? Read the clues and pin the city.');
      setPinGame({ kind, roundId, city, clues: mysteryClues(city.id), shown: 1, revealed: false });
    } else {
      const words = localWords(city.id);
      const w = words[Math.floor(Math.random() * words.length)];
      const roundId = startPins(`Where do people say "${w.word}"? Pin the place.`);
      setPinGame({ kind, roundId, city, clues: [], shown: 0, word: w, revealed: false });
    }
  };
  // A new clue every 15 seconds (the last clue gives it away).
  useEffect(() => {
    if (!pinGame || pinGame.kind !== 'where' || pinGame.revealed || pinGame.shown >= pinGame.clues.length) return;
    const t = window.setTimeout(() => setPinGame((g) => (g && g.roundId === pinGame.roundId ? { ...g, shown: g.shown + 1 } : g)), 15000);
    return () => window.clearTimeout(t);
  }, [pinGame]);
  const pinGameGuesses = pinGame ? pins.map((p) => ({ name: p.label ?? 'A student', km: Math.round(distanceBetweenCoordsKm(p, pinGame.city)) })).sort((a, b) => a.km - b.km) : [];
  const revealPinGame = () => {
    setPinGame((g) => (g ? { ...g, revealed: true, shown: g.clues.length } : g));
    void setInputSpec(null);
  };
  const endPinGame = () => { setPinGame(null); stopPins(); };

  // How far is it? A phone vote between four distances, then the answer.
  const [distanceQuiz, setDistanceQuiz] = useState<{ city: string; from: string; km: number; shown: boolean } | null>(null);
  const startDistanceQuiz = async () => {
    const pick = randomPackCity(false);
    if (!pick || pick.id === origin.id) return;
    const km = Math.round(distanceBetweenCoordsKm(origin, pick) / 500) * 500 || 500;
    const fmt = (n: number) => `about ${n.toLocaleString()} km`;
    const decoys = [0.45, 1.7, 2.6].map((f) => Math.max(500, Math.round((km * f) / 500) * 500)).filter((n) => n !== km);
    const options = Array.from(new Set([km, ...decoys])).sort((a, b) => a - b).map(fmt);
    const supabase = createClient();
    await supabase.from('polls').update({ is_active: false }).eq('session_id', sessionId).eq('is_active', true);
    const { error } = await supabase.from('polls').insert({
      session_id: sessionId,
      question: `How far is ${pick.city} from ${origin.city}?`,
      options,
      is_active: true,
      metadata: { purpose: 'distance-quiz' },
    });
    if (error) { flash('Could not start the vote.'); return; }
    setDistanceQuiz({ city: pick.city, from: origin.city, km, shown: false });
    openTool('poll', window.innerWidth / 2, window.innerHeight / 2);
  };
  // Class map extras: your own question, a detailed map, and pin → topic.
  const [customPin, setCustomPin] = useState('');
  const [detailedMap, setDetailedMap] = useState(false);
  const [pinPick, setPinPick] = useState<{ pin: DeckMapPin; levels: Array<{ kind: string; label: string }> | null } | null>(null);
  const pickPin = (id: string) => {
    const pin = pins.find((p) => p.id === id);
    if (!pin) return;
    setPinPick({ pin, levels: null });
    void fetch(`/api/live-room/place?lat=${pin.lat}&lng=${pin.lng}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPinPick((cur) => (cur?.pin.id === id ? { pin, levels: Array.isArray(d?.levels) ? d.levels : [] } : cur)))
      .catch(() => setPinPick((cur) => (cur?.pin.id === id ? { pin, levels: [] } : cur)));
  };
  const askCustom = () => {
    const q = customPin.trim();
    if (!q) return;
    startPins(q);
    setCustomPin('');
  };

  const stopPins = () => {
    setPinRound(null);
    void setInputSpec(null);
  };
  useEffect(() => {
    if (!pinRound) return;
    const supabase = createClient();
    let cancelled = false;
    const poll = async () => {
      const { data } = await supabase
        .from('scores')
        .select('client_id, display_name, response_data, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (cancelled || !data) return;
      const byId = new Map<string, DeckMapPin>();
      for (const row of data as Array<{ client_id: string | null; display_name: string | null; response_data: Record<string, unknown> | null }>) {
        const r = row.response_data;
        if (r?.gameKey !== ROOM_PINS_KEY || typeof r.choice !== 'string') continue;
        try {
          const g = JSON.parse(r.choice) as { roundId?: string; lat?: number; lng?: number };
          if (g.roundId !== pinRound.id || typeof g.lat !== 'number' || typeof g.lng !== 'number') continue;
          const id = row.client_id ?? row.display_name ?? String(byId.size);
          byId.set(id, { id, lat: g.lat, lng: g.lng, label: row.display_name ?? undefined, color: PIN_COLORS[hashOf(id) % PIN_COLORS.length] });
        } catch { /* not a pin */ }
      }
      const next = Array.from(byId.values());
      setPins((prev) => (prev.length === next.length && prev.every((p, i) => p.id === next[i].id && p.lat === next[i].lat && p.lng === next[i].lng) ? prev : next));
    };
    void poll();
    const t = window.setInterval(poll, 2500);
    return () => { cancelled = true; window.clearInterval(t); };
  }, [pinRound, sessionId]);

  // Student messages waiting for the teacher: lights up the Messages button
  // (never the text itself: the screen is shared).
  const [waitingMessages, setWaitingMessages] = useState(0);
  const [waitingCards, setWaitingCards] = useState(0);
  useEffect(() => {
    if (isMockMode()) return;
    const supabase = createClient();
    let cancelled = false;
    const check = async () => {
      const { count } = await supabase
        .from('student_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('status', 'pending')
        .eq('published_to_class', false)
        .is('game_key', null);
      if (!cancelled && typeof count === 'number') setWaitingMessages(count);
      const { count: cards } = await supabase
        .from('class_board_items')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('visibility', 'pending')
        .eq('author_type', 'student')
        .not('board_key', 'in', '("word-cloud","exit-ticket")');
      if (!cancelled && typeof cards === 'number') setWaitingCards(cards);
    };
    void check().catch(() => {});
    const t = window.setInterval(() => { void check().catch(() => {}); }, 4000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, [sessionId]);

  const [talkPrompt, setTalkPrompt] = useState('');
  // The answer key for a question asked from the facts board: private (the Sources window) until the teacher reveals it
  type TalkAnswer = { question: string; answer: string | null; open?: boolean; source?: { title: string; url: string } | null; revealed: boolean };
  const [talkAnswer, setTalkAnswer] = useState<TalkAnswer | null>(null);
  const talkAnswerRef = useRef<TalkAnswer | null>(null);
  talkAnswerRef.current = talkAnswer;
  const [talkFollowUps, setTalkFollowUps] = useState<string[]>([]);
  const [talkOptions, setTalkOptions] = useState<{ prompt: string; followUps: string[]; options?: string[] }[]>([]);
  /** Two choices for the class vote on the current talking point (Would you rather / opinion / debate). */
  const [talkVote, setTalkVote] = useState<string[] | null>(null);
  const [talkBusy, setTalkBusy] = useState<string | null>(null);
  const [talkUsed, setTalkUsed] = useState<string[]>([]);
  const difficulty = useSessionStore((s) => s.settings.difficulty);
  const sessionTopic = useSessionStore((s) => s.settings.customTopic || s.settings.topic);
  const [huds, setHuds] = useState<Instrument[]>([]);
  const [hudPos, setHudPos] = useState<Record<string, { x: number; y: number }>>({});
  const [presenting, setPresenting] = useState(false);
  const [clearScreen, setClearScreen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  // The facts board: opens by itself the first time each topic's facts arrive (presenting comes before talking).
  const [factsOpen, setFactsOpen] = useState(false);
  const factsSeen = useRef(new Set<string>());
  // A free Wikimedia photo per fact card (by the card's own picture search), per topic.
  const [cardPics, setCardPics] = useState<Record<string, Array<FreePicture | null>>>({});
  // Soft music while the class boards; it fades out as soon as the class leaves the boarding screen.
  useEffect(() => {
    if (view === 'boarding') startMusic(LOBBY_BED);
    else stopMusic();
  }, [view]);
  useEffect(() => () => stopMusic(0), []);
  // Zoom layout: the whole window is shared, so the windscreen takes the space;
  // cargo + cabin fold into edge rails that slide open over it. Remembered.
  const [zoomLayout, setZoomLayout] = useState(false);
  useEffect(() => {
    try { setZoomLayout(localStorage.getItem('lc-zoom-layout') === '1'); } catch { /* storage blocked */ }
  }, []);
  const toggleZoomLayout = () => setZoomLayout((v) => {
    try { localStorage.setItem('lc-zoom-layout', v ? '0' : '1'); } catch { /* storage blocked */ }
    return !v;
  });
  // See-through games / activities, like glass widgets. Remembered.
  const [gameGlass, setGameGlass] = useState(false);
  useEffect(() => {
    try { setGameGlass(localStorage.getItem('lc-game-glass') === '1'); } catch { /* storage blocked */ }
  }, []);
  const toggleGameGlass = () => setGameGlass((v) => {
    try { localStorage.setItem('lc-game-glass', v ? '0' : '1'); } catch { /* storage blocked */ }
    return !v;
  });
  const [railOpen, setRailOpen] = useState<null | 'cargo' | 'cabin'>(null);
  const [railPinned, setRailPinned] = useState(false);
  const railTimer = useRef<number | null>(null);
  const windWidth = useSnapZones((st) => st.windRect?.width ?? 0);
  const windHeight = useSnapZones((st) => st.windRect?.height ?? 0);
  // Grow with the windscreen, but never taller than it (a wide, short screen cut the boarding card off).
  const sceneZoom = zoomLayout && windWidth > 0 ? Math.min(1.6, Math.max(1, Math.min(windWidth / 1050, windHeight > 0 ? windHeight / 720 : 9))) : 1;
  // Browser full screen: no tabs, address bar or taskbar.
  const [fullScreen, setFullScreen] = useState(false);
  // Opening the Sources window always ends page full screen (the browser does it). Offer the way back.
  const [fullScreenLost, setFullScreenLost] = useState(false);
  const leftOnPurpose = useRef(false);
  const popupOpened = useRef(false);
  useEffect(() => {
    const on = () => {
      const now = !!document.fullscreenElement;
      setFullScreen(now);
      if (now) setFullScreenLost(false);
      else if (popupOpened.current) setFullScreenLost(true);
      leftOnPurpose.current = false;
      popupOpened.current = false;
    };
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggleFullScreen = () => {
    try {
      if (document.fullscreenElement) { leftOnPurpose.current = true; void document.exitFullscreen(); }
      else void document.documentElement.requestFullscreen();
    } catch { /* not allowed here */ }
  };
  const openRail = (which: 'cargo' | 'cabin') => {
    if (railTimer.current) window.clearTimeout(railTimer.current);
    setRailOpen(which);
  };
  const leaveRail = () => {
    if (railPinned) return;
    if (railTimer.current) window.clearTimeout(railTimer.current);
    railTimer.current = window.setTimeout(() => setRailOpen(null), 450);
  };
  const [panel, setPanel] = useState<'catalogue' | 'sources' | 'menu' | 'logbook' | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  // ── guided test flight: three pretend students without devices (in this browser only, never on the class list) ──
  const [testFlight, setTestFlight] = useState(false);
  const [testFlightOffer, setTestFlightOffer] = useState(false);
  useEffect(() => {
    // ?testflight=1 offers it again (the "?" guide's replay link).
    const asked = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('testflight') === '1';
    if (asked) { setTestFlightOffer(true); return; }
    if (!offerTestFlight) return;
    try { if (localStorage.getItem(TEST_FLIGHT_DONE_KEY) !== '1') setTestFlightOffer(true); } catch { setTestFlightOffer(true); }
  }, [offerTestFlight]);
  const [guideOpen, setGuideOpen] = useState(false);
  // Tips at the right moment: at most one per lesson, each shown once, all can be turned off.
  const [tipsOn, setTipsOn] = useState(true);
  const [tip, setTip] = useState<{ id: string; text: string } | null>(null);
  useEffect(() => { try { setTipsOn(localStorage.getItem('lc-tips-off') !== '1'); } catch { /* storage blocked */ } }, []);
  const setTipsPref = (on: boolean) => { setTipsOn(on); if (!on) setTip(null); try { if (on) localStorage.removeItem('lc-tips-off'); else localStorage.setItem('lc-tips-off', '1'); } catch { /* storage blocked */ } };
  const offerTip = useCallback((id: string, text: string) => {
    if (!tipsOn) return;
    try {
      const seen = JSON.parse(localStorage.getItem('lc-tips-seen') ?? '[]') as string[];
      if (seen.includes(id) || localStorage.getItem(`lc-tip-lesson-${sessionId}`)) return;
      localStorage.setItem('lc-tips-seen', JSON.stringify([...seen, id]));
      localStorage.setItem(`lc-tip-lesson-${sessionId}`, id);
    } catch { return; }
    setTip({ id, text });
  }, [tipsOn, sessionId]);
  const rosterAll = useMemo(() => (testFlight ? [...roster, ...PRETEND_STUDENTS] : roster), [roster, testFlight]);
  // ── seats: nobody starts on the plane. Phones board as they join; the teacher boards students without a device. ──
  // boarded: class-list student id → when the teacher boarded them (kept for this lesson).
  const boardedKey = `lc-room-boarded-${sessionId}`;
  const [boarded, setBoarded] = useState<Record<string, number>>({});
  useEffect(() => {
    try {
      const b = JSON.parse(localStorage.getItem(boardedKey) ?? '{}');
      if (b && typeof b === 'object' && !Array.isArray(b)) setBoarded(Object.fromEntries(Object.entries(b).filter(([, v]) => typeof v === 'number')) as Record<string, number>);
    } catch { /* storage blocked */ }
  }, [boardedKey]);
  const saveBoarded = (next: Record<string, number>) => {
    try { localStorage.setItem(boardedKey, JSON.stringify(next)); } catch { /* storage blocked */ }
    return next;
  };
  const boardStudent = (studentId: string) => setBoarded((prev) => (prev[studentId] ? prev : saveBoarded({ ...prev, [studentId]: Date.now() })));
  const unboardStudent = (studentId: string) => setBoarded((prev) => { const next = { ...prev }; delete next[studentId]; return saveBoarded(next); });
  const allSeats = useMemo<DeckParticipant[]>(() => {
    // One seat per student: a phone (or a second device) for a class-list student uses that student's seat.
    const byStudent = new Map<string, DeckParticipant>();
    participants.forEach((p) => { if (p.student_id && !byStudent.has(p.student_id)) byStudent.set(p.student_id, p); });
    const phones = Array.from(byStudent.values()).concat(participants.filter((p) => !p.student_id));
    const onPhone = new Set(Array.from(byStudent.keys()));
    const noDevice: DeckParticipant[] = rosterAll
      .filter((r) => boarded[r.id] && !onPhone.has(r.id))
      .map((r) => ({
        id: `roster:${r.id}`, student_id: r.id, client_id: `roster:${r.id}`, display_name: r.name, avatar_seed: r.avatar_seed,
        joined_at: new Date(boarded[r.id]).toISOString(), deviceless: true,
      }));
    // Seats fill in the order students boarded.
    return [...phones, ...noDevice].sort((a, b) => a.joined_at.localeCompare(b.joined_at));
  }, [participants, rosterAll, boarded]);
  // Students without a device go to the session store, so turn-taking activities (Quick-fire) give them turns too
  const setDevicelessStudents = useSessionStore((s) => s.setDevicelessStudents);
  const devicelessKey = allSeats.filter((p) => p.deviceless).map((p) => p.student_id).join(',');
  useEffect(() => {
    setDevicelessStudents(allSeats.filter((p) => p.deviceless && p.student_id).map((p) => ({ id: p.student_id!, class_id: '', name: p.display_name, avatar_seed: p.avatar_seed ?? '', created_at: p.joined_at })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devicelessKey, setDevicelessStudents]);
  // Class-list students not on the plane yet (the + seat offers them).
  const notAboard = useMemo(() => rosterAll.filter((r) => !allSeats.some((p) => p.student_id === r.id)), [rosterAll, allSeats]);
  const [spotlight, setSpotlightId] = useState<string | null>(null);
  // Who has been heard this lesson (picked, spotlit, marked on their seat, or ticked in the private window). Only
  // the private window shows it: a list of quiet students never goes on the shared screen.
  const heardKey = `lc-heard:${sessionId}`;
  const [heardIds, setHeardIds] = useState<string[]>(() => {
    try { const v = JSON.parse(sessionStorage.getItem(`lc-heard:${sessionId}`) ?? '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; }
  });
  const setHeard = useCallback((id: string, heard = true) => {
    setHeardIds((ids) => {
      const next = heard ? (ids.includes(id) ? ids : [...ids, id]) : ids.filter((x) => x !== id);
      try { sessionStorage.setItem(heardKey, JSON.stringify(next)); } catch { /* private browsing */ }
      return next;
    });
  }, [heardKey]);
  useEffect(() => { if (spotlight) setHeard(spotlight); }, [spotlight, setHeard]);
  // Spotlight doubles as the game's "up next" student (the shell sidebar that
  // used to pick it is hidden in the room).
  const setSpotlight = useCallback((id: string | null) => {
    setSpotlightId(id);
    const p = id ? allSeats.find((x) => x.id === id) : null;
    const rosterId = p?.student_id ?? p?.client_id;
    if (rosterId) setCurrentStudent(rosterId);
  }, [allSeats, setCurrentStudent]);
  const [roulette, setRoulette] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // Test switch: ?descent=on jumps a flight to just before its descent, to preview the approach to a city (Fuji on
  // the way into Tokyo) without waiting for the end of class. Time moves on normally from there.
  const [descentTest, setDescentTest] = useState(false);
  const [issTest, setIssTest] = useState(false);
  const [skyTest, setSkyTest] = useState(false);
  // test switch: ?scenic=on shows the pyramids after the climb on any flight (the look for a landmark by the departure city)
  const [scenicTest, setScenicTest] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setScenicTest(q.get('scenic') === 'on');
    setDescentTest(q.get('descent') === 'on');
    // test switch: ?coast=on draws the real coastlines (off in classes until approved)
    if (q.get('coast') === 'on') setRealCoast(true);
    // test switch: ?iss=on sends the space station over shortly after take-off
    setIssTest(q.get('iss') === 'on');
    // test switch: ?sky=on shows tonight's sky things now (a planet, shooting stars, the northern lights, the moon card)
    setSkyTest(q.get('sky') === 'on');
  }, []);
  const [descentShift, setDescentShift] = useState(0);
  const rawClock = flightClock({ classStartAt, classMinutes, takeoffAt, now });
  useEffect(() => {
    if (!descentTest || descentShift || flightStage !== 'flying' || takeoffAt === null || rawClock.minutesLeft == null) return;
    setDescentShift(Math.max(0, (rawClock.minutesLeft - DESCENT_MINUTES - 0.4) * 60_000));
  }, [descentTest, descentShift, flightStage, takeoffAt, rawClock.minutesLeft]);
  const clock = descentShift ? flightClock({ classStartAt, classMinutes, takeoffAt, now: now + descentShift }) : rawClock;
  const { flightMs, routeT, minutesLeft } = clock;
  // Arrived (5 minutes before the end of class): the plane circles near the destination until you land.
  const holding = flightStage === 'flying' && clock.holding;
  const endsAtLabel = new Date(clock.endAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  // The descent: the last 5 minutes before arrival (so 10 before the end of class). The ground comes closer.
  const descending = flightStage === 'flying' && takeoffAt !== null && !holding && minutesLeft !== null && minutesLeft <= DESCENT_MINUTES;
  // stays low once landing begins (it went back up to cruise height, climbing into the clouds for the dive)
  const descentAltitude = holding || flightStage === 'landing' ? 0.25 : descending ? 1 - 0.75 * (1 - (minutesLeft ?? 0) / DESCENT_MINUTES) : 1;
  const nudgeClass = (delta: number) => {
    setClassMinutes((m) => Math.min(240, Math.max(15, m + delta)));
    flash(`Class now ends at ${new Date(clock.endAt + delta * 60_000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
  };
  const below = useMemo(() => overflightAt(origin, destination, routeT), [origin, destination, routeT]);
  // The land below, for topics taken from the flight (which Blue Mountains: the facts lookup needs the place).
  const flightWhere = regionOf(below.point) ?? undefined;
  // Landmark Quest step 2 (approved by the owner 20 Oct 2026): real landmarks the route passes stand in the scenery at
  // their real distance and side, in the descent too (they shrink with the camera there: Fuji on the way into Tokyo).
  // Niagara stays out until its drawing is good enough.
  const sceneryLandmarks = useMemo(() => {
    if (flightStage !== 'flying' || holding) return [];
    const heading = bearingDeg(below.point, greatCirclePoint(origin, destination, Math.min(1, routeT + 0.01)));
    return landmarksAhead(below.point, heading).filter((l) => l.kind !== 'niagara');
  }, [flightStage, holding, below.point, origin, destination, routeT]);
  // Real rivers and lakes under the plane (when switched on): looked up every 20 seconds of flight, cruise only.
  const [routeWaters, setRouteWaters] = useState<Waters | undefined>(undefined);
  const [routeCoast, setRouteCoast] = useState<Coast | undefined>(undefined);
  const [routeGround, setRouteGround] = useState<HighGround | undefined>(undefined);
  const watersStep = Math.floor(routeT * 400);
  useEffect(() => {
    if (!(realWaters() || realCoast() || realRelief()) || flightStage !== 'flying' || descending || holding) return;
    let live = true;
    const heading = bearingDeg(below.point, greatCirclePoint(origin, destination, Math.min(1, routeT + 0.01)));
    void watersAhead(below.point, heading).then((w) => { if (live) setRouteWaters(w); }).catch(() => {});
    if (realCoast()) void coastAhead(below.point, heading).then((c) => { if (live) setRouteCoast(c); }).catch(() => {});
    if (realRelief()) void highGroundAhead(below.point, heading).then((g) => { if (live) setRouteGround(g); }).catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watersStep, flightStage, descending, holding]);
  // A landmark right by the departure city (Giza from Cairo): the windscreen shows it after the climb, slowly
  const scenicLandmark = useMemo(() => (origin.id === destination.id ? null : drawnLandmarkNear(origin, bearingDeg(origin, destination)) ?? (scenicTest ? { id: 'pyramids', kind: 'pyramids' as const, name: 'the Pyramids of Giza', side: 'right' as const } : null)), [origin, destination, scenicTest]);
  // ...and one right by the arrival city (Fuji coming into Tokyo): shown slowly once the descent starts
  const arrivalLandmark = useMemo(() => (origin.id === destination.id ? null : drawnLandmarkNear(destination, bearingDeg(origin, destination))), [origin, destination]);
  const landmarkKey = sceneryLandmarks.map((l) => l.id).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableLandmarks = useMemo(() => sceneryLandmarks, [landmarkKey]);
  // Country and nearby big city under the plane (outlines load lazily).
  const [countries, setCountries] = useState<CountryShape[] | null>(null);
  useEffect(() => { void loadCountries().then(setCountries).catch(() => {}); }, []);
  // The way the plane is heading along the route, so "on your left" means the plane's left.
  const heading = useMemo(() => {
    if (routeT < 0.99) return bearingDeg(below.point, greatCirclePoint(origin, destination, Math.min(1, routeT + 0.01)));
    return bearingDeg(greatCirclePoint(origin, destination, Math.max(0, routeT - 0.01)), below.point);
  }, [origin, destination, routeT, below.point]);
  // Big cities within 150 km, nearest first: the line of text names the nearest, and the windscreen draws their lights.
  const around = useMemo(() => citiesAround(below.point, heading, 150), [below.point, heading]);
  // Flying west about as fast as the sun appears to move: the sun hangs still while the ground passes into evening.
  const chasing = useMemo(
    () => flightStage === 'flying' && !holding && sunChase(below.point, greatCirclePoint(origin, destination, Math.min(1, routeT + 120_000 / flightMs)), new Date(now), 120_000),
    [flightStage, holding, below.point, origin, destination, routeT, flightMs, now],
  );
  const countryNow = useMemo(() => (countries ? countryAt(countries, below.point) : null), [countries, below.point]);
  const voteCards = useMemo<VoteCityCard[]>(() => {
    if (!cityVote) return [];
    const exp = landingRecord?.expedition ?? null;
    const km = (a: LatLng, b: LatLng) => {
      const r = Math.PI / 180;
      const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
      return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
    };
    return reachable.map((c) => {
      const owned = new Set((landingRecord?.souvenirShelf ?? []).find((x) => x.destinationId === c.id)?.items.filter((i) => i.owned).map((i) => i.id) ?? []);
      const next = citySouvenirs(c.id).find((sv) => !owned.has(sv.id)) ?? null;
      let strategy: string | null = null;
      if (exp && !exp.paused && exp.done < exp.needed) {
        if (exp.remaining.includes(c.city)) strategy = `Stop ${exp.done + 1} of ${exp.needed} on your expedition`;
        else {
          const target = exp.remaining.map((n) => SCENE_CITIES.find((x) => x.city === n)).find((x) => !!x);
          if (target && km(c, target) < km(origin, target) - 500) strategy = `Gets you closer to ${target.city}`;
        }
      }
      return {
        id: c.id,
        city: c.city,
        onTheWay: routePreview(origin, c, countries, 60).filter((st) => !st.text.startsWith('Land in')).slice(0, 2).map((st) => st.text.replace(/^(Cross into|Over|Fly over) /, '')),
        newStamp: !visitedIds.has(c.id),
        souvenir: next?.name ?? null,
        souvenirRare: next?.earn.type === 'rare',
        strategy,
      };
    });
  }, [cityVote, reachable, origin, countries, visitedIds, landingRecord]);
  // Today's route, shown to the class on the route map before and during the flight.
  const preview = useMemo(() => routePreview(origin, destination, countries, flightMs / 60_000), [origin, destination, countries, flightMs]);
  const minutesFlown = clock.minutesFlown;
  // "Look outside" moments (Phase 3.3): at most 3 per flight, each waits for the teacher's tap.
  const [naturalEvents, setNaturalEvents] = useState<NaturalEvent[]>([]);
  useEffect(() => {
    if (flightStage !== 'flying' || isMockMode()) return;
    let live = true;
    fetch('/api/live-room/natural-events').then((r) => (r.ok ? r.json() : { events: [] })).then((d: { events?: NaturalEvent[] }) => { if (live) setNaturalEvents(d.events ?? []); }).catch(() => {});
    return () => { live = false; };
  }, [flightStage]);
  // Real natural events (NASA's list) within sight of the plane: smoke, a volcano's ash, a storm cloud in the scenery
  // (when switched on). Kept from 150 km ahead until well behind, so one passed is not dropped while still in view.
  const sceneryEvents = useMemo<SceneEvent[]>(() => {
    if (!realEvents() || flightStage !== 'flying' || descending || holding || !naturalEvents.length) return [];
    const heading = bearingDeg(below.point, greatCirclePoint(origin, destination, Math.min(1, routeT + 0.01)));
    const out: SceneEvent[] = [];
    for (const e of naturalEvents) {
      const kind = eventKind(e.category);
      if (!kind) continue;
      const [ahead, lateral] = toFrame(below.point, heading, [e.lng, e.lat]);
      if (ahead > -40 && ahead < 150 && Math.abs(lateral) < 110) out.push({ id: e.id, kind, ahead, lateral });
    }
    return out.slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watersStep, flightStage, descending, holding, naturalEvents]);
  const eventKey = sceneryEvents.map((e) => e.id).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableEvents = useMemo(() => sceneryEvents, [eventKey]);
  const moments = useMemo<Moment[]>(
    () => (flightStage === 'flying' ? planMoments({ origin, destination, flightMinutes: flightMs / 60_000, stops: preview, events: naturalEvents }) : []),
    // Planned per flight: the clock's small changes don't move the moments around.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flightStage, origin.id, destination.id, Math.round(flightMs / 300_000), countries, naturalEvents],
  );
  // Today's flight for the World Quiz "Our flight" round: the cities, countries crossed, places passed, heading
  useEffect(() => {
    if (origin.id === destination.id) { setFlightLog(null); return; }
    setFlightLog({
      origin: { name: origin.city, country: getDestinationById(origin.id)?.country ?? '', lat: origin.lat, lng: origin.lng },
      destination: { name: destination.city, country: getDestinationById(destination.id)?.country ?? '', lat: destination.lat, lng: destination.lng },
      countries: preview.filter((s) => s.crossing).map((s) => s.text.replace(/^Cross into /, '')),
      places: moments.filter((m) => m.kind === 'landmark' || m.kind === 'place' || m.kind === 'crossing').map((m) => m.title),
      heading: bearingDeg(origin, destination),
    });
  }, [origin, destination, preview, moments]);
  const [momentsShown, setMomentsShown] = useState<string[]>([]);
  const [momentCard, setMomentCard] = useState<{ moment: Moment; facts: string[]; picture: FreePicture | null; loading: boolean } | null>(null);
  const momentUpcoming = minutesFlown == null ? null : moments.find((m) => !momentsShown.includes(m.id) && m.at - minutesFlown > 0 && m.at - minutesFlown <= 3) ?? null;
  const momentDue = minutesFlown == null ? null : moments.find((m) => !momentsShown.includes(m.id) && minutesFlown >= m.at && minutesFlown <= m.at + 8) ?? null;
  const openMoment = (m: Moment) => {
    setMomentsShown((x) => [...x, m.id]);
    setMomentCard({ moment: m, facts: m.fact ? [m.fact] : [], picture: null, loading: true });
    void fetch('/api/live-room/moment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: m.title, kind: m.kind, ...(lensRef.current ? { lens: lensRef.current, where: m.where } : {}) }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { facts?: string[]; picture?: FreePicture | null; question?: string } | null) => setMomentCard((c) => (c && c.moment.id === m.id
        ? { ...c, loading: false, picture: d?.picture ?? null, ...(d?.question ? { moment: { ...c.moment, question: d.question } } : {}), facts: Array.from(new Set([...(d?.question || !m.fact ? [] : [m.fact]), ...(d?.facts ?? [])])).slice(0, 3) }
        : c)))
      .catch(() => setMomentCard((c) => (c && c.moment.id === m.id ? { ...c, loading: false } : c)));
  };
  // The next thing on Today's route (never a border into the country the plane is already over).
  const nextStop = minutesFlown == null ? null : preview.find((s) => s.at > minutesFlown && !s.text.startsWith('Land in') && !(countryNow && s.text === `Cross into ${countryNow}`)) ?? null;
  const place = useMemo(() => {
    const nearest = around[0];
    const region = below.terrain !== 'farmland' && below.terrain !== 'ocean' ? below.name : null;
    const named = featureNear(below.point);
    // A city right under the plane is "below"; one further off is a city you can see (or not) to the side, so it
    // comes after the country and says how far away it is ("Prague is 99 km off to the left").
    const overText = nearest && nearest.km < 20 ? `over ${nearest.name}` : null;
    const offText = nearest && nearest.km >= 20
      ? `${nearest.name} is ${nearest.km} km ${sideOf(nearest) === 'ahead' ? 'ahead' : `off to the ${sideOf(nearest)}`}`
      : null;
    // Parts of "Below us: …", most specific first; the country follows (or a border crossing), then a distant city.
    const parts = [named ? featureText(named) : region, overText].filter((p): p is string => !!p);
    const overCity = nearest && nearest.km < 30 ? nearest.name : null;
    // Each part of the line as something the class can learn about (tap it to make it the topic).
    const items: Array<{ text: string; topic: string | null; about?: string }> = [
      ...(named ? [{ text: featureText(named), topic: named.name }] : region ? [{ text: region, topic: region }] : []),
      ...(overText && nearest ? [{ text: overText, topic: nearest.name }] : []),
    ];
    return { parts, items, offText, offTopic: offText && nearest ? nearest.name : null, country: countryNow, fallback: below.name, overCity, overTown: !overCity && below.terrain === 'farmland' ? townNear(below.point) : null };
  }, [around, countryNow, below]);
  // Crossing a border shows in the same line for a little while: no pop-up, no interruption.
  const lastCountry = useRef<string | null>(null);
  const [crossing, setCrossing] = useState<{ name: string; until: number } | null>(null);
  useEffect(() => {
    if (countryNow && lastCountry.current && countryNow !== lastCountry.current) setCrossing({ name: countryNow, until: Date.now() + 14_000 });
    lastCountry.current = countryNow; // null over sea, so reaching a coast later is not "crossing" anything
  }, [countryNow]);
  // The ground under the windscreen changes only once the new kind has held for a while: small towns, patches of
  // forest and land-cover edges flipped it back and forth every few seconds
  const groundNow = { terrain: (place.overCity || place.overTown ? 'farmland' : below.terrain) as typeof below.terrain, region: place.overCity ? `city:${place.overCity}|${regionOf(below.point) ?? ''}` : place.overTown ? `town:${place.overTown}|${regionOf(below.point) ?? ''}` : below.terrain === 'farmland' || below.terrain === 'hills' ? regionOf(below.point) : below.terrain === 'mountains' ? `${regionOf(below.point) ?? ''}${Math.abs(below.point.lat) < 23.5 ? '|tropics' : ''}` : null };
  const groundKey = `${groundNow.terrain}|${groundNow.region ?? ''}`;
  const [steadyGround, setSteadyGround] = useState(groundNow);
  const groundSince = useRef<{ key: string; at: number }>({ key: groundKey, at: Date.now() });
  useEffect(() => {
    if (groundSince.current.key !== groundKey) groundSince.current = { key: groundKey, at: Date.now() };
    const steadyKey = `${steadyGround.terrain}|${steadyGround.region ?? ''}`;
    if (groundKey === steadyKey) return;
    // land to sea (or back) follows sooner: the coast is real and should not lag far behind
    // arriving over a city (or holding over the destination) shows it almost at once
    const intoCity = (groundNow.region ?? '').startsWith('city:') || holding;
    const hold = intoCity ? 3_000 : groundNow.terrain === 'ocean' || steadyGround.terrain === 'ocean' ? 12_000 : 45_000;
    const wait = Math.max(0, hold - (Date.now() - groundSince.current.at));
    const t = setTimeout(() => { if (groundSince.current.key === groundKey) setSteadyGround(groundNow); }, wait);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groundKey, steadyGround, holding]);
  const crossingNow = crossing && now < crossing.until ? crossing : null;
  const belowItems: Array<{ text: string; topic: string | null; about?: string }> = [
    ...(crossingNow ? [{ text: `crossing into ${crossingNow.name}`, topic: crossingNow.name }] : []),
    ...place.items,
    ...(!crossingNow && place.country ? [{ text: place.country, topic: place.country }] : []),
    ...(place.offText ? [{ text: place.offText, topic: place.offTopic }] : []),
  ];
  if (belowItems.length === 0 && place.fallback) belowItems.push({ text: place.fallback, topic: place.fallback });
  // The cities the windscreen draws as lights in the distance (size is a stable stand-in, as no population is recorded).
  const distantCities = useMemo(
    () => around.map((c) => ({ id: c.id, ahead: c.ahead, lateral: c.lateral, size: 9 + (c.name.length * 7) % 12 })),
    [around],
  );

  // Real weather under the plane (every ten minutes, or when it moves on a
  // degree); World Flight's climate weather if the lookup fails.
  const wxKey = `${Math.round(below.point.lat)}:${Math.round(below.point.lng)}`;
  const [liveWx, setLiveWx] = useState<LiveWeather | null>(null);
  useEffect(() => {
    let cancelled = false;
    const { lat, lng } = below.point;
    const load = () => {
      fetch(`/api/live-room/weather?lat=${lat.toFixed(2)}&lng=${lng.toFixed(2)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: LiveWeather | null) => { if (!cancelled && d?.condition) setLiveWx(d); })
        // a failed lookup keeps the last real weather (dropping it switched to a made-up one mid-flight)
        .catch(() => {});
    };
    load();
    const t = window.setInterval(load, 10 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(t); };
    // Only when the plane has moved on (the key), not on every tick of its position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wxKey]);

  // The sky follows the real sun over the ground below (the destination once landing).
  const skyNowRef = useRef<{ timeOfDay: string; weather: string }>({ timeOfDay: 'day', weather: 'clear' });
  const skyNow = useMemo(() => {
    const at = flightStage === 'landing' ? destination : below.point;
    const s = sunPosition(at, new Date(now));
    const heading = bearingDeg(at, destination.lat === at.lat && destination.lng === at.lng ? { lat: at.lat, lng: at.lng + 1 } : destination);
    const timeOfDay: TimeOfDay = s.elevation < -6 ? 'night' : s.elevation < 8 ? (s.azimuth < 180 ? 'dawn' : 'dusk') : 'day';
    return { sun: { ...s, heading }, moon: moonPosition(at, new Date(now)), timeOfDay, clock: solarClock(at.lng, new Date(now)) };
  }, [below.point, destination, flightStage, now]);
  // The International Space Station passing over (Oct 2026): checked every minute of the cruise; a pass shows only
  // when it would really be seen: within about 2,000 km, in sunlight itself, under a dark or twilight sky here.
  const [issPass, setIssPass] = useState<{ start: number; side: 'left' | 'right'; where: string } | null>(null);
  const issMinute = flightStage === 'flying' && !descending && !holding ? Math.floor(now / 60_000) : null;
  useEffect(() => {
    if (issMinute == null) return;
    if (issPass && Date.now() - issPass.start < 25 * 60_000) return; // one pass at a time, then a long gap
    if (issTest && !issPass && takeoffAt !== null && Date.now() - takeoffAt > 20_000) {
      setIssPass({ start: Date.now(), side: 'left', where: '800 km away, 420 km up' });
      return;
    }
    if (skyNow.timeOfDay === 'day') return;
    let live = true;
    const here = below.point;
    void fetch('/api/live-room/iss').then((r) => (r.ok ? r.json() : null)).then((d: { lat: number; lng: number; altitudeKm: number; sunlit: boolean } | null) => {
      if (!live || !d || !d.sunlit) return;
      const km = distanceBetweenCoordsKm(here, d);
      if (km > 2000) return;
      const rel = ((bearingDeg(here, d) - skyNow.sun.heading + 540) % 360) - 180;
      setIssPass({ start: Date.now(), side: rel < 0 ? 'left' : 'right', where: `${Math.round(km / 50) * 50} km away, ${d.altitudeKm} km up` });
    }).catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issMinute, issTest]);
  const issActive = issPass && now - issPass.start < ISS_PASS_MS ? issPass : null;
  // Landmark Quest photo mode (docs/photo-mode-plan.md): the scenery says when a landmark is in good view; the teacher
  // takes the photo; a camera moment and a print on the shared screen; the photo kept in this lesson's cargo
  const [photoChance, setPhotoChance] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ image: string; caption: string; name: string } | null>(null);
  const photoName = useRef<string>('');
  const photoId = useRef<string>('');
  const albumRoute = useRef({ from: '', to: '' });
  albumRoute.current = { from: origin.city, to: destination.city };
  useEffect(() => {
    const onChance = (e: Event) => setPhotoChance((e as CustomEvent<{ id: string | null }>).detail?.id ?? null);
    const onTaken = (e: Event) => {
      const image = (e as CustomEvent<{ image: string | null }>).detail?.image;
      if (!image) return;
      const name = photoName.current;
      const when = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
      const caption = `${name} · ${when} · ${skyNowRef.current.timeOfDay} · ${skyNowRef.current.weather}`;
      setPhoto({ image, caption, name });
      const id = `photo-${Date.now().toString(36)}`;
      addItem(sessionId, { id, kind: 'image', title: `Our photo: ${caption}`, url: image, imageUrl: image, publisher: 'Our flight' } as Parameters<typeof addItem>[1]);
      // Landmark Album: kept for the class (migration 068); quietly skipped if the album is not ready yet
      if (!isMockMode() && photoId.current) {
        void fetch(`/api/session/${sessionId}/album`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landmarkId: photoId.current, image, timeOfDay: skyNowRef.current.timeOfDay, weather: skyNowRef.current.weather, fromCity: albumRoute.current.from, toCity: albumRoute.current.to }),
        }).then((r) => (r.ok ? r.json() : null)).then((d: { rare?: boolean } | null) => { if (d) setToast(d.rare ? `Rare photo! ${name} is in the class album` : `${name} is in the class album`); }).catch(() => {});
      }
    };
    window.addEventListener('lc-photo-chance', onChance);
    window.addEventListener('lc-photo-taken', onTaken);
    return () => { window.removeEventListener('lc-photo-chance', onChance); window.removeEventListener('lc-photo-taken', onTaken); };
  }, [addItem, sessionId]);
  const photoLandmark = photoChance ? LANDMARK_CATALOG.find((l) => l.id === photoChance) ?? null : null;
  const takePhoto = () => {
    if (!photoLandmark) return;
    photoName.current = photoLandmark.name;
    photoId.current = photoLandmark.id;
    window.dispatchEvent(new Event('lc-take-photo'));
  };
  // Window selfies (Oct 2026): while a landmark is in good view, the phones are told, so each student can take one
  const windowChannel = useRef<ReturnType<typeof openWindowViewChannel> | null>(null);
  useEffect(() => {
    if (isMockMode()) return;
    windowChannel.current = openWindowViewChannel(sessionId);
    return () => { windowChannel.current?.close(); windowChannel.current = null; };
  }, [sessionId]);
  const windowView = useMemo<WindowView | null>(() => {
    const kind = photoLandmark ? drawnKindOf(photoLandmark.id) : null;
    if (!photoLandmark || !kind) return null;
    return { landmarkId: photoLandmark.id, name: photoLandmark.name, kind, terrain: steadyGround.terrain, region: steadyGround.region ?? null, timeOfDay: skyNow.timeOfDay, from: origin.city, to: destination.city };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoLandmark?.id]);
  useEffect(() => {
    const ch = windowChannel.current;
    if (!ch) return;
    ch.send(windowView);
    if (!windowView) return;
    const beat = setInterval(() => ch.send(windowView), WINDOW_VIEW_HEARTBEAT_MS);
    return () => clearInterval(beat);
  }, [windowView]);
  // Real things happening on the journey (Oct 2026), each a "Look" moment the class can open: another real plane, the
  // northern or southern lights, a recent earthquake nearby, a holiday in the country below, a clock change below,
  // sunrise or sunset, tonight's moon, a bright planet, a meteor shower. One label at a time; each only once a flight.
  type LiveMoment = { id: string; title: string; where: string; fact?: string; question: string; until: number };
  const [liveMoments, setLiveMoments] = useState<LiveMoment[]>([]);
  const liveSeen = useRef(new Set<string>());
  const addLive = useCallback((m: Omit<LiveMoment, 'until'>, minutes = 4) => {
    if (liveSeen.current.has(m.id)) return;
    liveSeen.current.add(m.id);
    setLiveMoments((xs) => [...xs, { ...m, until: Date.now() + minutes * 60_000 }]);
  }, []);
  const cruising = flightStage === 'flying' && !holding && takeoffAt !== null;
  const [nearby, setNearby] = useState<{ plane: { callsign: string; airline: string | null; km: number; bearing: number; altitudeM: number } | null; kp: number | null } | null>(null);
  const nearbyStep = cruising ? Math.floor(now / 180_000) : null;
  useEffect(() => {
    if (nearbyStep == null) return;
    let live = true;
    const here = below.point;
    // Animals below (Codex's checked data): a migration in season right here first; otherwise, now and then, an animal
    // that lives in the region or country below
    const migration = migrationsNear(here, new Date(), 120)[0];
    if (migration) addLive({ id: `mig:${migration.id}`, title: migration.animal, where: 'below us right now', fact: migration.below, question: 'Why do you think these animals travel so far?' }, 6);
    else if (nearbyStep % 4 === 0) {
      // over the sea only the sea's own animals (a land animal over open water: a tarsier off the Philippines)
      for (const name of below.terrain === 'ocean' ? [below.name] : [below.name, countryNow]) {
        const list = name ? animalsOf(name) : [];
        if (!list.length) continue;
        const a = list[nearbyStep % list.length];
        addLive({ id: `res:${name}`, title: a.animal, where: `lives in ${name!.replace(/^the /, '')}`, fact: a.fact, question: `Would you like to see a ${a.animal.toLowerCase()} in the wild? What would you do?` }, 5);
        break;
      }
    }
    const q = new URLSearchParams({ lat: here.lat.toFixed(2), lng: here.lng.toFixed(2), country: countryNow ?? '' });
    void fetch(`/api/live-room/nearby?${q.toString()}`).then((r) => (r.ok ? r.json() : null)).then((d: {
      plane: { callsign: string; airline: string | null; km: number; bearing: number; altitudeM: number } | null; kp: number | null;
      quake: { magnitude: number; place: string; hoursAgo: number; km: number; big: boolean } | null; holiday: { name: string; localName: string; country: string } | null;
    } | null) => {
      if (!live || !d) return;
      setNearby({ plane: d.plane, kp: d.kp });
      if (d.plane) {
        const side = sideOfSky(d.plane.bearing, skyNow.sun.heading);
        addLive({ id: `plane:${d.plane.callsign}`, title: d.plane.airline ?? 'another plane', where: `flight ${d.plane.callsign}, ${d.plane.km} km away ${side}, ${d.plane.altitudeM.toLocaleString()} m up`, fact: d.plane.airline ? `A real ${d.plane.airline} flight is passing us right now.` : 'A real plane is passing us right now.', question: 'Where do you think that plane is going? Who might be on it?' }, 3);
      }
      if (d.quake) {
        const ago = d.quake.hoursAgo < 48 ? `${d.quake.hoursAgo} hours ago` : `${Math.round(d.quake.hoursAgo / 24)} days ago`;
        addLive({ id: `quake:${d.quake.place}`, title: 'earthquakes', where: `magnitude ${d.quake.magnitude}, ${d.quake.place}, ${ago}${d.quake.big ? ' (in the news)' : ''}`, fact: d.quake.big ? 'A strong earthquake: scientists, rescue teams and neighbours work together after one like this.' : 'Scientists around the world measure earthquakes as they happen.', question: d.quake.big ? 'How can people help each other after a big earthquake?' : 'Why do you think some places have more earthquakes than others?' }, d.quake.big ? 6 : 4);
      }
      if (d.holiday) addLive({ id: `holiday:${d.holiday.name}`, title: d.holiday.name, where: `a public holiday in ${d.holiday.country} today${d.holiday.localName !== d.holiday.name ? ` (${d.holiday.localName})` : ''}`, question: 'What holidays do you celebrate? What do you do on them?' }, 6);
    }).catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyStep]);
  // The night sky, checked every minute: the brightest planet, a meteor shower, the lights near the poles, the moon
  const skyMinute = cruising ? Math.floor(now / 60_000) : null;
  const nightSky = useMemo(() => {
    if (skyMinute == null) return null;
    const date = new Date(now);
    const planet = brightPlanet(below.point, date, skyNow.sun.elevation);
    const shower = skyNow.sun.elevation < -10 ? activeShower(date) : null;
    // geomagnetic latitude (the pole is near 80.7 N, 72.7 W): the lights reach further from the pole as Kp rises
    const r = Math.PI / 180, pl = 80.7 * r, pg = -72.7 * r, la = below.point.lat * r, lo = below.point.lng * r;
    const mag = Math.asin(Math.sin(la) * Math.sin(pl) + Math.cos(la) * Math.cos(pl) * Math.cos(lo - pg)) / r;
    const kp = nearby?.kp ?? null;
    const aurora = kp !== null && skyNow.sun.elevation < -10 && Math.abs(mag) >= 66 - 2.6 * kp;
    if (skyTest) return { planet: planet ?? { name: 'Venus' as const, elevation: 14, azimuth: (skyNow.sun.heading + 335) % 360 }, shower: shower ?? METEOR_SHOWERS[3], aurora: true, north: mag > 0 };
    return { planet, shower, aurora, north: mag > 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skyMinute, nearby?.kp, skyTest]);
  useEffect(() => {
    if (!nightSky) return;
    const { planet, shower, aurora, north } = nightSky;
    // Only what the class can see in the window right now (a planet "too high to see" was no use): the same limits the
    // sky drawing uses; later in the flight, when it comes into view, it is offered then
    const relOf = (az: number) => ((az - skyNow.sun.heading + 540) % 360) - 180;
    const planetInView = !!planet && Math.abs(relOf(planet.azimuth)) <= 48 && planet.elevation <= 55;
    if (planet && planetInView) addLive({ id: `planet:${planet.name}`, title: planet.name, where: `the bright "star" ${sideOfSky(planet.azimuth, skyNow.sun.heading)}`, fact: 'It is a planet, not a star: it shines with reflected sunlight and does not twinkle.', question: 'Have you ever seen a planet in the night sky? How could you tell it from a star?' });
    if (shower) addLive({ id: `meteors:${shower.name}`, title: shower.name, where: `a meteor shower tonight: up to ${shower.perHour} shooting stars an hour`, fact: `The shooting stars are tiny pieces left behind by ${shower.from}.`, question: 'Have you ever seen a shooting star? What would you wish for?' }, 5);
    if (aurora) addLive({ id: 'aurora', title: north ? 'the northern lights' : 'the southern lights', where: 'in the sky tonight', fact: 'Particles from the sun light up the air high above the Earth.', question: 'Would you like to see the lights in real life? Where would you go?' }, 6);
    if (skyNow.timeOfDay === 'night' && skyNow.moon.elevation > 5 && skyNow.moon.elevation < 38 && Math.abs(relOf(skyNow.moon.azimuth)) < 65) {
      addLive({ id: 'moon', title: 'the Moon', where: `tonight it is ${moonPhaseName(skyNow.moon.illumination, skyNow.moon.waxing)}, ${Math.round(skyNow.moon.illumination * 100)}% lit`, fact: 'The Moon does not make light: we see the part lit by the sun.', question: 'What shape was the Moon the last time you saw it? Where were you?' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nightSky]);
  // Sunrise or sunset during the flight, and the clocks changing in the land below
  // Only a real, gradual crossing near the horizon counts: a jump in the plane's position (the descent test, the
  // landing view) once announced a sunset in the middle of the night
  const sunElev = Math.round(skyNow.sun.elevation * 10) / 10;
  const lastSunElev = useRef<number | null>(null);
  useEffect(() => {
    if (!cruising) { lastSunElev.current = null; return; }
    const prev = lastSunElev.current;
    lastSunElev.current = sunElev;
    if (prev === null || Math.abs(sunElev - prev) > 1.5 || Math.abs(sunElev) > 2.5) return;
    const was = prev > -0.8, up = sunElev > -0.8;
    if (was === up) return;
    addLive({ id: `sun:${up ? 'rise' : 'set'}:${Math.floor(Date.now() / 3_600_000)}`, title: up ? 'sunrise' : 'sunset', where: up ? 'the sun is coming up below us' : 'the sun is going down below us', fact: 'From a plane you can see it earlier and later than from the ground.', question: up ? 'Are you a morning person or a night person? Why?' : 'What do you like to do in the evening?' });
  }, [cruising, sunElev, addLive]);
  const lastOffset = useRef<number | null>(null);
  useEffect(() => {
    const off = liveWx?.utcOffsetSeconds;
    if (off === undefined) return;
    const diffH = lastOffset.current === null ? 0 : (off - lastOffset.current) / 3600;
    if (cruising && lastOffset.current !== null && off !== lastOffset.current && lastOffset.current !== 0 && off !== 0 && Math.abs(diffH) <= 3) {
      const diff = diffH;
      addLive({ id: `tz:${off}`, title: 'time zones', where: `the clocks below just changed: it is now ${offsetClock(off, new Date())} there (${diff > 0 ? '+' : ''}${diff} h)`, question: 'What time is it now where your family or friends live? What are they doing?' });
    }
    lastOffset.current = off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveWx?.utcOffsetSeconds]);
  const liveNow = liveMoments.find((m) => m.until > now) ?? null;
  skyNowRef.current = { timeOfDay: skyNow.timeOfDay, weather: (liveWx?.label ?? 'clear').toLowerCase() };
  const realPlane = nearby?.plane ? { id: nearby.plane.callsign, side: (sideOfSky(nearby.plane.bearing, skyNow.sun.heading) === 'on our left' ? 'left' : 'right') as 'left' | 'right', near: nearby.plane.km < 40 } : null;
  const [catalogueState, setCatalogueState] = useState({ query: '', category: null as string | null, favourites: [] as string[], recent: [] as string[] });
  // Each class keeps its favourites and recent activities between lessons (on this computer).
  const quickBarKey = classId ? `lc-class-quickbar-${classId}` : null;
  // A state (not a ref): saving waits for the render that already holds the loaded lists.
  const [quickBarLoaded, setQuickBarLoaded] = useState(false);
  useEffect(() => {
    if (!quickBarKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(quickBarKey) ?? 'null') as { favourites?: unknown; recent?: unknown } | null;
      const list = (v: unknown) => (Array.isArray(v) ? v.filter((k): k is string => typeof k === 'string').slice(0, 12) : []);
      if (saved) setCatalogueState((c) => ({ ...c, favourites: list(saved.favourites), recent: list(saved.recent).slice(0, 6) }));
    } catch { /* storage blocked */ }
    setQuickBarLoaded(true);
  }, [quickBarKey]);
  useEffect(() => {
    if (!quickBarKey || !quickBarLoaded) return;
    try { localStorage.setItem(quickBarKey, JSON.stringify({ favourites: catalogueState.favourites, recent: catalogueState.recent })); } catch { /* storage blocked */ }
  }, [quickBarKey, quickBarLoaded, catalogueState.favourites, catalogueState.recent]);
  const launchedAt = useRef<number>(0);
  const lastView = useRef<DeckView>('boarding');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const flash = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((t) => (t === text ? null : t)), 2600);
  }, []);

  // Running module ⇄ Game view.
  useEffect(() => {
    if (runningKey) {
      launchedAt.current = Date.now();
      setView((v) => {
        if (v !== 'game') lastView.current = v;
        return 'game';
      });
    } else {
      setView((v) => (v === 'game' ? (lastView.current === 'game' ? 'talk' : lastView.current) : v));
    }
  }, [runningKey]);

  const switchView = (v: DeckView) => {
    if (v !== 'game') lastView.current = v;
    setView(v);
  };

  // ── catalogue ────────────────────────────────────────────────────────────
  // "Can this class do this?": aboard now, or the class list before anyone boards.
  const fitStudents = Math.max(allSeats.length, rosterCount);
  const fitCtx = useMemo(() => ({ students: fitStudents, screens: classScreens }), [fitStudents, classScreens]);
  const catalogue = useMemo<CatalogueEntry[]>(
    () => [
      ...games.map((g) => ({ key: g.key, name: g.name, description: g.description, category: g.category, kind: 'game' as const, readiness: 'ready' as const, minutes: g.estimatedMinutes, deviceFree: g.deviceFree, scored: true, minStudents: g.minStudents })),
      ...activities.map((a) => ({ key: a.key, name: a.name, description: a.description, category: a.category, kind: 'activity' as const, readiness: 'ready' as const, minutes: a.estimatedMinutes, deviceFree: a.deviceFree, minStudents: a.minStudents })),
    ].map((e) => ({ ...e, marks: classFitMarks({ minStudents: e.minStudents ?? 1, deviceFree: !!e.deviceFree }, fitCtx) })),
    [games, activities, fitCtx],
  );
  const categories = useMemo(() => Array.from(new Set(catalogue.map((c) => c.category))), [catalogue]);
  const stamps = useMemo(() => {
    // Favourites first (the teacher chose them), then this class's recent activities, then the defaults.
    const keys = [...catalogueState.favourites, ...catalogueState.recent, ...(todayType ? TYPE_STAMPS[todayType] : DEFAULT_STAMPS)];
    const list = Array.from(new Set(keys)).map((k) => catalogue.find((c) => c.key === k)).filter((c): c is CatalogueEntry => !!c);
    // Fewer than 3 that this class can do (e.g. 1-on-1, or no phones): good fits join the bar, marked ones stay.
    const asFit = (c: CatalogueEntry) => ({ ...c, minStudents: c.minStudents ?? 1, deviceFree: !!c.deviceFree });
    return withFallback(list.map(asFit), catalogue.map(asFit), fitCtx);
  }, [catalogue, catalogueState.recent, catalogueState.favourites, todayType, fitCtx]);

  const launch = useCallback((key: string, sourceItem: RoomItem | null) => {
    if (sourceItem) {
      setSourceMaterial(roomItemToSource(sourceItem));
      setCustomTopic(sourceItem.title.slice(0, 120));
    } else {
      setSourceMaterial(null);
    }
    setCatalogueState((c) => ({ ...c, recent: [key, ...c.recent.filter((k) => k !== key)].slice(0, 6) }));
    setPanel(null);
    const entry = catalogue.find((c) => c.key === key);
    recordActivity(entry?.name ?? getActivity(key)?.name ?? key);
    // Phones show "Get ready: <name>" at once, while the content generates.
    if (entry) {
      void fetch('/api/session/room-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name: entry.name }),
      }).catch(() => {});
    }
    flash(`Captain's announcement: ${entry?.name ?? getActivity(key)?.name ?? 'Activity'}${sourceItem ? ` from "${sourceItem.title}"` : ''}, boarding now`);
    const game = games.find((g) => g.key === key);
    if (game) return onLaunchGame(game);
    // Planner-only activities (e.g. Video Player's comprehension check) still launch from an item.
    const activity = activities.find((a) => a.key === key) ?? getActivity(key);
    if (activity) onLaunchActivity(activity);
  }, [catalogue, games, activities, onLaunchGame, onLaunchActivity, setSourceMaterial, setCustomTopic, flash, sessionId, recordActivity]);

  const focused = material.find((m) => m.id === focusId) ?? null;
  const roomChannelRef = useRef<BroadcastChannel | null>(null);
  const focusedTitleRef = useRef<string | null>(null);
  focusedTitleRef.current = focused ? focused.title.slice(0, 120) : null;

  // ── Focus: whatever the class is talking about right now ─────────────────
  // Any topic (typed, a student's question, a Talk prompt) becomes a 'note'
  // cargo item, so it grounds activities exactly like found material does.
  const updateItem = useLiveRoomStore((s) => s.update);
  const [briefs, setBriefs] = useState<Record<string, FocusBrief | 'loading' | 'failed'>>({});
  // Big idea or Deep dive: always the teacher's choice. Changing it re-briefs the topic.
  const depth = useFocusBus((s) => s.depth);
  const setDepth = useFocusBus((s) => s.setDepth);
  const [endingAdded, setEndingAdded] = useState<Record<string, boolean>>({});
  const [focusTrail, setFocusTrail] = useState<string[]>([]);
  // Where a flight topic is (its place below the plane), kept per topic for the facts lookup.
  const focusWhere = useRef<Record<string, string>>({});
  // The class lens (docs/class-lens-concept.md): stays for the whole lesson; the class's usual lens is remembered on
  // this computer, and News/Politics are allowed per class. Students can vote for it.
  const lensKey = classId ? `lc-class-lens-${classId}` : null;
  const newsKey = classId ? `lc-class-news-${classId}` : null;
  const [lens, setLensState] = useState<string | null>(null);
  const [newsAllowed, setNewsAllowed] = useState(false);
  const lensRef = useRef<string | null>(null);
  lensRef.current = lens;
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`lc-lens-${sessionId}`) ?? (lensKey ? localStorage.getItem(lensKey) : null);
      if (saved) setLensState(saved === 'none' ? null : saved);
      if (newsKey) setNewsAllowed(localStorage.getItem(newsKey) === '1');
    } catch { /* storage unavailable */ }
  }, [sessionId, lensKey, newsKey]);
  const junior = useSessionStore((s) => s.junior);
  const lensChoices = lensesFor(!!junior, newsAllowed);
  // Choosing a lens re-writes the current topic's facts through it (the topic stays)
  const setLens = (id: string | null) => {
    setLensState(id);
    lensRef.current = id;
    try {
      sessionStorage.setItem(`lc-lens-${sessionId}`, id ?? 'none');
      if (lensKey) localStorage.setItem(lensKey, id ?? 'none');
    } catch { /* storage unavailable */ }
    setBriefs((b) => { if (!focusId) return b; const next = { ...b }; delete next[focusId]; return next; });
    flash(id ? `Lens: ${lensById(id)?.label}` : 'No lens');
  };
  const toggleNews = () => {
    const on = !newsAllowed;
    setNewsAllowed(on);
    try { if (newsKey) localStorage.setItem(newsKey, on ? '1' : '0'); } catch { /* storage unavailable */ }
    flash(on ? 'News and Politics lenses on for this class' : 'News and Politics lenses off for this class');
  };
  // The class votes for the lens on their phones; the teacher takes the winner
  const [lensVote, setLensVote] = useState<string | null>(null);
  const { tallies: lensTallies } = usePollVotes(lensVote);
  const startLensVote = async () => {
    const options = lensChoices.map((l) => l.label);
    if (isMockMode()) { setLensVote('mock-lens-vote'); return; }
    const supabase = createClient();
    await supabase.from('polls').update({ is_active: false }).eq('session_id', sessionId).eq('is_active', true);
    const { data, error } = await supabase.from('polls').insert({ session_id: sessionId, question: 'Which lens for today?', options, is_active: true, metadata: { purpose: 'lens' } }).select('id').single();
    if (error || !data) { flash('Could not start the vote.'); return; }
    setLensVote((data as { id: string }).id);
    flash('Vote open on phones: which lens for today?');
  };
  const closeLensVote = async (take: boolean) => {
    if (lensVote && !isMockMode()) await createClient().from('polls').update({ is_active: false }).eq('id', lensVote);
    if (take) {
      const winner = Object.entries(lensTallies).sort((a, b) => b[1] - a[1])[0]?.[0];
      const l = lensChoices.find((x) => x.label === winner);
      if (l) setLens(l.id);
    }
    setLensVote(null);
  };
  const makeFocus = useCallback((req: FocusRequest) => {
    const raw = req.title.replace(/\s+/g, ' ').trim();
    if (!raw) return;
    // A pasted paragraph: its first sentence is the title, the rest is material.
    const first = raw.split(/(?<=[.?!])\s/)[0];
    const title = (first.length <= 90 ? first : `${raw.slice(0, 87)}…`);
    const text = req.text ?? (raw.length > 120 ? raw : undefined);
    const id = `note-${Date.now().toString(36)}`;
    addItem(sessionId, { id, kind: 'note', title, url: `note:${id}`, publisher: req.credit ?? 'Class', ...(text ? { text } : {}) });
    if (req.where) focusWhere.current[id] = req.where;
    setFocusId(id);
    flash(req.credit ? `New topic from ${req.credit}` : 'New topic');
  }, [addItem, sessionId, flash]);
  // Prepared on Home ("Prepare the next lesson", free talk): open with its topic as the Focus, once.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(preparedFocusKey(sessionId));
      if (!raw) return;
      sessionStorage.removeItem(preparedFocusKey(sessionId));
      const focus = JSON.parse(raw) as { title?: string; text?: string };
      if (focus.title) makeFocus({ title: focus.title, ...(focus.text ? { text: focus.text } : {}) });
    } catch { /* storage unavailable or bad JSON: open as usual */ }
  }, [sessionId, makeFocus]);
  // "Last time" (live memory step 3): the class's previous lesson, offered at the gate. Suggestions only:
  // nothing changes until the teacher taps one.
  const [lastTime, setLastTime] = useState<{ entry: LessonEntry; at: string } | null>(null);
  const [lastTimeDismissed, setLastTimeDismissed] = useState(false);
  useEffect(() => {
    let live = true;
    void fetch(`/api/session/lesson-memory?sessionId=${encodeURIComponent(sessionId)}&previous=1`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { memory?: unknown; at?: string } | null) => {
        const entry = lessonEntry(sanitizeLessonMemory(d?.memory ?? null));
        if (live && entry) setLastTime({ entry, at: d?.at ?? '' });
      })
      .catch(() => {});
    return () => { live = false; };
  }, [sessionId]);

  const setMakeFocus = useFocusBus((s) => s.setMakeFocus);
  useEffect(() => {
    setMakeFocus(makeFocus);
    return () => setMakeFocus(null);
  }, [makeFocus, setMakeFocus]);

  // Each new Focus: brief it (one AI call), move phones to it (topic chip +
  // reference vocabulary), and give thin topics real substance to build from.
  useEffect(() => {
    if (!focused) return;
    setFocusTrail((t) => [focused.id, ...t.filter((x) => x !== focused.id)].slice(0, 8));
    recordTopic(focused.title, focused.kind);
    setCustomTopic(focused.title.slice(0, 120));
    roomChannelRef.current?.postMessage({ type: 'topic', title: focused.title.slice(0, 120) });
    if (briefs[focused.id]) return;
    const item = focused;
    setBriefs((b) => ({ ...b, [item.id]: 'loading' }));
    // A YouTube video from outside the library has only its title: read the whole video first (free when it was
    // read before; a new video needs Pro), so the briefing and activities are about what it really says.
    const readVideo: Promise<string | null> = item.kind === 'video' && item.videoId && !item.library && !item.text
      ? fetch(`/api/session/${encodeURIComponent(sessionId)}/video-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: item.videoId }),
      })
        .then(async (r) => {
          const d = (await r.json().catch(() => null)) as { summary?: string; code?: string } | null;
          if (r.ok && d?.summary) {
            updateItem(sessionId, item.id, { text: d.summary });
            return d.summary;
          }
          if (d?.code === 'PRO_REQUIRED') flash('Using the video title only (Pro reads the whole video)');
          else if (d?.code === 'NO_TRANSCRIPT') flash('This video has no captions: using its title');
          return null;
        })
        .catch(() => null)
      : Promise.resolve(null);
    void readVideo
      .then((transcript) => fetch(`/api/session/${encodeURIComponent(sessionId)}/focus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: item.title, text: transcript ?? item.text ?? item.description ?? '', depth, where: focusWhere.current[item.id], covered: lessonMemory.snapshot.topics.map((t) => t.title).slice(-20), ...(lensRef.current ? { lens: lensRef.current } : {}) }),
      }))
      .then((r) => (r.ok ? r.json() : null))
      .then((d: FocusBrief | null) => {
        if (!d?.briefing) {
          setBriefs((b) => ({ ...b, [item.id]: 'failed' }));
          return;
        }
        setBriefs((b) => ({ ...b, [item.id]: d }));
        if (!d.nextTopics?.length) {
          // A ready-bank topic (instant): its "Where next?" follows a moment later.
          void fetch(`/api/session/${encodeURIComponent(sessionId)}/where-next`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: item.title, covered: lessonMemory.snapshot.topics.map((t) => t.title).slice(-20), ...(lensRef.current ? { lens: lensRef.current } : {}) }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((n: { nextTopics?: FocusBrief['nextTopics'] } | null) => {
              if (n?.nextTopics?.length) setBriefs((b) => (typeof b[item.id] === 'object' ? { ...b, [item.id]: { ...(b[item.id] as FocusBrief), nextTopics: n.nextTopics } } : b));
            })
            .catch(() => {});
        }
        if (item.kind === 'note' && !item.text) {
          updateItem(sessionId, item.id, {
            text: [d.briefing, ...d.facts.map((f) => `- ${f}`), ...(d.reference ? ['', d.reference.text, ''] : []), ...d.angles.map((a) => `Question: ${a}`)].join('\n'),
            aiNotes: true,
          });
        } else if (d.reference && !item.text && item.kind !== 'video') {
          // A web result with only a one-line snippet: the real facts become its material.
          updateItem(sessionId, item.id, { text: [item.description ?? '', d.reference.text].filter(Boolean).join('\n\n') });
        }
      })
      .catch(() => setBriefs((b) => ({ ...b, [item.id]: 'failed' })));
    // Only when the Focus (or the depth) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused?.id, depth, lens]);
  const focusBrief = focused ? briefs[focused.id] : undefined;
  // "Back to": the last two earlier topics of this lesson, one tap away.
  const earlierTopics = useMemo(
    () => focusTrail.filter((id) => id !== focused?.id).slice(0, 2).map((id) => material.find((m) => m.id === id)).filter((m): m is RoomItem => !!m),
    [focusTrail, focused?.id, material],
  );
  useEffect(() => { setAboutOpen(false); }, [focused?.id]);
  const brief = typeof focusBrief === 'object' ? focusBrief : null;
  useEffect(() => {
    if (!focused || !brief?.cards?.length || factsSeen.current.has(focused.id)) return;
    factsSeen.current.add(focused.id);
    setFactsOpen(true);
  }, [focused, brief]);
  useEffect(() => { setFactsOpen(false); }, [focused?.id]);
  useEffect(() => {
    const id = focused?.id, cards = brief?.cards;
    if (!id || !cards?.length || cardPics[id]) return;
    setCardPics((m) => ({ ...m, [id]: cards.map(() => null) }));
    const title = focused.title;
    void Promise.all(cards.map((c, i) => {
      const query = c.pictureFile || c.picture || (i === 0 ? title : '');
      if (!query) return Promise.resolve([] as FreePicture[]);
      return fetch(`/api/sessions/${encodeURIComponent(sessionId)}/sources/free-pictures`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, strict: true }),
      }).then((r) => (r.ok ? r.json() : { pictures: [] })).then((d: { pictures?: FreePicture[] }) => d.pictures ?? []).catch(() => [] as FreePicture[]);
    })).then((lists) => {
      // each card its own picture: never the same photo twice on the board
      const used = new Set<string>();
      const pics = lists.map((list) => { const p = list.find((x) => !used.has(x.id)) ?? null; if (p) used.add(p.id); return p; });
      setCardPics((m) => ({ ...m, [id]: pics }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused?.id, brief?.cards]);
  // The topic's key words feed the Word bank widget.
  const setBusVocab = useFocusBus((s) => s.setVocab);
  useEffect(() => { setBusVocab(brief?.vocab ?? []); }, [brief, setBusVocab]);
  const setBusContext = useFocusBus((s) => s.setContext);
  useEffect(() => {
    setBusContext(brief ? [brief.briefing, ...(brief.facts ?? [])].join(' ').slice(0, 900) : '');
    return () => setBusContext('');
  }, [brief, setBusContext]);
  useEffect(() => { if (brief?.vocab?.length) recordWords(brief.vocab.map((v) => v.word)); }, [brief, recordWords]);

  // Setting a focus item starts preparing the top two activity stamps for it, so
  // launching one of them is near-instant. (Games generate inside themselves.)
  useEffect(() => {
    if (!focused || !onPrefetch) return;
    // A thin typed topic is prepared once its briefing gives it substance.
    if (focused.kind === 'note' && !focused.text) return;
    const source = roomItemToSource(focused);
    stamps
      .filter((s) => s.kind === 'activity')
      .slice(0, 2)
      .forEach((s) => {
        const activity = activities.find((a) => a.key === s.key);
        if (activity) onPrefetch(activity, source);
      });
    // Only when the focus item (or a note's briefing) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused?.id, focused?.text ? 1 : 0]);

  // ── sources ──────────────────────────────────────────────────────────────
  const present = useCallback((item: RoomItem) => {
    addItem(sessionId, item);
    showItem(sessionId, item);
    switchView('show');
  }, [addItem, showItem, sessionId]);

  useEffect(() => {
    const channel = openRoomChannel(sessionId, (m) => {
      if (m.type === 'show') present(m.item);
      else if (m.type === 'add') addItem(sessionId, m.item);
      else if (m.type === 'focus') makeFocus({ title: m.title, credit: m.credit });
      else if (m.type === 'spoke') setHeard(m.id, m.heard);
      // A newly opened Sources window asks what the topic is (and who has been heard).
      else if (m.type === 'hello') {
        if (focusedTitleRef.current) channel?.postMessage({ type: 'topic', title: focusedTitleRef.current });
        heardPostRef.current?.();
        const a = talkAnswerRef.current;
        if (a) channel?.postMessage({ type: 'answer', question: a.question, answer: a.answer, open: a.open, source: a.source });
      }
    });
    roomChannelRef.current = channel;
    return () => { channel?.close(); roomChannelRef.current = null; };
  }, [sessionId, present, addItem, makeFocus, setHeard]);

  const openPopout = () => {
    popupOpened.current = !!document.fullscreenElement;
    const popup = window.open(`/sessions/${encodeURIComponent(sessionId)}/sources`, `lc-sources-${sessionId}`, 'popup,width=480,height=860');
    if (popup) popup.focus();
    else setPanel('sources');
  };
  // Messages are read in the private window, never on the shared screen.
  // Class Board cards waiting for approval: open the board (for the class) and
  // the private window on its Board tab (for the teacher).
  const openBoardApprovals = (x: number, y: number) => {
    openTool('class-board', x, y);
    popupOpened.current = !!document.fullscreenElement;
    const popup = window.open(`/sessions/${encodeURIComponent(sessionId)}/sources?tab=board#board`, `lc-sources-${sessionId}`, 'popup,width=480,height=860');
    popup?.focus();
  };
  const openMessages = (x: number, y: number) => {
    popupOpened.current = !!document.fullscreenElement;
    const popup = window.open(`/sessions/${encodeURIComponent(sessionId)}/sources?tab=messages#messages`, `lc-sources-${sessionId}`, 'popup,width=480,height=860');
    if (popup) popup.focus();
    else openTool('class-questions', x, y);
  };

  // ── cabin ────────────────────────────────────────────────────────────────
  // Everyone aboard: phones, plus students without a device whom the teacher boarded.
  const seated = allSeats;
  // Tell the private window who has been heard (whenever the cabin or the ticks change, and when it opens).
  const heardPostRef = useRef<(() => void) | null>(null);
  heardPostRef.current = () => roomChannelRef.current?.postMessage({
    type: 'heard',
    students: seated.map((p) => ({ id: p.id, name: p.display_name, heard: heardIds.includes(p.id) })),
  });
  const heardSig = `${seated.map((p) => p.id).join(',')}|${heardIds.join(',')}`;
  useEffect(() => { heardPostRef.current?.(); }, [heardSig]);
  const newest = useMemo(() => [...participants].sort((a, b) => a.joined_at.localeCompare(b.joined_at)).pop() ?? null, [participants]);
  const answered = useMemo(() => {
    if (!runningKey) return new Set<string>();
    const since = launchedAt.current;
    return new Set(scores.filter((s) => new Date(s.created_at).getTime() >= since).map((s) => s.student_id || s.client_id || ''));
  }, [scores, runningKey]);
  // Always at least one empty seat, so a trial student can be added in one tap.
  const seatCount = Math.max(12, Math.ceil((allSeats.length + 1) / 4) * 4);

  // Boarding walk-up: students who join after the room opens walk across the
  // tarmac and up the airstairs; their seat lights up as they step inside.
  // (Anyone already aboard when the teacher opens/refreshes the room is seated.)
  const roomOpenedAt = useRef(Date.now() - 5000);
  const [walkingIds, setWalkingIds] = useState<Set<string>>(new Set());
  const arrivals = useMemo<Boarder[]>(
    () => seated
      .filter((p) => new Date(p.joined_at).getTime() >= roomOpenedAt.current)
      .map((p) => ({ id: p.id, name: p.display_name, seed: p.avatar_seed ?? null, late: flightStage !== 'gate' })),
    // flightStage only matters at the moment someone arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seated],
  );
  const seenArrivals = useRef<Set<string>>(new Set());
  useEffect(() => {
    const fresh = arrivals.filter((a) => !seenArrivals.current.has(a.id));
    if (!fresh.length) return;
    fresh.forEach((a) => seenArrivals.current.add(a.id));
    setWalkingIds((prev) => new Set([...Array.from(prev), ...fresh.map((a) => a.id)]));
  }, [arrivals]);
  const onBoarded = useCallback((id: string) => {
    setWalkingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Raised hands: the speaking queue, oldest hand first.
  const [hands, setHands] = useState<Record<string, { name: string; at: number; seen: number }>>({});
  const handChannel = useRef<ReturnType<typeof openHandChannel> | null>(null);
  useEffect(() => {
    const ch = openHandChannel(sessionId, (m) => {
      if (m.type !== 'hand') return;
      setHands((prev) => {
        const next = { ...prev };
        if (m.raised) next[m.clientId] = { name: m.name, at: m.at || Date.now(), seen: Date.now() };
        else delete next[m.clientId];
        return next;
      });
    });
    handChannel.current = ch;
    const sweep = window.setInterval(() => {
      setHands((prev) => {
        const now = Date.now();
        const next = Object.fromEntries(Object.entries(prev).filter(([, h]) => now - h.seen < HAND_STALE_MS));
        return Object.keys(next).length === Object.keys(prev).length ? prev : next;
      });
    }, 4000);
    return () => { window.clearInterval(sweep); ch.close(); handChannel.current = null; };
  }, [sessionId]);
  const handQueue = useMemo(() => Object.entries(hands).sort((a, b) => a[1].at - b[1].at).map(([clientId, h]) => ({ clientId, ...h })), [hands]);
  const lowerHand = (clientId: string) => {
    handChannel.current?.send({ type: 'lower', clientId });
    setHands((prev) => { const next = { ...prev }; delete next[clientId]; return next; });
  };
  // A student without a device: the teacher raises their hand for them (it stays up until lowered).
  const raiseHandFor = (p: DeckParticipant) => setHands((prev) => (prev[p.client_id]
    ? (() => { const next = { ...prev }; delete next[p.client_id]; return next; })()
    : { ...prev, [p.client_id]: { name: p.display_name, at: Date.now(), seen: Number.MAX_SAFE_INTEGER } }));
  const [seatMenu, setSeatMenu] = useState<string | null>(null);
  const seatMenuP = seatMenu ? allSeats.find((x) => x.id === seatMenu) ?? null : null;
  const [seatPoll, setSeatPoll] = useState<{ id: string; options: string[] } | null>(null);
  useEffect(() => {
    setSeatPoll(null);
    if (!seatMenuP?.deviceless || isMockMode()) return;
    let live = true;
    void createClient()
      .from('polls').select('id, options').eq('session_id', sessionId).eq('is_active', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }: { data: { id: unknown; options: unknown } | null }) => { if (live && data && Array.isArray(data.options)) setSeatPoll({ id: data.id as string, options: data.options as string[] }); });
    return () => { live = false; };
  }, [seatMenuP?.id, seatMenuP?.deviceless, sessionId]);
  const markSeat = async (p: DeckParticipant, mark: 'right' | 'part' | 'wrong') => {
    setHeard(p.id);
    if (!p.student_id) return;
    const points = mark === 'right' ? 10 : mark === 'part' ? 3 : 0;
    flash(mark === 'right' ? `${p.display_name}: right` : mark === 'part' ? `${p.display_name}: took part` : `${p.display_name}: not this time`);
    if (isMockMode() || p.student_id.startsWith('pretend-')) return;
    await fetch('/api/session/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId, student_id: p.student_id, display_name: p.display_name, points, is_correct: mark === 'right',
        outcome: mark === 'wrong' ? 'attempted' : 'on-task', accuracy_status: mark === 'part' ? null : mark === 'right' ? 'correct' : 'incorrect',
        counts_for_accuracy: mark !== 'part', counts_for_leaderboard: true, scoring_version: 2,
        response_data: { source: 'seat', activity: runningKey ?? null },
      }),
    }).catch(() => flash('Could not save that mark'));
  };
  const voteForSeat = async (p: DeckParticipant, choice: string) => {
    if (!seatPoll || !p.student_id) return;
    flash(`${p.display_name} voted ${choice}`);
    if (isMockMode() || p.student_id.startsWith('pretend-')) return;
    const r = await fetch(`/api/session/${encodeURIComponent(sessionId)}/seat-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId: seatPoll.id, studentId: p.student_id, choice }),
    }).catch(() => null);
    if (!r?.ok) flash('Could not save that vote');
  };
  const [adding, setAdding] = useState(false);
  // A new student boards as soon as the class list has them.
  const [boardNext, setBoardNext] = useState<string | null>(null);
  useEffect(() => {
    if (!boardNext) return;
    const st = roster.find((r) => r.name.toLowerCase() === boardNext);
    if (st) { boardStudent(st.id); setBoardNext(null); }
    // boardStudent is stable in effect (a state setter wrapper)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardNext, roster]);
  const [newName, setNewName] = useState('');
  const addStudent = async () => {
    const name = newName.trim().slice(0, 40);
    if (!name || !onAddStudent) return;
    if (allSeats.some((p) => p.display_name.toLowerCase() === name.toLowerCase())) { flash(`${name} already has a seat`); return; }
    const ok = await onAddStudent(name);
    if (ok) { setNewName(''); setAdding(false); setBoardNext(name.toLowerCase()); flash(`${name} added to the class and boarding`); } else flash('Could not add the student');
  };

  useEffect(() => { if (participants.length > 0) markFirst('shared'); }, [participants.length]);
  useEffect(() => { if (runningKey && !testFlight) markFirst('ran'); }, [runningKey, testFlight]);
  useEffect(() => {
    if (testFlight) return;
    if (allSeats.some((p) => p.deviceless)) offerTip('seat', 'Students without a device: tap their seat to give them a turn, mark an answer or vote for them.');
  }, [allSeats, testFlight, offerTip]);

  useEffect(() => { if (runningKey) setMomentCard(null); }, [runningKey]);
  // "Cabin crew, prepare for landing": once per flight, never over an activity (it waits until the activity ends).
  const descentAnnounced = useRef(false);
  useEffect(() => {
    if (flightStage !== 'flying') { descentAnnounced.current = false; return; }
    if (!(descending || holding) || descentAnnounced.current || runningKey) return;
    descentAnnounced.current = true;
    try { play('seatbelt'); } catch { /* sound off */ }
    flash('Cabin crew, prepare for landing');
  }, [descending, holding, runningKey, flightStage, flash]);

  // Test flight: what the teacher has tried since it started.
  const [tf, setTf] = useState({ spins: 0, whereNext: false, launched: false, finished: false, startFocus: null as string | null, startShown: null as string | null });
  useEffect(() => {
    if (!testFlight || !runningKey) return;
    setTf((t) => (t.launched ? t : { ...t, launched: true }));
  }, [testFlight, runningKey]);
  useEffect(() => {
    if (testFlight && !runningKey) setTf((t) => (t.launched && !t.finished ? { ...t, finished: true } : t));
  }, [testFlight, runningKey]);
  const startTestFlight = () => {
    setTestFlightOffer(false);
    setTestFlight(true);
    setTf({ spins: 0, whereNext: false, launched: false, finished: false, startFocus: focused?.id ?? null, startShown: shown?.id ?? null });
    setAdding(false);
    setGuideOpen(false);
    trackFunnel('guided_test_flight_started', { classType: todayType ?? null });
  };
  const endTestFlight = (finished: boolean) => {
    setTestFlight(false);
    PRETEND_STUDENTS.forEach((s) => unboardStudent(s.id));
    try { localStorage.setItem(TEST_FLIGHT_DONE_KEY, '1'); } catch { /* storage blocked */ }
    if (finished) { flash('Test flight complete'); trackFunnel('guided_test_flight_finished', { classType: todayType ?? null }); }
  };

  const nextSpeaker = () => {
    const first = handQueue[0];
    if (!first) return;
    const p = seated.find((s) => s.client_id === first.clientId);
    if (p) setSpotlight(p.id);
    flash(`${first.name}, go ahead!`);
    lowerHand(first.clientId);
  };

  // Fair: everyone once (random order) before anyone again, never the same student twice in a row.
  const fairRef = useRef<{ picked: string[]; last: string | null }>({ picked: [], last: null });
  const spinRoulette = () => {
    if (roulette || seated.length === 0) return;
    setTf((t) => ({ ...t, spins: t.spins + 1 }));
    if (!testFlight) markFirst('picked');
    const pick = fairPick(seated.map((p) => p.id), fairRef.current.picked, fairRef.current.last);
    fairRef.current = { picked: pick.picked, last: pick.id };
    const target = Math.max(0, seated.findIndex((p) => p.id === pick.id));
    let delay = 60;
    const steps = 14 + Math.floor(Math.random() * seated.length);
    // Start so the spin lands on the fair pick.
    let i = (((target - (steps - 1)) % seated.length) + seated.length) % seated.length;
    let n = 0;
    setSpotlight(null);
    const step = () => {
      const p = seated[i % seated.length];
      setRoulette(p.id);
      i++;
      n++;
      if (n < steps) {
        delay *= 1.13;
        window.setTimeout(step, reduce ? 0 : delay);
      } else {
        window.setTimeout(() => {
          setRoulette(null);
          setSpotlight(p.id);
          flash(`${p.display_name}, you're up!`);
        }, 350);
      }
    };
    step();
  };

  // ── instruments ──────────────────────────────────────────────────────────
  const topScore = useMemo(() => {
    const totals = new Map<string, number>();
    scores.forEach((s) => {
      const k = s.student_id || s.client_id;
      if (k) totals.set(k, (totals.get(k) ?? 0) + s.points);
    });
    let best: { name: string; pts: number } | null = null;
    totals.forEach((pts, k) => {
      if (!best || pts > best.pts) {
        const p = allSeats.find((x) => keyOf(x) === k);
        best = { name: p?.display_name ?? '—', pts };
      }
    });
    return best as { name: string; pts: number } | null;
  }, [scores, allSeats]);
  const sessionMs = startedAt ? now - new Date(startedAt).getTime() : 0;
  const readings: Record<Instrument, { value: string; frac: number; sub?: string }> = {
    aboard: { value: String(seated.length), frac: rosterCount ? Math.min(1, seated.length / rosterCount) : seated.length ? 1 : 0, sub: rosterCount ? `of ${rosterCount}` : undefined },
    answered: { value: runningKey && seated.length ? `${Math.round((Math.min(answered.size, seated.length) / seated.length) * 100)}%` : '—', frac: runningKey && seated.length ? Math.min(1, answered.size / seated.length) : 0 },
    // In flight the clock instrument counts down to arrival; at the gate it shows class time.
    clock: minutesLeft != null && flightStage === 'flying'
      ? { value: holding ? 'HOLD' : `${Math.ceil(minutesLeft)}m`, frac: routeT, sub: holding ? 'circling' : 'to arrival' }
      : { value: fmtClock(sessionMs), frac: Math.min(1, sessionMs / 3_600_000), sub: 'h:mm' },
    top: { value: topScore ? String(topScore.pts) : '—', frac: topScore ? 1 : 0, sub: topScore?.name },
  };

  // ── widgets (the existing draggable ones) ────────────────────────────────
  const openWidgetStore = useWidgetStore((s) => s.openWidget);
  const setWidgetPosition = useWidgetStore((s) => s.setPosition);
  const bringToFront = useWidgetStore((s) => s.bringToFront);
  // The room starts with a clean deck: widgets left open elsewhere stay closed
  // until the teacher opens one from Tools.
  const closeWidgetStore = useWidgetStore((s) => s.closeWidget);
  useEffect(() => {
    DECK_WIDGET_IDS.forEach((id) => closeWidgetStore(id));
  }, [closeWidgetStore]);
  // Each view remembers its own widget layout: leaving a view saves what was open
  // and where; entering a view with a saved layout restores it.
  const viewLayouts = useRef<Partial<Record<DeckView, Record<string, { x: number; y: number }>>>>({});
  const prevView = useRef<DeckView>(view);
  useEffect(() => {
    const from = prevView.current;
    if (from === view) return;
    prevView.current = view;
    const ws = useWidgetStore.getState().widgets;
    const open: Record<string, { x: number; y: number }> = {};
    for (const id of DECK_WIDGET_IDS) if (ws[id]?.isOpen) open[id] = ws[id].position;
    viewLayouts.current[from] = open;
    const saved = viewLayouts.current[view];
    if (!saved) return;
    for (const id of DECK_WIDGET_IDS) {
      if (saved[id]) {
        setWidgetPosition(id, saved[id]);
        openWidgetStore(id);
      } else closeWidgetStore(id);
    }
  }, [view, setWidgetPosition, openWidgetStore, closeWidgetStore]);

  const applyTemplate = (t: ScreenTemplate) => {
    for (const id of DECK_WIDGET_IDS) if (!(id in t.widgets)) closeWidgetStore(id);
    for (const id of Object.keys(t.widgets)) openWidgetStore(id);
    // Place once rendered, so each widget snaps by its real size.
    requestAnimationFrame(() => {
      const zones = useSnapZones.getState().zones;
      for (const [id, anchor] of Object.entries(t.widgets)) {
        const zone = zones.find((z) => z.id === `wind-${anchor}`);
        const el = document.querySelector<HTMLElement>(`[data-widget-id="${id}"]`);
        if (zone && el) setWidgetPosition(id, snappedPosition(zone, el.offsetWidth, el.offsetHeight));
      }
    });
  };

  // Flight map as a small corner widget: tracks the trip while the class does other things.
  const shrinkToCorner = (id: string, anchor: SnapAnchor, nextView: DeckView) => {
    setView(nextView);
    // After the view switch restores that view's layout, add the widget to it.
    window.setTimeout(() => {
      openWidgetStore(id);
      requestAnimationFrame(() => {
        const zone = useSnapZones.getState().zones.find((z) => z.id === `wind-${anchor}`);
        const el = document.querySelector<HTMLElement>(`[data-widget-id="${id}"]`);
        if (zone && el) setWidgetPosition(id, snappedPosition(zone, el.offsetWidth, el.offsetHeight));
      });
    }, 60);
  };
  const shrinkTracker = () => shrinkToCorner(FLIGHT_WIDGET, 'br', flightStage === 'gate' ? 'boarding' : 'talk');

  // The class's city poll can set the next destination.
  const setFlyTo = useFocusBus((s) => s.setFlyTo);
  useEffect(() => {
    setFlyTo((city: string) => {
      if (landed) {
        const next = nextReachable.find((r) => r.city === city);
        if (!next) return;
        // Saved on the class, so it is the default next lesson on any device.
        void fetch(`/api/session/${encodeURIComponent(sessionId)}/room-leg`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nextDestinationId: next.id }) }).catch(() => {});
        flash(`Saved: next time we fly to ${next.city}`);
        return;
      }
      const c = reachable.find((r) => r.city === city);
      if (c) { setChosenId(c.id); flash(`The class chose ${c.city}!`); }
    });
    return () => setFlyTo(null);
  }, [reachable, nextReachable, landed, sessionId, setFlyTo, flash]);
  // The city the class voted for last lesson is today's default (when it is still in range).
  useEffect(() => {
    const saved = position?.nextDestinationId;
    if (!saved || chosenId || flightStage !== 'gate') return;
    if (reachable.some((c) => c.id === saved)) setChosenId(saved);
  }, [position, reachable]); // eslint-disable-line react-hooks/exhaustive-deps

  const openTool = (id: string, x: number, y: number) => {
    setWidgetPosition(id, { x: Math.max(8, Math.min(window.innerWidth - 340, x - 160)), y: Math.max(8, y - 420) });
    openWidgetStore(id);
    bringToFront(id);
  };

  // ── drag & drop ──────────────────────────────────────────────────────────
  const windRef = useRef<HTMLDivElement>(null);
  const cargoRef = useRef<HTMLElement>(null);
  const cabinRef = useRef<HTMLElement>(null);
  const onDrop = useCallback((d: DeckDrop) => {
    if (d.type === 'hud' && d.zone === 'wind' && windRef.current) {
      const r = windRef.current.getBoundingClientRect();
      setHudPos((p) => ({ ...p, [d.id]: { x: Math.min(94, Math.max(6, ((d.clientX - r.left) / r.width) * 100)), y: Math.min(92, Math.max(8, ((d.clientY - r.top) / r.height) * 100)) } }));
      return;
    }
    if (d.type === 'inst' && d.zone === 'wind') {
      setHuds((h) => (h.includes(d.id as Instrument) ? h : [...h, d.id as Instrument]));
      if (windRef.current) {
        const r = windRef.current.getBoundingClientRect();
        setHudPos((p) => ({ ...p, [d.id]: { x: ((d.clientX - r.left) / r.width) * 100, y: ((d.clientY - r.top) / r.height) * 100 } }));
      }
      return;
    }
    if (d.type === 'item' && d.zone === 'wind') {
      const item = material.find((m) => m.id === d.id);
      if (item) present(item);
      return;
    }
    if (d.type === 'stamp') {
      if (d.zone === 'item') {
        const item = material.find((m) => m.id === d.target.dataset.itemId);
        if (item) {
          setFocusId(item.id);
          launch(d.id, item);
        }
      } else if (d.zone === 'wind') {
        launch(d.id, focused);
      }
      return;
    }
    if (d.type === 'student' && (d.zone === 'spot' || d.zone === 'wind')) {
      const p = allSeats.find((x) => x.id === d.id);
      if (p) {
        setSpotlight(p.id);
        flash(`${p.display_name}, you're up!`);
      }
    }
  }, [material, present, launch, focused, allSeats, flash, setSpotlight]);
  const { dragging, hotZone } = useDeckDrag(onDrop, (type, zone) =>
    (zone === 'wind' && ['inst', 'item', 'stamp', 'student', 'hud'].includes(type))
    || (zone === 'item' && type === 'stamp')
    || (zone === 'spot' && type === 'student'));
  const hot = (el: HTMLElement | null, zone: string) => !!el && el.dataset.deckDrop === zone;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,[contenteditable="true"]')) return;
      if (e.key === 'Escape') {
        if (panel) setPanel(null);
        else if (presenting) setPresenting(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, presenting]);

  const spotlightP = allSeats.find((p) => p.id === spotlight) ?? null;
  const onScreenLabel =
    view === 'show' && shown ? shown.title
      : view === 'game' ? (catalogue.find((c) => c.key === runningKey)?.name ?? 'Game')
        : VIEWS.find((v) => v.key === view)?.label ?? '';

  // ── Talk: one-tap prompts on the topic of the moment ─────────────────────
  const TALK_KINDS: { key: string; label: string }[] = [
    { key: 'warmup', label: 'Warm-up' },
    { key: 'deeper', label: 'Go deeper' },
    { key: 'opinion', label: 'Opinion' },
    { key: 'wyr', label: 'Would you rather' },
    { key: 'story', label: 'Tell a story' },
    { key: 'debate', label: 'Debate it' },
    { key: 'journey', label: 'On our flight' },
  ];
  const fetchTalk = async (kind: string) => {
    setTalkBusy(kind);
    const topic = focused?.title ?? (sessionTopic && sessionTopic !== 'General' ? sessionTopic : 'everyday life');
    const context = kind === 'journey'
      ? `The class is flying from ${origin.city} to ${destination.city}${below.name ? `, currently over ${below.name}` : ''}.`
      : [brief?.briefing, (focused?.text ?? focused?.description)?.slice(0, 600), talkUsed.length ? `Avoid repeating: ${talkUsed.slice(-5).join(' | ')}` : ''].filter(Boolean).join(' ');
    try {
      const res = await fetch('/api/live-room/talk-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, topic, context, difficulty, ...(lensRef.current ? { lens: lensRef.current } : {}) }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.prompts) && data.prompts.length) setTalkOptions(data.prompts);
      else flash(data?.error ?? 'Could not write prompts right now');
    } catch {
      flash('Could not write prompts right now');
    } finally {
      setTalkBusy(null);
    }
  };
  const pickTalk = (p: { prompt: string; followUps: string[]; options?: string[] }) => {
    setTalkPrompt(p.prompt);
    setTalkFollowUps(p.followUps);
    setTalkVote(p.options ?? null);
    setTalkOptions([]);
    setTalkUsed((u) => [...u, p.prompt].slice(-20));
  };
  // Class vote on the talking point: a real phone poll with "why?" reasons and
  // changeable answers (replaces the separate Would You Rather activity).
  // "Everyone answers": the question on every phone, the answers gathering on the Class Board (one student speaks at a
  // time; everyone else still takes part)
  const everyoneAnswers = (question: string) => {
    openTool('class-board', window.innerWidth / 2, window.innerHeight * 0.8);
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('lc-board-question', { detail: { question } })), 150);
    flash('Everyone answers on their phones: the answers gather on the Class Board');
  };
  const startTalkVote = async () => {
    const question = talkPrompt.trim();
    const options = talkVote ?? parseWouldYouRather(question) ?? ['Agree', 'Disagree'];
    if (!question) return;
    const supabase = createClient();
    await supabase.from('polls').update({ is_active: false }).eq('session_id', sessionId).eq('is_active', true);
    const { error } = await supabase.from('polls').insert({
      session_id: sessionId,
      question,
      options,
      is_active: true,
      metadata: { askWhy: true, purpose: 'talk-vote' },
    });
    if (error) { flash('Could not start the vote.'); return; }
    openTool('poll', window.innerWidth / 2, window.innerHeight / 2);
    flash('Vote open on phones: pick a side, then say why');
  };

  // For this topic: the library's best match (a video first, else a reading) offered on the top bar, one tap to play
  type TopicPick = { key: string; title: string; video: boolean };
  const [topicPick, setTopicPick] = useState<TopicPick | null>(null);
  const [pickBusy, setPickBusy] = useState(false);
  const pickTopic = focused?.title ?? '';
  useEffect(() => {
    setTopicPick(null);
    if (!pickTopic || isMockMode()) return;
    let live = true;
    void fetch(`/api/live-room/library?${new URLSearchParams({ sessionId, topic: pickTopic })}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { shelf?: Array<{ key: string; title: string; youtubeId?: string | null }> } | null) => {
        const shelf = d?.shelf ?? [];
        const best = shelf.find((e) => e.youtubeId) ?? shelf[0];
        if (live && best) setTopicPick({ key: best.key, title: best.title, video: !!best.youtubeId });
      }).catch(() => {});
    return () => { live = false; };
  }, [pickTopic, sessionId]);
  const playTopicPick = async () => {
    if (!topicPick) return;
    setPickBusy(true);
    try {
      const r = await fetch(`/api/live-room/library?key=${encodeURIComponent(topicPick.key)}`, { cache: 'no-store' });
      const item = r.ok ? ((await r.json()).item as Parameters<typeof present>[0]) : null;
      if (item) { present(item); setTopicPick(null); } else flash('Could not open that one');
    } finally { setPickBusy(false); }
  };

  // Ask the class: fetch the answer key and send it to the private window only
  const fetchAnswer = (question: string, card?: { headline: string; detail?: string }) => {
    const pending: TalkAnswer = { question, answer: null, revealed: false };
    setTalkAnswer(pending);
    roomChannelRef.current?.postMessage({ type: 'answer', question, answer: null });
    if (isMockMode()) return;
    void fetch('/api/live-room/answer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, fact: card ? `${card.headline}. ${card.detail ?? ''}` : '', topic: focused?.title ?? '', junior: !!junior }),
    }).then((r) => (r.ok ? r.json() : null)).then((d: { answer?: string; open?: boolean; source?: { title: string; url: string } | null } | null) => {
      if (!d?.answer) { flash('No answer key for this one'); return; }
      setTalkAnswer((cur) => (cur && cur.question === question ? { ...cur, answer: d.answer!, open: d.open, source: d.source ?? null } : cur));
      roomChannelRef.current?.postMessage({ type: 'answer', question, answer: d.answer, open: d.open, source: d.source ?? null });
    }).catch(() => {});
  };

  // ── windscreen content ───────────────────────────────────────────────────
  let scene: ReactNode;
  if (view === 'boarding' && cityVote && flightStage === 'gate') {
    scene = (
      <CityVoteBoard
        sessionId={sessionId}
        joinUrl={joinUrl}
        cards={voteCards}
        totalVotes={cityVotes.length}
        revealed={cityVote.revealed}
        tallies={cityTallies}
        reasons={cityReasons}
        onReveal={() => void closeCityVote(true)}
        onTakeOff={(id) => { setChosenId(id); setPendingTakeoff(id); }}
        onCancel={() => void closeCityVote(false)}
      />
    );
  } else if (view === 'boarding') {
    scene = (
      <div className="flex max-h-full flex-wrap items-center justify-center gap-8 overflow-y-auto rounded-3xl border border-white/15 bg-slate-950/60 px-8 py-7 backdrop-blur-md">
        <span className="relative rounded-2xl bg-white p-3">
          <QRCodeSVG value={joinUrl} size={176} level="M" includeMargin={false} />
          {!presenting && (
            <button type="button" onClick={() => shrinkToCorner(QR_WIDGET, 'tr', 'talk')} title="Keep the QR code in a corner while you do other things" className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-white/20 bg-slate-950/90 px-2.5 py-1 text-[11px] text-white/85 hover:text-white">
              <Minimize2 className="h-3 w-3" /> Shrink to corner
            </button>
          )}
        </span>
        <div className="flex max-w-md flex-col gap-3 text-left">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Now boarding</p>
          <p className="font-display text-4xl leading-tight text-white">Scan to board<br />{className}</p>
          <CopyLinkText url={joinUrl} className="font-mono text-sm text-white/70" />
          <AnimatePresence mode="popLayout">
            <motion.p
              key={newest?.id ?? 'none'}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-sm font-semibold uppercase tracking-[0.12em] text-emerald-300"
            >
              {newest ? `${newest.display_name} has boarded` : 'Waiting for passengers'}
            </motion.p>
          </AnimatePresence>
          {flightStage === 'gate' && !isMockMode() && <AlbumStrip sessionId={sessionId} />}
          {flightStage === 'gate' && (
            <label className="flex items-center gap-2 text-sm text-white/75">
              Class length
              <select
                id="deck-class-minutes"
                value={classMinutes}
                onChange={(e) => setClassMinutes(Number(e.target.value))}
                className="rounded-lg border border-white/20 bg-slate-900/80 px-2 py-1 text-white"
              >
                {(CLASS_MINUTES.includes(classMinutes) ? CLASS_MINUTES : [...CLASS_MINUTES, classMinutes].sort((a, b) => a - b)).map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
              <span className="flex items-center gap-1 text-white/55" title="The clock started when you opened the room. Opened it early? Move the end time.">
                ends {endsAtLabel}
                <button type="button" onClick={() => nudgeClass(-5)} aria-label="Class ends 5 minutes earlier" className="rounded border border-white/15 px-1.5 hover:text-white">−5</button>
                <button type="button" onClick={() => nudgeClass(5)} aria-label="Class ends 5 minutes later" className="rounded border border-white/15 px-1.5 hover:text-white">+5</button>
              </span>
            </label>
          )}
          {flightStage === 'gate' && canChooseStart && !lockedId && (
            <label className="flex items-center gap-2 text-sm text-white/75" title="This class has not flown yet: choose where its journey begins.">
              Start from
              <select
                id="deck-start-city"
                value={startId ?? ''}
                onChange={(e) => { setStartId(e.target.value || null); setChosenId(null); }}
                className="rounded-lg border border-white/20 bg-slate-900/80 px-2 py-1 text-white"
              >
                <option value="">{HOME.city}</option>
                {[...SCENE_CITIES].sort((a, b) => a.city.localeCompare(b.city)).map((c) => <option key={c.id} value={c.id}>{c.city}</option>)}
              </select>
            </label>
          )}
          {flightStage === 'gate' && reachable.length > 1 && (
            <label className="flex items-center gap-2 text-sm text-white/75">
              Fly to
              <select
                id="deck-destination"
                value={destination.id}
                onChange={(e) => setChosenId(e.target.value)}
                className="rounded-lg border border-white/20 bg-slate-900/80 px-2 py-1 text-white"
              >
                {reachable.map((c) => <option key={c.id} value={c.id}>{c.city}</option>)}
              </select>
              <button type="button" onClick={() => { setMapMode('tracker'); setView('map'); }} className="rounded-lg border border-sky-300/40 px-2 py-1 text-xs text-sky-200 hover:bg-sky-300/10">
                Choose on the map
              </button>
              <button type="button" onClick={() => void startCityPoll()} className="rounded-lg border border-amber-300/40 px-2 py-1 text-xs text-amber-200 hover:bg-amber-300/10">
                Start the where-next vote
              </button>
            </label>
          )}
          {flightStage === 'gate' && stayHome === 'design-mission' && (
            <p className="text-sm text-amber-100">Design mission. The class stays in {origin.city}.</p>
          )}
          {flightStage === 'gate' && stayHomeCity && (
            <p className="text-sm text-amber-100">City lesson: {stayHomeCity.city}. The class stays in {origin.city}.</p>
          )}
          {flightStage === 'gate' && !stayHome && (
            <button
              type="button"
              onClick={() => takeOff()}
              className="mt-1 w-max rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-6 py-3 font-display text-lg text-[#1a1204] shadow-[0_10px_30px_rgba(255,160,60,.35)] hover:brightness-105"
            >
              Take off to {destination.city}
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
            While you wait:
            <button type="button" onClick={() => startPinGame('where')} className="rounded-lg border border-amber-300/40 px-2.5 py-1 text-amber-100 hover:bg-amber-300/10">Where in the world?</button>
            <button type="button" onClick={() => startPinGame('hello')} className="rounded-lg border border-amber-300/40 px-2.5 py-1 text-amber-100 hover:bg-amber-300/10">Say hello like a local</button>
            <button type="button" onClick={() => void startDistanceQuiz()} className="rounded-lg border border-amber-300/40 px-2.5 py-1 text-amber-100 hover:bg-amber-300/10">How far is it?</button>
          </div>
          {distanceQuiz && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/30 bg-slate-950/60 px-3 py-2 text-sm text-white">
              <span>How far is {distanceQuiz.city} from {distanceQuiz.from}?</span>
              {distanceQuiz.shown
                ? <b className="text-amber-200">About {distanceQuiz.km.toLocaleString()} km</b>
                : <button type="button" onClick={() => setDistanceQuiz((q) => (q ? { ...q, shown: true } : q))} className="rounded-lg bg-amber-300 px-2.5 py-0.5 text-xs font-semibold text-slate-950">Show the answer</button>}
              <button type="button" onClick={() => setDistanceQuiz(null)} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
            Class map:
            {PIN_PROMPTS.map((q) => (
              <button key={q} type="button" onClick={() => startPins(q)} className="rounded-lg border border-white/20 px-2.5 py-1 text-white/80 hover:border-rose-300/60 hover:text-white">
                {q}
              </button>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); askCustom(); }} className="flex items-center gap-1">
              <input
                value={customPin}
                onChange={(e) => setCustomPin(e.target.value.slice(0, 120))}
                placeholder="Your own question…"
                aria-label="Your own class map question"
                className="w-44 rounded-lg border border-white/20 bg-slate-950/60 px-2.5 py-1 text-xs text-white placeholder:text-white/40 focus:border-rose-300/60 focus:outline-none"
              />
              {customPin.trim() && <button type="submit" className="rounded-lg border border-rose-300/50 px-2 py-1 text-xs text-rose-100 hover:bg-rose-300/10">Ask</button>}
            </form>
          </div>
        </div>
      </div>
    );
  } else if (view === 'talk') {
    scene = (
      <div className="flex w-full max-w-4xl flex-col items-center gap-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Talking point</p>
        <textarea
          id="deck-talk-prompt"
          value={talkPrompt}
          onChange={(e) => { setTalkPrompt(e.target.value); setTalkFollowUps([]); setTalkVote(parseWouldYouRather(e.target.value) ?? null); }}
          placeholder={presenting ? '' : 'Type a question, or tap a kind of prompt below…'}
          rows={3}
          className="w-full resize-none bg-transparent text-center font-display text-4xl leading-tight text-white placeholder:text-white/40 focus:outline-none [text-shadow:0_2px_18px_rgba(0,0,0,.45)]"
        />
        {!presenting && talkPrompt.trim().length > 3 && talkPrompt.trim() !== focused?.title && (
          <button type="button" onClick={() => makeFocus({ title: talkPrompt })} className="flex items-center gap-1.5 rounded-lg border border-amber-300/40 bg-slate-950/60 px-2.5 py-1 text-xs text-amber-200 backdrop-blur-sm hover:bg-amber-300/10">
            <Crosshair className="h-3.5 w-3.5" /> Make this the topic
          </button>
        )}
        {talkVote && (
          <div className="flex items-center gap-3">
            <span className="rounded-2xl border border-rose-300/40 bg-slate-950/60 px-4 py-2 font-display text-2xl text-white backdrop-blur-sm">{talkVote[0]}</span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">or</span>
            <span className="rounded-2xl border border-rose-300/40 bg-slate-950/60 px-4 py-2 font-display text-2xl text-white backdrop-blur-sm">{talkVote[1]}</span>
          </div>
        )}
        {talkAnswer && talkAnswer.question === talkPrompt && talkAnswer.revealed && talkAnswer.answer && (
          <div className="max-w-3xl rounded-2xl border border-emerald-300/40 bg-slate-950/70 px-5 py-3 text-center backdrop-blur-sm">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">{talkAnswer.open ? 'Some good answers' : 'The answer'}</p>
            <p className="mt-1 text-2xl leading-snug text-white">{talkAnswer.answer}</p>
          </div>
        )}
        {!presenting && talkAnswer && talkAnswer.question === talkPrompt && !talkAnswer.revealed && (
          <button type="button" disabled={!talkAnswer.answer} onClick={() => setTalkAnswer({ ...talkAnswer, revealed: true })} title="Your answer key is in the private window; this shows it to the class" className="flex items-center gap-1.5 rounded-lg border border-emerald-300/50 bg-slate-950/60 px-3 py-1.5 text-sm text-emerald-100 backdrop-blur-sm hover:bg-emerald-300/10 disabled:opacity-50">
            <Eye className="h-4 w-4" /> {talkAnswer.answer ? 'Reveal the answer' : 'Finding the answer…'}
          </button>
        )}
        {!presenting && talkPrompt.trim().length > 3 && (<div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={() => void startTalkVote()} className="flex items-center gap-1.5 rounded-lg border border-rose-300/50 bg-slate-950/60 px-2.5 py-1 text-xs text-rose-100 backdrop-blur-sm hover:bg-rose-300/10">
            <Vote className="h-3.5 w-3.5" /> {talkVote ? 'Class vote on phones' : 'Class vote: agree or disagree'}
          </button>
          <button type="button" onClick={() => everyoneAnswers(talkPrompt.trim())} title="Everyone writes an answer on their phone; the answers gather on the Class Board" className="flex items-center gap-1.5 rounded-lg border border-sky-300/50 bg-slate-950/60 px-2.5 py-1 text-xs text-sky-100 backdrop-blur-sm hover:bg-sky-300/10">
            <ClipboardList className="h-3.5 w-3.5" /> Everyone answers
          </button>
        </div>)}
        {talkFollowUps.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {talkFollowUps.map((f) => (
              <button key={f} type="button" onClick={() => { setTalkPrompt(f); setTalkFollowUps([]); }} className="rounded-full border border-white/20 bg-slate-950/55 px-3 py-1.5 text-sm text-white/85 backdrop-blur-sm hover:bg-slate-900/70">
                <span className="font-semibold text-amber-200">Then:</span> {f}
              </button>
            ))}
          </div>
        )}
        {!presenting && (
          <>
            {talkOptions.length === 0 && brief && brief.angles.length > 0 && (
              <div className="grid w-full gap-2 sm:grid-cols-3">
                {brief.angles.slice(0, 3).map((a) => (
                  <button key={a} type="button" onClick={() => pickTalk({ prompt: a, followUps: [] })} className="rounded-2xl border border-amber-300/25 bg-slate-950/70 p-3 text-left text-sm text-white backdrop-blur-md hover:border-amber-300/60">
                    {a}
                  </button>
                ))}
              </div>
            )}
            {talkOptions.length > 0 && (
              <div className="grid w-full gap-2 sm:grid-cols-3">
                {talkOptions.map((o) => (
                  <button key={o.prompt} type="button" onClick={() => pickTalk(o)} className="rounded-2xl border border-white/15 bg-slate-950/70 p-3 text-left text-sm text-white backdrop-blur-md hover:border-amber-300/60">
                    {o.prompt}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-1.5">
              {TALK_KINDS.map((k) => (
                <button
                  key={k.key}
                  type="button"
                  disabled={talkBusy !== null}
                  onClick={() => void fetchTalk(k.key)}
                  className="rounded-lg border border-white/15 bg-slate-950/55 px-2.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm hover:border-amber-300/50 hover:text-white disabled:opacity-50"
                >
                  {talkBusy === k.key ? 'Writing…' : k.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/45">About {focused ? `"${focused.title}"` : sessionTopic && sessionTopic !== 'General' ? sessionTopic : 'everyday life'}. Change the topic in the bar at the top.</p>
          </>
        )}
      </div>
    );
  } else if (view === 'show') {
    scene = shown ? (
      <div className="flex max-h-full w-full max-w-4xl flex-col gap-3 overflow-y-auto rounded-3xl border border-white/15 bg-slate-950/60 p-6 backdrop-blur-md">
        <ShownItem item={shown} />
        {shown.kind === 'video' && shown.videoId && (
          <button type="button" onClick={() => launch('video-player', shown)} className="flex items-center gap-1.5 self-start rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3.5 py-1.5 text-sm text-emerald-100 hover:bg-emerald-400/20">
            <ListChecks className="h-4 w-4" /> After watching: comprehension questions
          </button>
        )}
      </div>
    ) : (
      <div className="rounded-3xl border border-dashed border-white/40 bg-slate-950/40 px-10 py-8 text-center backdrop-blur-md">
        <p className="font-display text-3xl text-white">Drag something from the cargo hold</p>
        <p className="mt-2 text-white/70">…or search for it with Sources.</p>
      </div>
    );
  } else if (view === 'map') {
    scene = (
      <div className="relative h-full w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
        {mapMode === 'pins' ? (
          <>
            <DeckMap
              className="h-full w-full"
              pins={pinGame ? (pinGame.revealed ? [...pins, { id: `answer:${pinGame.city.id}`, lat: pinGame.city.lat, lng: pinGame.city.lng, label: pinGame.city.city, color: '#facc15' }] : []) : pins}
              detailed={detailedMap}
              onPinClick={pickPin}
              onPlaceClick={pinGame ? undefined : (name) => setPlacePick(name)}
              focusPoint={pinPick ? { lat: pinPick.pin.lat, lng: pinPick.pin.lng, zoom: detailedMap ? 11 : 6 } : null}
            />
            {placePick && !pinPick && (
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-2xl border border-white/15 bg-slate-950/85 p-3 backdrop-blur-md">
                <p className="text-sm text-white"><b>{placePick}</b></p>
                <span className="flex gap-2">
                  <button type="button" onClick={() => { makeFocus({ title: placePick }); flash(`New topic: ${placePick}`); setPlacePick(null); }} className="rounded-full border border-amber-300/60 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-300/20">Make it the topic</button>
                  <button type="button" onClick={() => setPlacePick(null)} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
                </span>
              </div>
            )}
            {pinPick && (
              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/15 bg-slate-950/85 p-3 backdrop-blur-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white"><b>{pinPick.pin.label ?? 'A student'}</b>&apos;s pin{pinPick.levels?.length ? ` · ${pinPick.levels[0].label}` : ''}</p>
                  <button type="button" onClick={() => setPinPick(null)} className="text-white/50 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300">Make it the topic</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {pinPick.levels === null && <span className="text-xs text-white/50">Finding the place…</span>}
                  {pinPick.levels?.length === 0 && <span className="text-xs text-white/50">No place name here (open sea?).</span>}
                  {pinPick.levels?.map((l) => (
                    <button
                      key={l.kind + l.label}
                      type="button"
                      onClick={() => { makeFocus({ title: l.label, credit: pinPick.pin.label }); setPinPick(null); }}
                      className="flex items-center gap-1 rounded-lg border border-amber-300/40 px-2.5 py-1 text-xs text-amber-100 hover:bg-amber-300/10"
                    >
                      <Crosshair className="h-3 w-3" /> {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : flightStage === 'gate' ? (
          <>
            <WorldFlightMap
              className="h-full w-full"
              origin={origin}
              rangeKm={position?.rangeKm ?? STARTER_PLANE_RANGE_KM}
              visitedIds={visitedList}
              journey={journeyLegs}
              selectedId={teachId || stayHome ? null : destination.id}
              souvenirs={mapSouvenirs}
              replayKey={replayKey}
              onReplayDone={() => setReplayRunning(false)}
              farId={teachId}
              onPlaceClick={(name) => setPlacePick(name)}
              onCityClick={(id, inRange) => {
                if (id === origin.id || stayHome) return;
                if (inRange && reachable.some((c) => c.id === id)) { setTeachId(null); setChosenId(id); }
                else if (!lockedId && SCENE_CITIES.some((c) => c.id === id)) setTeachId(id);
              }}
            />
            {placePick && (
              <div className="absolute left-1/2 top-3 z-[3] flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-slate-950/85 px-3 py-2 backdrop-blur-md">
                <p className="text-sm text-white"><b>{placePick}</b></p>
                <button type="button" onClick={() => { makeFocus({ title: placePick }); flash(`New topic: ${placePick}`); setPlacePick(null); }} className="rounded-full border border-amber-300/60 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100 hover:bg-amber-300/20">Make it the topic</button>
                <button type="button" onClick={() => setPlacePick(null)} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2 [&>*]:pointer-events-auto">
              {stayHomeCity ? (
                <div className="rounded-xl border border-white/15 bg-slate-950/85 px-3 py-2 backdrop-blur-md">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300">City lesson: {stayHomeCity.city}</p>
                  <p className="text-sm text-white/75">The class stays in {origin.city} for this one.</p>
                </div>
              ) : cardCity ? (
                <CityLessonsCard
                  city={cardCity}
                  originCity={origin.city}
                  km={Math.round(distanceBetweenCoordsKm(origin, cardCity))}
                  far={cardIsFar}
                  visited={visitedIds.has(cardCity.id)}
                  locked={!!lockedId || !!flightPlan}
                  onPickLesson={(focus) => setCityLesson({ cityId: cardCity.id, focusId: focus.id, title: focus.title, source: focus.sourceMaterial, staysIn: cardIsFar ? origin.city : null })}
                  onTravel={!cardIsFar && findTripDestination(cardCity.id, cardCity.city) ? () => { setPlanPreset('travel-60'); setPlanOpen(true); } : undefined}
                  onVote={cardIsFar ? undefined : () => void startCityPoll()}
                />
              ) : <span />}
              {!stayHome && !cardIsFar && (
                <button type="button" onClick={() => takeOff()} className="rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-2.5 font-display text-base text-[#1a1204] shadow-[0_10px_30px_rgba(255,160,60,.35)] hover:brightness-105">
                  Take off to {destination.city}
                </button>
              )}
            </div>
          </>
        ) : (
          <FlightTracker origin={origin} destination={destination} progress={routeT} minutesLeft={minutesLeft} below={below.name} holding={holding} preview={preview} minutesFlown={minutesFlown} />
        )}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2 [&>*]:pointer-events-auto">
          {mapMode === 'pins' && pinGame ? (
            <div className="w-[min(26rem,calc(100vw-3rem))] rounded-xl border border-amber-300/30 bg-slate-950/85 px-3 py-2.5 backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300">{pinGame.kind === 'where' ? 'Where in the world?' : 'Say hello like a local'}</p>
              {pinGame.kind === 'hello' && pinGame.word && (
                <p className="mt-1 font-display text-3xl text-white">“{pinGame.word.word}”</p>
              )}
              {pinGame.kind === 'where' && (
                <ol className="mt-1 space-y-1">
                  {pinGame.clues.slice(0, pinGame.shown).map((c, i) => (
                    <li key={c} className={`text-sm leading-snug ${i === pinGame.shown - 1 && !pinGame.revealed ? 'text-white' : 'text-white/65'}`}><span className="mr-1.5 font-mono text-xs text-amber-300">{i + 1}</span>{c}</li>
                  ))}
                </ol>
              )}
              {pinGame.revealed ? (
                <div className="mt-2 space-y-1 text-sm">
                  <p className="font-display text-xl text-amber-200">{pinGame.city.city}, {pinGame.city.country}</p>
                  {pinGame.word && <p className="text-white/80">“{pinGame.word.word}” means <b className="text-white">{pinGame.word.meaning}</b> in {pinGame.word.language}. Say it: <b className="text-white">{pinGame.word.say}</b></p>}
                  {pinGameGuesses[0] && <p className="text-white/80">Closest: <b className="text-white">{pinGameGuesses[0].name}</b>{pinGameGuesses[0].km < 50 ? ', spot on!' : `, ${pinGameGuesses[0].km.toLocaleString()} km away`}</p>}
                </div>
              ) : (
                <p className="mt-1.5 font-mono text-xs text-white/60">{pins.length} pin{pins.length === 1 ? '' : 's'} so far · hidden until the reveal</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {!pinGame.revealed && pinGame.kind === 'where' && pinGame.shown < pinGame.clues.length && (
                  <button type="button" onClick={() => setPinGame((g) => (g ? { ...g, shown: g.shown + 1 } : g))} className="rounded-lg border border-white/20 px-2.5 py-1 text-white/85 hover:text-white">Next clue</button>
                )}
                {!pinGame.revealed && <button type="button" onClick={revealPinGame} className="rounded-lg bg-amber-300 px-2.5 py-1 font-semibold text-slate-950">Reveal</button>}
                {pinGame.revealed && <button type="button" onClick={() => startPinGame(pinGame.kind)} className="rounded-lg bg-amber-300 px-2.5 py-1 font-semibold text-slate-950">Another one</button>}
                <button type="button" onClick={endPinGame} className="rounded-lg border border-white/20 px-2.5 py-1 text-white/70 hover:text-white">Done</button>
              </div>
            </div>
          ) : mapMode === 'pins' ? (
            <div className="rounded-xl border border-white/15 bg-slate-950/75 px-3 py-2 backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rose-300">{pinRound ? 'Pins open on your phones' : 'Class map'}</p>
              <p className="font-display text-lg text-white">{pinRound?.prompt ?? 'Pinned by the class'}</p>
              <p className="font-mono text-xs text-white/60">{pins.length} pin{pins.length === 1 ? '' : 's'}</p>
            </div>
          ) : flightStage === 'gate' && journeyKm > 0 ? (
            <div className="flex max-w-[60%] flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/15 bg-slate-950/80 px-3 py-1.5 backdrop-blur-md">
              <span className="text-sm text-white"><b className="font-semibold text-amber-200">{journeyKm.toLocaleString()} km</b> flown · <span className="text-white/65">{aroundTheEarth(journeyKm)}</span></span>
              <button type="button" disabled={replayRunning} onClick={() => { setReplayRunning(true); setReplayKey((k) => k + 1); }} className="flex items-center gap-1.5 rounded-lg border border-amber-300/40 px-2 py-0.5 text-xs text-amber-100 hover:bg-amber-300/10 disabled:opacity-50">
                <Plane className="h-3.5 w-3.5" /> {replayRunning ? 'Replaying…' : 'Replay our journey'}
              </button>
            </div>
          ) : <span />}
          <div className="flex flex-wrap justify-end gap-1.5">
            {mapMode === 'pins' && pinRound && (
              <button type="button" onClick={stopPins} className="rounded-lg border border-white/20 bg-slate-950/75 px-2.5 py-1 text-xs text-white/85 hover:text-white">Close pins</button>
            )}
            {mapMode === 'tracker' && flightStage !== 'gate' && (
              <button type="button" onClick={shrinkTracker} className="flex items-center gap-1 rounded-lg border border-white/20 bg-slate-950/75 px-2.5 py-1 text-xs text-white/85 hover:text-white">
                <Minimize2 className="h-3 w-3" /> Shrink to corner
              </button>
            )}
            {mapMode === 'pins' && (
              <button type="button" onClick={() => setDetailedMap((v) => !v)} className={`rounded-lg border px-2.5 py-1 text-xs ${detailedMap ? 'border-sky-300/60 bg-sky-300/15 text-sky-100' : 'border-white/20 bg-slate-950/75 text-white/85 hover:text-white'}`}>
                {detailedMap ? 'Detailed map' : 'Simple map'}
              </button>
            )}
            <button type="button" onClick={() => setMapMode(mapMode === 'pins' ? 'tracker' : 'pins')} className="rounded-lg border border-white/20 bg-slate-950/75 px-2.5 py-1 text-xs text-white/85 hover:text-white">
              {mapMode === 'pins' ? 'Flight tracker' : 'Class map'}
            </button>
            {mapMode === 'pins' && !pinRound && PIN_PROMPTS.map((q) => (
              <button key={q} type="button" onClick={() => startPins(q)} className="rounded-lg border border-white/20 bg-slate-950/75 px-2.5 py-1 text-xs text-white/85 hover:text-white">{q}</button>
            ))}
            {mapMode === 'pins' && !pinRound && (
            <form onSubmit={(e) => { e.preventDefault(); askCustom(); }} className="flex items-center gap-1">
              <input
                value={customPin}
                onChange={(e) => setCustomPin(e.target.value.slice(0, 120))}
                placeholder="Your own question…"
                aria-label="Your own class map question"
                className="w-44 rounded-lg border border-white/20 bg-slate-950/75 px-2.5 py-1 text-xs text-white placeholder:text-white/40 focus:border-rose-300/60 focus:outline-none"
              />
              {customPin.trim() && <button type="submit" className="rounded-lg border border-rose-300/50 px-2 py-1 text-xs text-rose-100 hover:bg-rose-300/10">Ask</button>}
            </form>
            )}
          </div>
        </div>
      </div>
    );
  } else if (view === 'game') {
    scene = runningKey ? null : (
      <div className="rounded-3xl border border-dashed border-white/40 bg-slate-950/40 px-10 py-8 text-center backdrop-blur-md">
        <p className="font-display text-3xl text-white">Drop an activity here</p>
        <p className="mt-2 text-white/70">Drag a stamp from the panel, or onto a cargo item to build it from that.</p>
      </div>
    );
  } else {
    scene = (
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-slate-950/70 p-5 backdrop-blur-md">
        <Leaderboard displayMode="competitive" />
      </div>
    );
  }

  const snapHosts: SnapHost[] = [
    { id: 'wind', ref: windRef, anchors: SNAP_ANCHORS },
    ...(presenting ? [] : [
      { id: 'cargo', ref: cargoRef, anchors: ['tl', 'bl'] as SnapAnchor[] },
      { id: 'cabin', ref: cabinRef, anchors: ['tr', 'br'] as SnapAnchor[] },
    ]),
  ];

  const windscreen = (
    <div
      ref={windRef}
      data-deck-drop="wind"
      className={[
        'overflow-hidden transition-[filter] duration-300',
        presenting ? 'fixed inset-0 z-[60] rounded-none' : 'absolute inset-0 rounded-[30px_30px_18px_18px]',
        hot(hotZone, 'wind') ? 'brightness-110 saturate-125' : '',
      ].join(' ')}
      style={{ background: '#0b1a33' }}
    >
      {/* The windscreen is one flight: gate → take-off → cruise → cloud reveal → landing. */}
      {/* waits for the class's real starting city (it showed the home city's skyline first, then jumped) */}
      {position ? (
        <WindscreenFlight
          stage={flightStage}
          origin={origin}
          destination={destination}
          timeOfDay={skyNow.timeOfDay}
          sun={skyNow.sun}
          moon={skyNow.moon}
          cities={distantCities}
          landmarks={stableLandmarks}
          scenicLandmark={scenicLandmark}
          arrivalScenic={descending ? arrivalLandmark : null}
          waters={routeWaters}
          coast={routeCoast}
          highGround={routeGround}
          events={stableEvents}
        iss={issActive}
        sky={{
          realPlane,
          livePlanes: nearby !== null,
          planet: nightSky?.planet ? { rel: ((nightSky.planet.azimuth - skyNow.sun.heading + 540) % 360) - 180, elevation: nightSky.planet.elevation, bright: nightSky.planet.name === 'Venus' || nightSky.planet.name === 'Jupiter', name: nightSky.planet.name, highlight: liveNow?.id === `planet:${nightSky.planet.name}` } : null,
          meteors: !!nightSky?.shower,
          aurora: !!nightSky?.aurora,
          test: skyTest,
        }}
          weather={liveWx?.condition ?? (flightStage === 'gate' || (minutesFlown ?? 0) < 3 ? rollWeather(`${sessionId}:${origin.id}`, origin.scene, skyNow.timeOfDay === 'night') : rollWeather(`${sessionId}:${destination.id}`, destination.scene, skyNow.timeOfDay === 'night'))}
          cloudCover={liveWx?.cloudCover}
          terrain={steadyGround.terrain}
          region={steadyGround.region}
          calm={view !== 'boarding' && view !== 'talk'}
          turbulence={shaking}
          paused={runningKey === 'video-player'}
          planeKey={position?.planeKey ?? null}
          altitude={descentAltitude}
          onCinematic={setCinematic}
          onLanded={() => { setLanded(true); play('arrivalResolve'); }}
        />
      ) : <div aria-hidden className="absolute inset-0 bg-[#0B1220]" />}
      {factsOpen && focused && brief?.cards?.length && !cinematic && !(landed && !hall) && view !== 'boarding' && view !== 'map' ? (
        <FactsBoard
          title={focused.title}
          cards={brief.cards}
          pictures={cardPics[focused.id] ?? []}
          onAsk={(q) => { setFactsOpen(false); setTalkPrompt(q); setTalkFollowUps([]); setTalkVote(null); setView('talk'); fetchAnswer(q, brief.cards?.find((c) => c.questions?.includes(q))); }}
          onDive={(c) => { setFactsOpen(false); makeFocus({ title: c.headline.replace(/[.!]+$/, ''), text: c.detail || undefined }); }}
          onVote={(q) => {
            setFactsOpen(false); setTalkPrompt(q); setTalkFollowUps([]); setTalkVote(null); setView('talk');
            const card = brief.cards?.find((c) => c.questions?.includes(q));
            fetchAnswer(q, card);
            const open = (options: string[]) => void startPoll(q, options, { askWhy: true, purpose: 'talk-vote' }, 'Vote open on phones: pick one, then say why');
            const ready = quickVoteOptions(q);
            if (ready || isMockMode()) { open(ready ?? ['Yes', 'No']); return; }
            flash('Writing the choices…');
            void fetch('/api/live-room/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'choices', question: q, fact: card ? `${card.headline}. ${card.detail ?? ''}` : '', topic: focused?.title ?? '', junior: !!junior }) })
              .then((r) => (r.ok ? r.json() : null)).then((d: { options?: string[] } | null) => { if (d?.options?.length) open(d.options); else flash('Could not write choices for this one: try Everyone answers'); })
              .catch(() => flash('Could not write choices for this one: try Everyone answers'));
          }}
          onBoard={(q) => { setFactsOpen(false); openTool('class-board', window.innerWidth / 2, window.innerHeight * 0.8); window.setTimeout(() => window.dispatchEvent(new CustomEvent('lc-board-question', { detail: { question: q } })), 150); flash('Everyone answers on their phones: the answers gather on the Class Board'); }}
          onQuiz={() => { setFactsOpen(false); launch('flash-quiz', focused); }}
          onClose={() => setFactsOpen(false)}
        />
      ) : null}
      {focused && !cinematic && !(landed && !hall) && view !== 'boarding' && view !== 'map' && (
        <div className="absolute inset-x-0 top-3 z-10 flex flex-col items-center gap-2 px-4">
          <button type="button" onClick={() => setAboutOpen((o) => !o)} title="What this topic is about" className="max-w-[70%] truncate rounded-full border border-white/20 bg-slate-950/65 px-3 py-1 text-xs text-white/90 backdrop-blur-md hover:border-amber-300/60">
            <b className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">Now talking about</b>&nbsp; {focused.title}{lens ? <span className="text-sky-200/90"> · through {lensById(lens)?.label}</span> : null}
          </button>
          {/* Clear screen keeps only the topic name: no facts button, no next topics */}
          {(brief?.cards?.length ?? 0) > 0 && !factsOpen && !clearScreen && (
            <button type="button" onClick={() => setFactsOpen(true)} className="rounded-full border border-amber-300/40 bg-slate-950/65 px-3 py-1 text-xs text-amber-100 backdrop-blur-md hover:bg-amber-300/10">Show the facts</button>
          )}
          {!aboutOpen && !clearScreen && ((brief?.nextTopics?.length ?? 0) > 0 || earlierTopics.length > 0) && (
            <div className="flex max-w-[86%] flex-wrap items-center justify-center gap-1.5 text-[11px]">
              {(brief?.nextTopics?.length ?? 0) > 0 && <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55">Where next?</span>}
              {(brief?.nextTopics ?? []).map((t) => (
                <button key={t.title} type="button" onClick={() => { makeFocus({ title: t.title }); setTf((x) => ({ ...x, whereNext: true })); }} title={`${t.link}: make it the topic`} className="rounded-full border border-white/15 bg-slate-950/55 px-2.5 py-0.5 text-white/85 backdrop-blur-sm hover:border-amber-300/60 hover:text-white">
                  <span className="text-amber-200/80">{t.link}:</span> {t.title}
                </button>
              ))}
              {earlierTopics.map((m) => (
                <button key={m.id} type="button" onClick={() => setFocusId(m.id)} title="Go back to this topic" className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-0.5 text-white/60 backdrop-blur-sm hover:text-white">
                  <Undo2 className="h-3 w-3" /> {m.title.length > 32 ? `${m.title.slice(0, 31)}…` : m.title}
                </button>
              ))}
            </div>
          )}
          {aboutOpen && (
            <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-slate-950/90 p-4 text-left text-sm text-white/90 shadow-2xl backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                  {focused.kind === 'video'
                    ? (focused.text && !focused.aiNotes ? 'About this video · from the whole video' : 'About this video · from its title only')
                    : 'About this topic'}
                </span>
                <button type="button" onClick={() => setAboutOpen(false)} aria-label="Close" className="text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              {focusBrief === 'loading' && <p className="text-white/70">Reading it…</p>}
              {focusBrief === 'failed' && <p className="text-white/70">No summary this time.</p>}
              {brief && (
                <>
                  <p className="leading-relaxed">{brief.briefing}</p>
                  {brief.facts.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-white/80">{brief.facts.slice(0, 4).map((f) => <li key={f}>{f}</li>)}</ul>
                  )}
                  {brief.reference && (
                    <p className="mt-2 text-xs text-white/55">Facts from Wikipedia: {brief.reference.title}{brief.reference.ending && !endingAdded[focused.id] ? ' · the ending is kept back' : ''}</p>
                  )}
                </>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                <span className="text-xs text-white/60">How deep?</span>
                {([['big', 'Big idea', 'Broad questions anyone can answer'], ['deep', 'Deep dive', 'Into the subject itself: its works, people and events']] as const).map(([d, label, hint]) => (
                  <button
                    key={d}
                    type="button"
                    title={hint}
                    disabled={focusBrief === 'loading'}
                    onClick={() => {
                      if (d === depth) return;
                      setBriefs((b) => { const n = { ...b }; delete n[focused.id]; return n; });
                      setDepth(d);
                      flash(d === 'deep' ? 'Deep dive: activities go into the subject itself' : 'Big idea: broad questions anyone can answer');
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${d === depth ? 'border-amber-300 bg-amber-300 text-slate-950' : 'border-white/20 text-white/80 hover:border-white/40'}`}
                  >
                    {label}
                  </button>
                ))}
                {brief?.reference?.ending && !endingAdded[focused.id] && (
                  <button
                    type="button"
                    onClick={() => {
                      updateItem(sessionId, focused.id, { text: `${focused.text ?? brief.reference!.text}\n\nHow it ends:\n${brief.reference!.ending}` });
                      setEndingAdded((e) => ({ ...e, [focused.id]: true }));
                      flash('The ending is now part of the material');
                    }}
                    className="ml-auto rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 hover:border-white/40"
                  >
                    Add the ending
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {liveNow && !issActive && !runningKey && !cinematic && view !== 'map' && !momentCard && (
        <div className="absolute bottom-20 left-4 z-[7] flex items-center">
          <button type="button" onClick={() => { setLiveMoments((xs) => xs.filter((x) => x.id !== liveNow.id)); openMoment({ id: `live:${liveNow.id}`, at: minutesFlown ?? 0, kind: 'event', title: liveNow.title, where: liveNow.where, question: liveNow.question, ...(liveNow.fact ? { fact: liveNow.fact } : {}) }); }} className="flex items-center gap-1.5 rounded-full border border-sky-200/60 bg-slate-950/75 px-3 py-1 text-xs font-semibold text-sky-100 backdrop-blur-sm hover:bg-sky-200/15">
            <Eye className="h-3.5 w-3.5" /> Look: {liveNow.title.charAt(0).toUpperCase() + liveNow.title.slice(1)} · {liveNow.where}
          </button>
          <button type="button" onClick={() => setLiveMoments((xs) => xs.filter((x) => x.id !== liveNow.id))} aria-label="Dismiss" className="ml-1 rounded-full border border-white/20 bg-slate-950/70 p-1 text-white/60 backdrop-blur-sm hover:text-white"><X className="h-3 w-3" /></button>
        </div>
      )}
      {issActive && !runningKey && !cinematic && view !== 'map' && !momentCard && (
        <div className="absolute bottom-20 left-4 z-[7] flex items-center">
          <button type="button" onClick={() => openMoment({ id: `iss:${issActive.start}`, at: minutesFlown ?? 0, kind: 'landmark', title: 'the International Space Station', where: issActive.where, question: 'Would you like to live on the space station? What would you miss?' })} className="flex items-center gap-1.5 rounded-full border border-sky-200/70 bg-slate-950/75 px-3 py-1 text-xs font-semibold text-sky-100 backdrop-blur-sm hover:bg-sky-200/15">
            <Satellite className="h-3.5 w-3.5" /> Look up: the International Space Station · {issActive.where}
          </button>
          <button type="button" onClick={() => setIssPass((p) => (p ? { ...p, start: p.start - ISS_PASS_MS } : p))} aria-label="Dismiss" className="ml-1 rounded-full border border-white/20 bg-slate-950/70 p-1 text-white/60 backdrop-blur-sm hover:text-white"><X className="h-3 w-3" /></button>
        </div>
      )}
      {!runningKey && !cinematic && view !== 'map' && !momentCard && (momentDue || momentUpcoming) && (
        <div className="absolute bottom-11 left-4 z-[7] flex items-center">
          {momentDue ? (
            <button type="button" onClick={() => openMoment(momentDue)} className="flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-slate-950/75 px-3 py-1 text-xs font-semibold text-amber-100 backdrop-blur-sm hover:bg-amber-300/15">
              <Eye className="h-3.5 w-3.5" /> Look outside: {momentDue.title}{momentDue.where ? ` · ${momentDue.where}` : ''}
            </button>
          ) : momentUpcoming && (
            <button type="button" onClick={() => openMoment(momentUpcoming)} className="flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/55 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-white/80 backdrop-blur-sm hover:bg-white/10">
              <Eye className="h-3.5 w-3.5" /> Coming up: {momentUpcoming.title}{momentUpcoming.where ? ` · ${momentUpcoming.where}` : ''} · in {Math.max(1, Math.ceil(momentUpcoming.at - (minutesFlown ?? 0)))} min
            </button>
          )}
          <button type="button" onClick={() => { const m = momentDue ?? momentUpcoming; if (m) setMomentsShown((x) => [...x, m.id]); }} aria-label="Dismiss" className="ml-1 rounded-full border border-white/20 bg-slate-950/70 p-1 text-white/60 backdrop-blur-sm hover:text-white"><X className="h-3 w-3" /></button>
        </div>
      )}
      {photo && (
        <PhotoMoment
          image={photo.image}
          caption={photo.caption}
          onTalk={() => { setTalkPrompt(`Describe our photo of ${photo.name}. What can you see?`); setTalkFollowUps(['What is the weather like?', 'Would you like to go there? Why?']); setTalkVote(null); setView('talk'); setPhoto(null); }}
          onEveryone={() => { everyoneAnswers(`What can you see in our photo of ${photo.name}?`); setPhoto(null); }}
          onClose={() => setPhoto(null)}
        />
      )}
      {momentCard && !runningKey && !cinematic && (
        <div className="absolute inset-0 z-[12] flex items-center justify-center p-6">
          <div className={`w-full ${'max-w-xl'} max-h-full overflow-y-auto rounded-2xl border border-white/15 bg-slate-950/90 text-white shadow-2xl backdrop-blur-md`}>
            {momentCard.picture && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={momentCard.picture.imageUrl} alt={momentCard.picture.title} className="h-64 w-full bg-black/30 object-contain" />
            )}
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl leading-tight">{momentCard.moment.title.replace(/^the /, 'The ')}</p>
                  {momentCard.moment.where && <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-amber-200/80">{momentCard.moment.where}</p>}
                </div>
                <button type="button" onClick={() => setMomentCard(null)} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              {momentCard.loading && momentCard.facts.length === 0 && <p className="text-sm text-white/60">Looking it up…</p>}
              <ul className="list-disc space-y-1 pl-5 text-[15px] text-white/85">{momentCard.facts.map((f) => <li key={f}>{f}</li>)}</ul>
              <p className="rounded-xl bg-amber-300/10 px-3 py-2 text-[15px] text-amber-100">{momentQuestion(momentCard.moment)}</p>
              <div className="flex items-center justify-between gap-2 pt-1">
                {momentCard.picture ? <span className="truncate text-[10px] text-white/40">{momentCard.picture.credit}</span> : <span />}
                <span className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => { everyoneAnswers(momentQuestion(momentCard.moment)); setMomentCard(null); }} className="rounded-full border border-sky-300/50 px-3 py-1 text-xs text-sky-100 hover:bg-sky-300/10">Everyone answers</button>
                  <button type="button" onClick={() => { makeFocus({ title: momentCard.moment.title.replace(/^the /, ''), text: momentCard.facts.join(' ') || undefined, where: flightWhere }); setMomentCard(null); }} className="shrink-0 rounded-full border border-amber-300/50 px-3 py-1 text-xs text-amber-100 hover:bg-amber-300/10">
                    Make it the topic
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {descending && !cinematic && view !== 'map' && (
        <p className="pointer-events-none absolute right-4 top-3 z-[6] flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-slate-950/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-amber-100 backdrop-blur-sm">
          <PlaneLanding className="h-3.5 w-3.5" /> Descending · arrival in {Math.max(1, Math.ceil(minutesLeft ?? 0))} min
        </p>
      )}
      {flightStage === 'flying' && !cinematic && below.name && view !== 'map' && (
        <p className="absolute bottom-3 left-4 z-[5] max-w-[88%] truncate rounded-full border border-white/20 bg-slate-950/55 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
          {holding ? `Holding over ${destination.city}` : (
            <>
              Below us:{' '}
              {belowItems.map((it, i) => (
                <span key={`${it.text}-${i}`}>
                  {i > 0 && ' · '}
                  {it.topic ? (
                    <button type="button" onClick={() => { makeFocus({ title: it.topic!, ...(it.about ? { text: it.about } : {}), where: flightWhere }); flash(`New topic: ${it.topic}`); }} title={`Make ${it.topic} the topic`} className="uppercase underline decoration-white/30 underline-offset-2 hover:text-amber-200 hover:decoration-amber-300">{it.text}</button>
                  ) : it.text}
                </span>
              ))}
              {chasing && (
                <>
                  {' · '}
                  <button type="button" onClick={() => { makeFocus({ title: 'Chasing the sun', text: CHASING_THE_SUN }); flash('New topic: Chasing the sun'); }} title="What does chasing the sun mean?" className="uppercase underline decoration-white/30 underline-offset-2 hover:text-amber-200 hover:decoration-amber-300">We&apos;re chasing the sun</button>
                </>
              )}
              {nextStop && (
                <>
                  {' · Next: '}
                  <button type="button" onClick={() => { const topic = stopTopic(nextStop.text); makeFocus({ title: topic, where: flightWhere }); flash(`New topic: ${topic}`); }} title="Make it the topic" className="uppercase underline decoration-white/30 underline-offset-2 hover:text-amber-200 hover:decoration-amber-300">{nextStop.text.toLowerCase()}</button>
                  {` in ${Math.max(1, Math.round(nextStop.at - (minutesFlown ?? 0)))} min`}
                </>
              )}
            </>
          )} · {liveWx?.utcOffsetSeconds !== undefined ? offsetClock(liveWx.utcOffsetSeconds, new Date(now)) : skyNow.clock}{liveWx ? ` · ${liveWx.label}` : ''}
        </p>
      )}

      {citySuggestion && flightStage === 'gate' && !cinematic && (
        <div className="absolute inset-x-0 top-16 z-20 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-cyan-300/40 bg-slate-950/85 py-1.5 pl-4 pr-1.5 text-sm text-cyan-50 shadow-xl backdrop-blur-md">
            <span>{citySuggestion.text}</span>
            <button type="button" onClick={() => setChosenId(citySuggestion.fly.id)} className="rounded-full bg-cyan-300 px-4 py-1.5 text-xs font-semibold text-slate-950">Fly to {citySuggestion.fly.city}</button>
          </div>
        </div>
      )}

      {lastTime && !lastTimeDismissed && flightStage === 'gate' && !cinematic && !pendingPlan && (
        <div className={`absolute inset-x-0 z-20 flex justify-center px-4 ${citySuggestion ? 'top-28' : 'top-16'}`}>
          <div className="flex max-w-3xl flex-wrap items-center gap-2 rounded-2xl border border-emerald-300/40 bg-slate-950/85 py-1.5 pl-4 pr-1.5 text-sm text-emerald-50 shadow-xl backdrop-blur-md">
            <span className="min-w-0">
              <b className="font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-300">Last time</b>&nbsp;
              {lastTime.entry.topics.length ? lastTime.entry.topics.slice(-3).join(' → ') : lastTime.entry.activities.slice(0, 2).join(', ')}
              {lastTime.entry.words.length > 0 && <span className="text-emerald-100/70"> · {lastTime.entry.words.length + lastTime.entry.moreWords} words</span>}
            </span>
            {lastTime.entry.topics.length > 0 && (
              <button type="button" onClick={() => { makeFocus({ title: lastTime.entry.topics[lastTime.entry.topics.length - 1] }); setLastTimeDismissed(true); }} className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-slate-950">
                Pick up {lastTime.entry.topics[lastTime.entry.topics.length - 1].slice(0, 28)}
              </button>
            )}
            {lastTime.entry.words.length >= 3 && (
              <button type="button" onClick={() => { makeFocus({ title: "Last lesson's words", text: `Review these words from last lesson: ${lastTime.entry.words.join(', ')}.` }); setLastTimeDismissed(true); }} className="rounded-full border border-emerald-300/60 px-3 py-1 text-xs font-semibold text-emerald-100 hover:bg-emerald-300/10">
                Warm up with its words
              </button>
            )}
            <button type="button" aria-label="Dismiss last time" onClick={() => setLastTimeDismissed(true)} className="rounded-full px-2 py-1 text-xs text-emerald-100/60 hover:text-emerald-50">Not now</button>
          </div>
        </div>
      )}

      {pendingPlan && !runningKey && !cinematic && !landed && (
        <div className="absolute inset-x-0 top-3 z-20 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-amber-300/50 bg-slate-950/85 py-1.5 pl-4 pr-1.5 text-sm text-amber-50 shadow-xl backdrop-blur-md">
            <span><b className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300">Ready</b>&nbsp; {pendingPlan.name} · {pendingPlan.topic} → {destination.city}</span>
            <button type="button" onClick={pendingPlan.onStart} className="rounded-full bg-amber-300 px-4 py-1.5 text-xs font-semibold text-slate-950">Start flight plan</button>
          </div>
        </div>
      )}

      {panel === 'logbook' && (
        <LessonLogbookDrawer
          memory={lessonMemory.snapshot}
          currentTopic={focused?.title ?? null}
          lastTime={lastTime?.entry ?? null}
          onClose={() => setPanel(null)}
          onBackTo={(title) => {
            // The room's own item when it's still here (keeps its briefing), else a new topic with that title.
            const item = [...material].reverse().find((m) => m.title === title);
            if (item) { setFocusId(item.id); flash(`Back to ${title}`); }
            else makeFocus({ title });
            setPanel(null);
          }}
        />
      )}
      {recordTab && (
        <WorldFlightRecordPanel
          sessionId={sessionId}
          className={className}
          initialTab={recordTab}
          canLaunch={!flightPlan && flightStage === 'gate' && !stayHome}
          onStartDesignMission={(id) => void startDesignMission(id)}
          onPlaneVote={(planes) => { setRecordTab(null); void startPoll('Which plane should we fly next?', planes, { purpose: 'plane-choice' }, 'Vote open on phones: choose our plane'); }}
          onClose={() => setRecordTab(null)}
        />
      )}
      {cityLesson && (
        <FlightPlanPanel
          fitCtx={fitCtx}
          sessionId={sessionId}
          destinationCity={SCENE_CITIES.find((c) => c.id === cityLesson.cityId)?.city ?? destination.city}
          destinationId={cityLesson.cityId}
          minutesLeft={null}
          cityLesson={cityLesson}
          onClose={() => setCityLesson(null)}
          onLaunch={(plan, info) => {
            const lesson = cityLesson;
            setCityLesson(null);
            recordActivity(`City lesson: ${lesson.title}`);
            onLaunchPlan(plan);
            if (lesson.staysIn) {
              flash(`City lesson: ${lesson.title}. The class stays in ${lesson.staysIn}`);
              teachFromHere(lesson.cityId, lesson.focusId);
              setView('show');
            } else {
              setTeachId(null);
              takeOff(info?.usesCityLesson ? lesson.focusId : undefined);
            }
          }}
        />
      )}
      {planOpen && (
        <FlightPlanPanel
          fitCtx={fitCtx}
          sessionId={sessionId}
          destinationCity={destination.city}
          destinationId={destination.id}
          minutesLeft={flightStage === 'flying' ? minutesLeft : null}
          initialPresetId={planPreset}
          onClose={() => { setPlanOpen(false); setPlanPreset(undefined); }}
          onLaunch={(plan) => {
            setPlanOpen(false);
            setPlanPreset(undefined);
            recordActivity(`Flight plan: ${plan.customTopic}`);
            // Mid-air: a new flight plan, not a new take-off.
            flash(flightStage === 'flying' ? `Captain's announcement: new flight plan, ${plan.customTopic}` : `Flight plan ready: ${plan.customTopic}`);
            onLaunchPlan(plan);
          }}
        />
      )}

      {/* The running module lives here in the Game view; elsewhere it stays mounted off-screen. */}
      {/* pb-16 keeps the floating "End activity" pill clear of the game's last buttons */}
      <div
        className={view === 'game' && runningKey ? `absolute inset-0 overflow-y-auto p-4 pb-16 sm:p-6 sm:pb-16 ${gameGlass ? 'lc-game-glass' : ''}` : 'hidden'}
        style={zoomLayout && sceneZoom > 1 ? { zoom: Math.min(1.35, sceneZoom) } : undefined}
      >
        {runningKey ? moduleHost : null}
      </div>

      {scene !== null && !cinematic && !(landed && !hall) && flightStage !== 'landing' && (
        <AnimatePresence mode="wait">
          <motion.div
            key={view + (shown?.id ?? '')}
            initial={reduce ? false : { opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center p-6"
            // Zoom layout: grow the content with the (much bigger) windscreen so it reads on a phone in Zoom.
            // (Not the map: a CSS zoom puts the map's mouse position out, so dragging and clicking miss.)
            style={sceneZoom !== 1 && view !== 'map' ? { zoom: sceneZoom } : undefined}
          >
            {!(clearScreen && view === 'talk') && !(factsOpen && (brief?.cards?.length ?? 0) > 0) && scene}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Instruments dragged onto the windscreen */}
      {huds.map((h) => {
        const pos = hudPos[h] ?? { x: 85, y: 15 };
        return (
          <div
            key={h}
            data-deck-drag={`hud:${h}`}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none rounded-2xl border border-white/20 bg-slate-950/70 px-4 py-2 text-center backdrop-blur-md"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <p className="font-mono text-2xl font-semibold text-white">{readings[h].value}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/65">{INSTRUMENT_LABEL[h]}</p>
            <button
              type="button"
              onClick={() => setHuds((x) => x.filter((y) => y !== h))}
              className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-slate-950 text-[10px] text-white/70"
              aria-label={`Hide ${INSTRUMENT_LABEL[h]}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      {testFlightOffer && !testFlight && view === 'boarding' && !cinematic && (
        <div className="absolute inset-x-0 top-3 z-[16] flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-sky-300/50 bg-slate-950/90 py-1.5 pl-4 pr-1.5 text-sm text-sky-50 shadow-xl backdrop-blur-md">
            <GraduationCap className="h-4 w-4 text-sky-300" />
            First lesson? Try a test flight with pretend students · 3 min
            <button type="button" onClick={startTestFlight} className="rounded-full bg-sky-300 px-3 py-1 text-xs font-semibold text-slate-950">Start</button>
            <button type="button" onClick={() => { setTestFlightOffer(false); try { localStorage.setItem(TEST_FLIGHT_DONE_KEY, '1'); } catch { /* storage blocked */ } }} className="px-1 text-xs text-white/55 hover:text-white">No thanks</button>
          </div>
        </div>
      )}
      {/* Boarding walk-up: shows only while someone is walking up the airstairs (any view). */}
      {!cinematic && !landed && walkingIds.size > 0 && (
        <div className="pointer-events-none absolute inset-x-6 bottom-3 z-[15]">
          <BoardingLane planeKey={position?.planeKey ?? null} arrivals={arrivals.filter((a) => walkingIds.has(a.id))} onBoarded={onBoarded} />
        </div>
      )}

      {spotlightP && (
        <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-amber-300/60 bg-slate-950/75 py-1.5 pl-1.5 pr-4 backdrop-blur-md">
          <CrewAvatar seed={spotlightP.avatar_seed ?? spotlightP.display_name} name={spotlightP.display_name} size={34} className="rounded-full" />
          <span className="font-display text-lg text-white">{spotlightP.display_name}</span>
          <button type="button" onClick={() => setSpotlight(null)} aria-label="Clear spotlight" className="text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      )}

      {landed && !hall && (
        <div className="absolute inset-x-0 top-10 z-20 flex justify-center">
          <motion.div initial={reduce ? false : { y: -20, rotate: -6, opacity: 0 }} animate={{ y: 0, rotate: -2, opacity: 1 }} className="rounded-2xl bg-[#f4efe3] px-7 py-5 text-[#1b2233] shadow-2xl">
            <p className="font-display text-3xl">Welcome to {destination.city}</p>
            {/* Local time and the real weather there right now, big enough to read from the back. */}
            <p className="mt-1 font-mono text-sm text-[#1b2233]/75">
              {liveWx?.utcOffsetSeconds !== undefined ? offsetClock(liveWx.utcOffsetSeconds, new Date(now)) : skyNow.clock} local time
              {liveWx?.temperatureC !== undefined ? ` · ${liveWx.temperatureC}°C` : ''}{liveWx ? ` · ${liveWx.label}` : ''}
            </p>
            <ArrivalCards cityId={destination.id} city={destination.city} onClassVote={(options) => void startPoll(`What shall we explore in ${destination.city}?`, options, { purpose: 'arrival-card' }, 'Vote open on phones: food, sights or local words?')} />
            <p className="mt-3 text-sm">Passport stamped. Thanks for flying with {className}!</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1b2233]/60">Today&apos;s flight · {journeyPaths.length} flight{journeyPaths.length === 1 ? '' : 's'} so far</p>
            <WorldFlightMap still className="mt-1 h-44 w-[min(420px,70vw)] overflow-hidden rounded-xl" origin={destination} rangeKm={0} visitedIds={visitedList} journey={landingJourney} selectedId={null} souvenirs={mapSouvenirs} />
            {landingRecord?.landing && <LandingRewards landing={landingRecord.landing} sessionId={sessionId} />}
            {landingMilestone && <p className="mt-2 flex items-center gap-2 rounded-xl bg-amber-300/30 px-3 py-2 text-sm font-semibold text-[#1b2233]"><Plane className="h-4 w-4" />Milestone: {landingMilestone.text}!</p>}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {nextReachable.length > 1 && <button type="button" onClick={() => void startNextCityPoll()} className="rounded-full border border-[#1b2233]/25 px-4 py-1.5 text-sm text-[#1b2233] hover:bg-[#1b2233]/5">Vote: where next?</button>}
              {landingRecord?.landing?.after.claimableTier != null && <button type="button" onClick={() => setRecordTab('hangar')} className="rounded-full border border-[#1b2233]/25 px-4 py-1.5 text-sm text-[#1b2233] hover:bg-[#1b2233]/5">Hangar</button>}
              <button type="button" onClick={() => setRecordTab('passport')} className="rounded-full border border-[#1b2233]/25 px-4 py-1.5 text-sm text-[#1b2233] hover:bg-[#1b2233]/5">Passport</button>
              <button type="button" onClick={() => setHall(true)} className="rounded-full border border-[#1b2233]/25 px-4 py-1.5 text-sm text-[#1b2233] hover:bg-[#1b2233]/5">Arrivals hall</button>
              <button type="button" onClick={() => onCompleteSession(destination.id)} className="rounded-full bg-[#1b2233] px-4 py-1.5 text-sm text-[#f4efe3] hover:bg-[#1b2233]/85">End class</button>
            </div>
          </motion.div>
        </div>
      )}
      {landed && hall && (
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2 rounded-full border border-amber-200/40 bg-slate-950/80 px-3 py-1.5 text-xs text-amber-100 backdrop-blur-md">
          <span>Arrivals hall · {destination.city}</span>
          <button type="button" onClick={() => onCompleteSession(destination.id)} className="rounded-full bg-amber-300 px-3 py-1 font-semibold text-slate-950">End class</button>
        </div>
      )}

      {presenting && (
        <button type="button" onClick={() => setPresenting(false)} className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-lg border border-white/20 bg-slate-950/70 px-3 py-1.5 text-xs text-white/80">
          <Minimize2 className="h-3.5 w-3.5" /> Exit presenting (Esc)
        </button>
      )}
      {!presenting && dragging && hot(hotZone, 'wind') && (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-mono text-xs uppercase tracking-[0.16em] text-white/85">Drop to show the class</p>
      )}
    </div>
  );

  return (
    <motion.div style={{ x: shake.x, y: shake.y, rotate: shake.rotate }} className={`relative grid h-[100dvh] ${zoomLayout ? 'grid-cols-[48px_minmax(0,1fr)_48px] grid-rows-[46px_minmax(0,1fr)_56px] gap-2' : 'grid-cols-[220px_minmax(0,1fr)_240px] grid-rows-[52px_minmax(0,1fr)_176px] gap-2.5'} bg-[radial-gradient(ellipse_120%_70%_at_50%_120%,#1b2438_0%,#0b1120_55%,#05070D_100%)] p-2.5 text-white`}>
      <SnapGuides hosts={snapHosts} />
      {/* Until the class's city is known, cover the room: otherwise it shows LC International for a moment first. */}
      <AnimatePresence>
        {!position && (
          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0 z-[90] flex items-center justify-center bg-[#060b14]">
            <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-white/50"><Plane className="h-4 w-4" /> Boarding</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {shaking && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-0 top-16 z-[70] flex justify-center">
            <motion.span
              animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-2 rounded-full border border-amber-300/60 bg-slate-950/85 px-5 py-2 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-amber-200 shadow-2xl"
            >
              <TriangleAlert className="h-4 w-4" aria-hidden /> Fasten seatbelts · Turbulence
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
      <WidgetShell id={QR_WIDGET} label={`Board ${className}`} icon={<QrCode className="h-4 w-4" />} defaultOpen={false}>
        <div className="flex items-center gap-3 p-3">
          <span className="shrink-0 rounded-xl bg-white p-2"><QRCodeSVG value={joinUrl} size={132} level="M" includeMargin={false} /></span>
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight text-white">Scan to board</p>
            <CopyLinkText url={joinUrl} className="mt-1 font-mono text-[11px] text-white/60" />
            <p className="mt-2 font-mono text-xs font-semibold text-emerald-300">{seated.length} aboard</p>
            {newest && <p className="truncate text-xs text-white/70">{newest.display_name} just boarded</p>}
          </div>
        </div>
      </WidgetShell>
      <WidgetShell id={FLIGHT_WIDGET} label={`${origin.city} → ${destination.city}`} icon={<Plane className="h-4 w-4" />} defaultOpen={false}>
        <div className="relative h-52 w-full">
          <FlightTracker compact origin={origin} destination={destination} progress={routeT} minutesLeft={flightStage === 'gate' ? null : minutesLeft} below={below.name} holding={holding} />
          <button type="button" onClick={() => { closeWidgetStore(FLIGHT_WIDGET); setMapMode('tracker'); setView('map'); }} className="absolute right-2 top-2 flex items-center gap-1 rounded-lg border border-white/20 bg-slate-950/75 px-2 py-1 text-[11px] text-white/85 hover:text-white">
            <Maximize2 className="h-3 w-3" /> Full map
          </button>
        </div>
      </WidgetShell>
      <style>{`.lc-game-glass .glass{background:rgba(8,14,28,.18)!important;backdrop-filter:blur(3px)!important;-webkit-backdrop-filter:blur(3px)!important;border-color:rgba(255,255,255,.18)!important}.lc-game-glass{text-shadow:0 1px 6px rgba(0,0,0,.6)}.lc-game-glass [class*="bg-slate-9"],.lc-game-glass [class*="bg-lc-"],.lc-game-glass [class*="bg-white/"],.lc-game-glass [class*="bg-black/"]{background-color:rgba(10,18,34,.32)!important}`}</style>
      <style>{'@keyframes deck-drift{from{transform:translateX(110vw)}to{transform:translateX(-120%)}} [data-deck-drag] img{-webkit-user-drag:none;user-select:none;pointer-events:none}'}</style>

      {/* Glareshield */}
      <header className="col-span-3 row-start-1 flex items-center gap-3 rounded-2xl border border-[#2A3854] bg-gradient-to-b from-[#141d30] to-[#0c1322] px-3">
        <span className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold tracking-[0.14em] text-white/70">FLIGHT <b className="font-semibold text-amber-300">{className.toUpperCase()}</b></span>
        {classProfile?.type && (
          <label className="flex shrink-0 items-center gap-1 text-[11px] text-white/60" title="Set up for this kind of class. Change it for today's lesson only.">
            <select
              value={todayType ?? ''}
              onChange={(e) => { changeForToday(e.target.value as ClassType); flash(e.target.value === classProfile.type ? 'Back to this class\'s usual set-up' : `Set up for ${classTypeName(e.target.value as ClassType)} today`); }}
              aria-label="Class type for today"
              className={`w-[118px] truncate rounded-md border bg-slate-950/70 px-1.5 py-0.5 text-[11px] ${todayOverride ? 'border-amber-300/60 text-amber-100' : 'border-[#2A3854] text-white/80'}`}
            >
              {CLASS_TYPES.map((c) => <option key={c.key} value={c.key}>{c.name}{c.key === classProfile.type ? '' : ' (today)'}</option>)}
            </select>
          </label>
        )}
        <label className="flex shrink-0 items-center gap-1 text-[11px] text-white/60" title="See every topic through one lens for the whole lesson (films, music, sport…)">
          <select
            value={lensVote ? '__vote' : lens ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__vote') void startLensVote();
              else if (v === '__news') toggleNews();
              else setLens(v || null);
            }}
            aria-label="Lens for this lesson"
            className={`w-[118px] truncate rounded-md border bg-slate-950/70 px-1.5 py-0.5 text-[11px] ${lens ? 'border-sky-300/60 text-sky-100' : 'border-[#2A3854] text-white/80'}`}
          >
            <option value="">No lens</option>
            {lensChoices.map((l) => <option key={l.id} value={l.id}>Lens: {l.label}</option>)}
            <option value="__vote">Class vote…</option>
            {!junior && <option value="__news">{newsAllowed ? 'Turn off News and Politics' : 'Allow News and Politics'}</option>}
          </select>
        </label>
        {lensVote && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-sky-300/50 bg-sky-300/10 px-2 py-0.5 text-[11px] text-sky-100">
            Lens vote: {Object.values(lensTallies).reduce((a, b) => a + b, 0)} voted
            <button type="button" onClick={() => void closeLensVote(true)} className="rounded border border-sky-300/50 px-1.5 hover:bg-sky-300/15">Use winner</button>
            <button type="button" onClick={() => void closeLensVote(false)} aria-label="Cancel the lens vote" className="text-white/50 hover:text-white"><X className="h-3 w-3" /></button>
          </span>
        )}
        <span className="flex min-w-0 items-center gap-2 rounded-full border border-amber-300/45 bg-amber-300/10 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-300" aria-live="polite">
          <i className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-rose-400 shadow-[0_0_10px_#fb7185]" />
          <span className="truncate">On screen: {onScreenLabel}</span>
        </span>
        <FocusBar
          current={focused}
          status={focusBrief === 'loading' ? 'loading' : focusBrief === 'failed' ? 'failed' : focusBrief ? 'ready' : 'idle'}
          trail={focusTrail.map((id) => material.find((m) => m.id === id)).filter((m): m is RoomItem => !!m && m.id !== focused?.id)}
          onSubmit={(t) => makeFocus({ title: t })}
          onPick={(id) => setFocusId(id)}
        />
        <nav className="ml-auto flex gap-1" aria-label="Windscreen view">
          {VIEWS.filter((v) => !(scoresOff && v.key === 'scores')).map((v) => {
            const on = view === v.key;
            return (
              <button key={v.key} type="button" aria-pressed={on} onClick={() => switchView(v.key)} className="flex flex-col items-center gap-1 rounded-lg px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50 aria-pressed:text-white">
                <span className={['relative h-4 w-[30px] rounded-full border transition-colors', on ? 'border-emerald-300/60 bg-emerald-300/20' : 'border-[#2A3854] bg-[#0a0f19]'].join(' ')}>
                  <span className={['absolute top-[2px] h-2.5 w-2.5 rounded-full transition-all', on ? 'left-[16px] bg-emerald-300 shadow-[0_0_8px_#6ee7b7]' : 'left-[2px] bg-slate-500'].join(' ')} />
                </span>
                {v.label}
              </button>
            );
          })}
        </nav>
        <button type="button" onClick={toggleZoomLayout} title="Big windscreen for sharing this window in Zoom" className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${zoomLayout ? 'border-sky-300/60 bg-sky-300/10 text-sky-100' : 'border-[#2A3854] text-white/75 hover:text-white'}`}>
          <Video className="h-3.5 w-3.5" /> Zoom layout
        </button>
        <button type="button" onClick={() => setRecordTab('passport')} title="The class's passport, flight log and hangar" className="flex items-center gap-1.5 rounded-lg border border-[#2A3854] px-2.5 py-1.5 text-xs text-white/75 hover:text-white">
          <Stamp className="h-3.5 w-3.5" /> {zoomLayout ? '' : 'Journey'}
        </button>
        {photoLandmark && flightStage === 'flying' && !photo && (
          <button type="button" onClick={takePhoto} title="Take the class photo of this landmark (it goes into this lesson's cargo)" className="flex animate-pulse items-center gap-1.5 rounded-lg border border-amber-300/70 bg-amber-300/15 px-2.5 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-300/25">
            <Camera className="h-3.5 w-3.5" /> Take photo: {photoLandmark.name}
          </button>
        )}
        {topicPick && !presenting && (
          <span className="flex max-w-[22rem] shrink items-center gap-1 rounded-lg border border-cyan-300/40 bg-cyan-300/[0.06] py-1 pl-2.5 pr-1 text-xs text-cyan-50">
            <button type="button" disabled={pickBusy} onClick={() => void playTopicPick()} title="From our library, for today's topic" className="flex min-w-0 items-center gap-1.5 hover:text-white disabled:opacity-60">
              {topicPick.video ? <Video className="h-3.5 w-3.5 shrink-0" /> : <BookOpen className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{pickBusy ? 'Opening…' : `${topicPick.video ? 'Watch' : 'Read'}: ${topicPick.title}`}</span>
            </button>
            <button type="button" onClick={() => setTopicPick(null)} aria-label="Hide the suggestion" className="rounded p-0.5 text-cyan-100/60 hover:text-white"><X className="h-3.5 w-3.5" /></button>
          </span>
        )}
        {view === 'talk' && (
          <button type="button" onClick={() => setClearScreen((c) => !c)} title="Hide the talking point, so the windscreen is clear for a widget" className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${clearScreen ? 'border-sky-300/60 bg-sky-300/10 text-sky-100' : 'border-[#2A3854] text-white/75 hover:text-white'}`}>
            {clearScreen ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} {clearScreen ? 'Show talking point' : 'Clear screen'}
          </button>
        )}
        {phoneSpec && (
          <button type="button" onClick={() => void clearPhones()} title="Take everything off the students' phones (board, question, vote)" className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-rose-300/40 px-2.5 py-1.5 text-xs text-rose-100 hover:bg-rose-300/10">
            <Smartphone className="h-3.5 w-3.5" /> Clear phones
          </button>
        )}
        <button type="button" onClick={() => setPresenting(true)} className="flex items-center gap-1.5 rounded-lg border border-[#2A3854] px-2.5 py-1.5 text-xs text-white/75 hover:text-white">
          <Maximize2 className="h-3.5 w-3.5" /> Present
        </button>
        <button type="button" onClick={() => setGuideOpen((o) => !o)} aria-label="Guide" title="Guide for this kind of class" className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${guideOpen ? 'border-amber-300/60 text-amber-200' : 'border-[#2A3854] text-white/75 hover:text-white'}`}>
          <HelpCircle className="h-4 w-4" />
        </button>
        <button type="button" onClick={toggleFullScreen} title="Full screen: hides the browser and taskbar (Esc to leave). Tip: F11 stays full screen even when the Sources window opens." className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs ${fullScreen ? 'border-sky-300/60 bg-sky-300/10 text-sky-100' : 'border-[#2A3854] text-white/75 hover:text-white'}`}>
          {fullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />} {fullScreen ? 'Exit full screen' : 'Full screen'}
        </button>
        {fullScreenLost && !fullScreen && (
          <div className="fixed bottom-24 left-1/2 z-[75] flex -translate-x-1/2 items-center gap-2 rounded-full border border-sky-300/50 bg-slate-950/90 py-1.5 pl-4 pr-1.5 text-sm text-sky-50 shadow-xl backdrop-blur-md">
            Full screen ended when another window opened.
            <button type="button" onClick={toggleFullScreen} className="flex items-center gap-1.5 rounded-full bg-sky-300 px-3 py-1 text-xs font-semibold text-slate-950"><Expand className="h-3.5 w-3.5" /> Back to full screen</button>
            <button type="button" onClick={() => setFullScreenLost(false)} aria-label="Dismiss" className="px-1 text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        )}
        {flightStage === 'gate' && stayHome && (
          <button
            type="button"
            onClick={() => { if (!landArmed) { setLandArmed(true); return; } setLandArmed(false); if (flightPlan) flightPlan.onEnd(); onCompleteSession(origin.id); }}
            title={`Finish the lesson. The class stays in ${origin.city}.`}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${landArmed ? 'border-amber-300 bg-amber-300 text-slate-950' : 'border-amber-300/50 text-amber-200 hover:bg-amber-300/10'}`}
          >
            <ListChecks className="h-3.5 w-3.5" /> {landArmed ? 'Tap again to finish' : 'Finish lesson'}
          </button>
        )}
        {flightStage === 'flying' && (
          <span className="flex shrink-0 items-center whitespace-nowrap rounded-lg border border-[#2A3854] text-xs text-white/75" title="When the class ends. The plane arrives 5 minutes before.">
            <button type="button" onClick={() => nudgeClass(-5)} aria-label="Class ends 5 minutes earlier" className="px-2 py-1.5 hover:text-white">−5</button>
            <span className="px-1 font-mono text-[11px]">ends {endsAtLabel}</span>
            <button type="button" onClick={() => nudgeClass(5)} aria-label="Class ends 5 minutes later" className="px-2 py-1.5 hover:text-white">+5</button>
          </span>
        )}
        {flightStage === 'flying' && (
          <button
            type="button"
            onClick={() => (landArmed ? landNow() : setLandArmed(true))}
            title={`Begin the descent into ${destination.city} and end the lesson there`}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${landArmed ? 'border-amber-300 bg-amber-300 text-slate-950' : 'border-amber-300/50 text-amber-200 hover:bg-amber-300/10'}`}
          >
            <PlaneLanding className="h-3.5 w-3.5" /> {landArmed ? 'Tap again to land' : zoomLayout ? 'Land' : `Land in ${destination.city}`}
          </button>
        )}
        <div className="relative">
          <button type="button" onClick={() => setPanel(panel === 'menu' ? null : 'menu')} aria-label="Flight menu" className="rounded-lg border border-[#2A3854] p-1.5 text-white/75 hover:text-white">
            <Menu className="h-4 w-4" />
          </button>
          {panel === 'menu' && (
            <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-[#2A3854] bg-[#0c1322] p-1.5 shadow-2xl">
              <button type="button" onClick={() => { setPanel(null); setPlanOpen(true); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"><Plane className="h-4 w-4" /> Launch a flight</button>
              <button type="button" onClick={() => setPanel('logbook')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"><BookOpen className="h-4 w-4" /> Today&apos;s logbook</button>
              {flightStage === 'flying' ? (
                <>
                  <button type="button" onClick={landNow} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-amber-200 hover:bg-amber-300/10">
                    <PlaneLanding className="h-4 w-4" /> Land in {destination.city}
                  </button>
                  <button type="button" onClick={endWithoutLanding} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-400/10">
                    End without landing
                    <span className="block text-xs text-white/45">The class stays in {origin.city}.</span>
                  </button>
                </>
              ) : (
                // Never took off: the class is still at its departure city. A city lesson taught from here still
                // counts as a finished lesson.
                <button type="button" onClick={() => { setPanel(null); if (stayHome) { if (flightPlan) flightPlan.onEnd(); onCompleteSession(origin.id); } else onEndSession(origin.id); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-400/10">
                  {stayHome ? 'Finish the lesson' : 'End the session'}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Cargo hold (room material) */}
      {zoomLayout && (
        <button
          type="button"
          onMouseEnter={() => openRail('cargo')}
          onMouseLeave={leaveRail}
          onClick={() => { if (railOpen === 'cargo' && railPinned) { setRailPinned(false); setRailOpen(null); } else { setRailPinned(true); openRail('cargo'); } }}
          className={`col-start-1 row-start-2 flex flex-col items-center gap-2 rounded-2xl border py-3 ${railOpen === 'cargo' ? 'border-sky-300/50 bg-sky-300/10' : 'border-[#2A3854] bg-[#0c1322] hover:border-[#3d5176]'}`}
          aria-label="Cargo"
          title="Cargo"
        >
          <Package className="h-4 w-4 text-white/70" />
          <span className="font-mono text-[11px] font-semibold text-white/80">{material.length}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40 [writing-mode:vertical-rl]">Cargo</span>
        </button>
      )}
      <aside
        ref={cargoRef}
        onMouseEnter={() => { if (zoomLayout) openRail('cargo'); }}
        onMouseLeave={() => { if (zoomLayout && !dragging) leaveRail(); }}
        className={`flex min-h-0 flex-col gap-2 overflow-hidden rounded-2xl border border-[#2A3854] bg-gradient-to-b from-[#0e1524] to-[#0a101c] p-3 ${zoomLayout ? (railOpen === 'cargo' ? 'absolute top-[62px] bottom-[74px] left-2.5 z-40 w-[260px] shadow-2xl' : 'hidden') : 'col-start-1 row-start-2'}`}
      >
        {removeError && <p role="alert" className="text-xs text-rose-300">{removeError}</p>}
        <p className="flex justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Cargo <span>{material.length}</span></p>
        <div className="-mr-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {material.length === 0 && <p className="text-xs text-white/45">Things you find with Sources land here. Drag one onto the windscreen to show it.</p>}
          {material.map((m) => {
            const isHot = hot(hotZone, 'item') && hotZone?.dataset.itemId === m.id;
            const thumb = m.imageUrl ?? m.thumbnailUrl;
            return (
              <div
                key={m.id}
                data-deck-drag={`item:${m.id}`}
                data-deck-drop="item"
                data-item-id={m.id}
                data-deck-label={m.title}
                className={[
                  'group grid cursor-grab touch-none select-none grid-cols-[40px_1fr] items-center gap-2 rounded-xl border p-1.5 transition-colors',
                  isHot ? 'border-violet-300 bg-violet-300/10' : focusId === m.id ? 'border-amber-300/60 bg-amber-300/5' : shown?.id === m.id ? 'border-sky-300/50' : 'border-[#2A3854] bg-[#111A2B] hover:border-[#3d5176]',
                ].join(' ')}
                onDoubleClick={() => present(m)}
              >
                <span className="flex h-9 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-800 font-mono text-[9px] uppercase text-white/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {thumb ? <img src={thumb} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : m.kind}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 block text-xs font-semibold leading-snug">{m.title}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-white/45">
                    {shown?.id === m.id ? 'On screen' : m.publisher ?? hostOf(m.url)}
                    <button type="button" onClick={() => setFocusId(focusId === m.id ? null : m.id)} className={focusId === m.id ? 'text-amber-300' : 'opacity-0 group-hover:opacity-100'}>
                      {focusId === m.id ? '· Focus' : '· Set focus'}
                    </button>
                    {m.kind === 'video' && m.videoId && (
                      <button type="button" onClick={() => launch('video-player', m)} className="text-emerald-300/90 hover:text-emerald-200" title="Watch together, then comprehension questions on phones">
                        · Questions
                      </button>
                    )}
                    {(m.text || (m.description && m.description.length > 120)) && m.kind !== 'video' && (
                      <button type="button" onClick={() => launch('read-aloud', m)} className="text-emerald-300/90 hover:text-emerald-200" title="Read it together: class version, turns, follow-along">
                        · Read it together
                      </button>
                    )}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        {shown && view === 'show' && (
          <button type="button" onClick={() => hideItem(sessionId)} className="rounded-lg border border-[#2A3854] px-2 py-1.5 text-xs text-white/70 hover:text-white">Clear the screen</button>
        )}
        <button type="button" onClick={openPopout} className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-sky-300/40 px-2 py-2 text-xs text-sky-100 hover:bg-sky-300/10">
          <Search className="h-3.5 w-3.5" /> Sources (private window)
        </button>
        <button type="button" onClick={() => setPanel(panel === 'sources' ? null : 'sources')} className="text-[11px] text-white/45 hover:text-white/80">or search here (class can see)</button>
      </aside>

      {/* Windscreen */}
      <div className="relative col-start-2 row-start-2 min-h-0">
        {windscreen}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[30px_30px_18px_18px] shadow-[inset_0_0_0_6px_#121a2a,inset_0_0_40px_rgba(0,0,0,.35)]" />
        {panel === 'catalogue' && (
          <div className="absolute inset-y-3 right-3 z-30 flex w-[380px] flex-col overflow-hidden rounded-2xl border border-[#2A3854] bg-[#0c1322]/97 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A3854] px-3 py-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">All activities &amp; games</p>
              <button type="button" onClick={() => setPanel(null)} aria-label="Close"><X className="h-4 w-4 text-white/60" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <CatalogueDrawer
                entries={catalogue}
                categories={categories}
                query={catalogueState.query}
                category={catalogueState.category}
                favourites={catalogueState.favourites}
                recent={catalogueState.recent}
                onQuery={(query) => setCatalogueState((c) => ({ ...c, query }))}
                onCategory={(category) => setCatalogueState((c) => ({ ...c, category }))}
                onFavourite={(key) => setCatalogueState((c) => ({ ...c, favourites: c.favourites.includes(key) ? c.favourites.filter((k) => k !== key) : [...c.favourites, key] }))}
                onConfigure={(key) => launch(key, focused)}
                onLaunch={(key) => launch(key, focused)}
              />
            </div>
          </div>
        )}
        {panel === 'sources' && (
          <div className="absolute inset-y-3 left-3 z-30 w-[360px]">
            <SourcesDrawer sessionId={sessionId} onShow={present} onAdd={(item) => addItem(sessionId, item)} onClose={() => setPanel(null)} fill visibleWarning={false} />
          </div>
        )}
        {view === 'game' && runningKey && !presenting && (
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {flightPlan ? (
              <>
                <span className="rounded-full border border-amber-300/40 bg-slate-950/80 px-3 py-1.5 text-xs text-amber-100 backdrop-blur-md">{flightPlan.name} · {flightPlan.index + 1}/{flightPlan.total} {flightPlan.stage}</span>
                {!flightPlan.inBreak && (
                  <button type="button" onClick={flightPlan.onTurbulence} title="Turbulence: a quick fun break" className="flex items-center gap-1.5 rounded-full border border-violet-300/40 bg-slate-950/75 px-3 py-1.5 text-xs text-violet-100 backdrop-blur-md hover:bg-slate-900">
                    <Wind className="h-3.5 w-3.5" /> Turbulence
                  </button>
                )}
                <button type="button" onClick={planNext} className="rounded-full border border-amber-300/60 bg-amber-300/90 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-300">
                  {!flightPlan.nextLabel ? `Land in ${destination.city}` : flightStage === 'gate' && flightPlan.index === 0 ? `Take off: ${flightPlan.nextLabel} →` : `Next: ${flightPlan.nextLabel} →`}
                </button>
                <button type="button" onClick={flightPlan.onEnd} className="rounded-full border border-white/25 bg-slate-950/75 px-3 py-1.5 text-xs text-white/70 backdrop-blur-md hover:bg-slate-900">End flight plan</button>
              </>
            ) : (
              <button type="button" onClick={onReturn} className="rounded-full border border-white/25 bg-slate-950/75 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-slate-900">
                End activity · back to the room
              </button>
            )}
            <button
              type="button"
              onClick={toggleGameGlass}
              title={gameGlass ? 'Solid panel' : 'See-through panel (show the sky behind)'}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur-md ${gameGlass ? 'border-sky-300/60 bg-sky-300/15 text-sky-100' : 'border-white/25 bg-slate-950/75 text-white/80 hover:text-white'}`}
            >
              <Blend className="h-3.5 w-3.5" /> {gameGlass ? 'See-through' : 'Solid'}
            </button>
          </div>
        )}
      </div>

      {/* Cabin */}
      {zoomLayout && (
        <button
          type="button"
          onMouseEnter={() => openRail('cabin')}
          onMouseLeave={leaveRail}
          onClick={() => { if (railOpen === 'cabin' && railPinned) { setRailPinned(false); setRailOpen(null); } else { setRailPinned(true); openRail('cabin'); } }}
          className={`col-start-3 row-start-2 flex flex-col items-center gap-2 rounded-2xl border py-3 ${railOpen === 'cabin' ? 'border-sky-300/50 bg-sky-300/10' : 'border-[#2A3854] bg-[#0c1322] hover:border-[#3d5176]'}`}
          aria-label="Cabin"
          title="Cabin"
        >
          <Users className="h-4 w-4 text-white/70" />
          <span className="font-mono text-[11px] font-semibold text-white/80">{seated.length}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40 [writing-mode:vertical-rl]">Cabin</span>
        </button>
      )}
      <aside
        ref={cabinRef}
        onMouseEnter={() => { if (zoomLayout) openRail('cabin'); }}
        onMouseLeave={() => { if (zoomLayout && !dragging) leaveRail(); }}
        className={`flex min-h-0 flex-col gap-2 overflow-hidden rounded-2xl border border-[#2A3854] bg-gradient-to-b from-[#0e1524] to-[#0a101c] p-3 ${zoomLayout ? (railOpen === 'cabin' ? 'absolute top-[62px] bottom-[74px] right-2.5 z-40 w-[260px] shadow-2xl' : 'hidden') : 'col-start-3 row-start-2'}`}
      >
        <p className="flex justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Cabin <span>{seated.length}{rosterCount ? ` / ${rosterCount}` : ''}</span></p>
        <button type="button" onClick={spinRoulette} disabled={seated.length === 0 || !!roulette} className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300/50 bg-amber-300/10 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300 hover:bg-amber-300/20 disabled:opacity-40">
          <Shuffle className="h-3.5 w-3.5" /> Pick a student
        </button>
        {handQueue.length > 0 && (
          <div className="rounded-xl border border-amber-300/40 bg-amber-300/[0.07] p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200"><Hand className="h-3 w-3" /> Hands up</p>
              <button type="button" onClick={nextSpeaker} className="rounded-full bg-amber-300 px-2.5 py-0.5 text-[11px] font-semibold text-[#1a1204] hover:brightness-105">Next</button>
            </div>
            <ol className="mt-1.5 space-y-1">
              {handQueue.slice(0, 5).map((h, i) => (
                <li key={h.clientId} className="flex items-center gap-1.5 text-xs text-white/85">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-300/25 font-mono text-[9px] text-amber-100">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{h.name}</span>
                  <button type="button" onClick={() => lowerHand(h.clientId)} title="Lower hand" className="text-white/40 hover:text-white"><X className="h-3 w-3" /></button>
                </li>
              ))}
            </ol>
            {handQueue.length > 5 && <p className="mt-1 text-[10px] text-white/45">+{handQueue.length - 5} more</p>}
          </div>
        )}
        {adding && (
          <div className="space-y-2 rounded-xl border border-amber-300/40 bg-amber-300/[0.07] p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-100">Board a student (no device)</span>
            <button type="button" onClick={() => { setAdding(false); setNewName(''); }} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-3.5 w-3.5" /></button>
          </div>
          {notAboard.length > 0 && (
            <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
              {notAboard.map((r) => (
                <button key={r.id} type="button" onClick={() => { boardStudent(r.id); flash(`${r.name} is boarding`); }} className="flex items-center gap-1 rounded-full border border-white/20 py-0.5 pl-0.5 pr-2 text-[11px] text-white/85 hover:border-amber-300/60">
                  <CrewAvatar seed={r.avatar_seed ?? r.name} name={r.name} size={18} className="rounded-full" />{r.name}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); void addStudent(); }} className="flex items-center gap-1.5">
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Someone new? Their name" aria-label="New student's name" className="min-w-0 flex-1 rounded-lg border border-white/15 bg-slate-950/70 px-2 py-1 text-xs text-white placeholder:text-white/35" />
            <button type="submit" disabled={!newName.trim()} className="rounded-lg bg-amber-300 px-2 py-1 text-[11px] font-semibold text-[#1a1204] disabled:opacity-40">Add</button>
          </form>
          </div>
        )}
        {seatMenuP && (
          <div className="space-y-2 rounded-xl border border-sky-300/40 bg-sky-300/[0.06] p-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold text-white">{seatMenuP.display_name} <span className="font-normal text-white/50">· no device</span></span>
              <button type="button" onClick={() => setSeatMenu(null)} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </div>
            <>
                <div className="flex flex-wrap gap-1">
                  <button type="button" onClick={() => { setSpotlight(seatMenuP.id); flash(`${seatMenuP.display_name}, you're up!`); setSeatMenu(null); }} className="rounded-lg bg-amber-300 px-2 py-1 font-semibold text-[#1a1204]">Your turn</button>
                  <button type="button" onClick={() => raiseHandFor(seatMenuP)} className="rounded-lg border border-white/20 px-2 py-1 text-white/85 hover:border-white/40">{hands[seatMenuP.client_id] ? 'Hand down' : 'Hand up'}</button>
                  <button type="button" onClick={() => { unboardStudent(seatMenuP.student_id!); setSeatMenu(null); flash(`${seatMenuP.display_name} left the plane`); }} className="rounded-lg border border-white/20 px-2 py-1 text-white/60 hover:border-white/40">Leave the plane</button>
                </div>
                {runningKey && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-white/55">Answer:</span>
                    <button type="button" onClick={() => void markSeat(seatMenuP, 'right')} className="rounded-lg border border-emerald-300/50 px-2 py-1 text-emerald-200">Right</button>
                    <button type="button" onClick={() => void markSeat(seatMenuP, 'part')} className="rounded-lg border border-sky-300/50 px-2 py-1 text-sky-200">Took part</button>
                    <button type="button" onClick={() => void markSeat(seatMenuP, 'wrong')} className="rounded-lg border border-white/20 px-2 py-1 text-white/60">Not yet</button>
                  </div>
                )}
                {seatPoll && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-white/55">Vote:</span>
                    {seatPoll.options.map((o) => (
                      <button key={o} type="button" onClick={() => void voteForSeat(seatMenuP, o)} className="max-w-full truncate rounded-lg border border-white/20 px-2 py-1 text-white/85 hover:border-white/40">{o}</button>
                    ))}
                  </div>
                )}
              </>
          </div>
        )}
        <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[80px_80px_22px_22px] border border-[#2A3854] bg-gradient-to-b from-[#141e32] to-[#0d1524] px-3 pb-3 pt-7">
          <p className="absolute inset-x-0 top-2.5 text-center font-mono text-[9px] tracking-[0.2em] text-white/35">FLIGHT DECK</p>
          {Array.from({ length: seatCount / 4 }, (_, r) => (
            <div key={r} className="grid grid-cols-[1fr_1fr_12px_1fr_1fr] items-center gap-1.5">
              {[0, 1, -1, 2, 3].map((c) => {
                if (c === -1) return <span key="aisle" className="text-center font-mono text-[8px] text-white/30">{r + 1}</span>;
                const occupant = allSeats[r * 4 + c];
                // Still walking up the airstairs: the seat lights up when they step inside.
                const p = occupant && !walkingIds.has(occupant.id) ? occupant : undefined;
                const k = p ? keyOf(p) : '';
                const lit = p && answered.has(k);
                const spot = p && (spotlight === p.id || roulette === p.id);
                const handPos = p ? handQueue.findIndex((h) => h.clientId === p.client_id) : -1;
                return (
                  <div
                    key={c}
                    className={[
                      'relative grid h-11 place-items-center rounded-[9px_9px_5px_5px] border transition-all',
                      !p ? 'border-[#1f2a40] bg-[#0a0f19]' : roulette === p.id ? 'border-sky-300 shadow-[0_0_14px_rgba(125,211,252,.7)]' : spot ? 'border-amber-300 shadow-[0_0_16px_rgba(252,211,77,.6)]' : lit ? 'border-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.5)]' : 'border-[#1f2a40] bg-[#0a0f19]',
                    ].join(' ')}
                  >
                    {p ? (
                      <motion.button
                        type="button"
                        key={p.id}
                        data-deck-drag={`student:${p.id}`}
                        data-deck-label={p.display_name}
                        onClick={() => {
                          // No device: the teacher's menu for them (hand, mark, vote, absent). On a phone: their turn.
                          if (p.deviceless) { setSeatMenu((m) => (m === p.id ? null : p.id)); return; }
                          setSpotlight(p.id); flash(`${p.display_name}, you're up!`);
                        }}
                        initial={reduce ? false : { y: -40, scale: 0.4, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                        className="touch-none"
                        title={`${p.display_name} · Seat ${cabinSeatLabel(r * 4 + c)}`}
                      >
                        <span className="block"><CrewAvatar seed={p.avatar_seed ?? p.display_name} name={p.display_name} size={40} /></span>
                      </motion.button>
                    ) : onAddStudent && r * 4 + c === allSeats.length ? (
                      <button type="button" onClick={() => setAdding(true)} title="Add a student (a trial student, someone new)" aria-label="Add a student" className="grid h-full w-full place-items-center rounded-[9px_9px_5px_5px] text-white/40 hover:bg-white/5 hover:text-amber-200">
                        <UserPlus className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full border border-dashed border-[#2b3855]" />
                    )}
                    {p?.deviceless && (
                      <span className="absolute -left-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full border border-white/25 bg-slate-900 text-white/70" title="No device: tap the seat to answer or vote for them">
                        <PhoneOff className="h-2.5 w-2.5" />
                      </span>
                    )}
                    {p && <span className="absolute -bottom-3 left-1/2 max-w-[56px] -translate-x-1/2 truncate font-mono text-[8px] text-white/60">{p.display_name}</span>}
                    {p && !p.deviceless && <button type="button" onClick={() => void onRemoveParticipant(p.id)} title={removeConfirm === p.id ? 'Confirm remove' : 'Remove'} aria-label={`${removeConfirm === p.id ? 'Confirm remove' : 'Remove'} ${p.display_name}`} className="absolute -right-1 -top-2 rounded bg-slate-900 px-1 text-[9px] text-rose-300">
                      {removeConfirm === p.id ? 'Confirm remove' : <UserX className="h-3 w-3" />}
                    </button>}
                    {handPos >= 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 items-center gap-0.5 rounded-full bg-amber-300 px-1 font-mono text-[9px] font-bold text-[#1a1204] shadow-[0_0_10px_rgba(252,211,77,.7)]" title={`Hand up (#${handPos + 1})`}>
                        <Hand className="h-2.5 w-2.5" />{handPos + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div data-deck-drop="spot" className={['rounded-xl border border-dashed px-2 py-2 text-center text-[11px] transition-colors', hot(hotZone, 'spot') ? 'border-amber-300 bg-amber-300/15 text-amber-200' : 'border-amber-300/40 text-amber-300/80'].join(' ')}>
          Drag a student here to spotlight
        </div>
      </aside>

      {/* Instrument panel */}
      <section className={`col-span-3 row-start-3 min-h-0 rounded-2xl border border-[#2A3854] bg-gradient-to-b from-[#141c2d] to-[#0b111d] ${zoomLayout ? 'flex items-center overflow-x-auto px-2.5' : 'grid grid-cols-[auto_minmax(0,1fr)] gap-4 px-3.5 py-3'}`}>
        <div className={zoomLayout ? 'hidden' : 'flex gap-2.5'}>
          {(Object.keys(INSTRUMENT_LABEL) as Instrument[]).filter((k) => !(scoresOff && k === 'top')).map((k) => {
            const r = readings[k];
            const on = huds.includes(k);
            const dash = Math.round(r.frac * 100);
            return (
              <div key={k} data-deck-drag={`inst:${k}`} data-deck-label={INSTRUMENT_LABEL[k]} className="relative flex w-[112px] cursor-grab touch-none select-none flex-col items-center gap-1 rounded-2xl border border-[#1d2840] bg-[#0a0f19] px-1.5 py-2 hover:border-[#34466b]">
                {on && <span className="absolute -top-2 rounded bg-amber-300 px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-[0.12em] text-[#1a1204]">ON SCREEN</span>}
                <svg viewBox="0 0 100 100" className="h-[84px] w-[84px]" aria-hidden>
                  <circle cx="50" cy="50" r="44" fill="#070b13" stroke="#24314b" strokeWidth="3" />
                  <path d="M20 68 A34 34 0 1 1 80 68" fill="none" stroke="#1d283e" strokeWidth="7" strokeLinecap="round" />
                  <path d="M20 68 A34 34 0 1 1 80 68" fill="none" stroke={k === 'answered' ? '#5cf2a5' : k === 'top' ? '#ffb547' : '#58d5ff'} strokeWidth="7" strokeLinecap="round" pathLength={100} strokeDasharray={`${dash} 100`} style={{ transition: 'stroke-dasharray .8s cubic-bezier(.3,1.3,.5,1)' }} />
                  <text x="50" y="55" textAnchor="middle" fill="#eaf0fa" fontFamily="var(--font-instrument), monospace" fontSize="17" fontWeight="600">{r.value}</text>
                  {r.sub && <text x="50" y="74" textAnchor="middle" fill="#6b7a95" fontFamily="var(--font-instrument), monospace" fontSize="8">{r.sub.slice(0, 12)}</text>}
                </svg>
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">{INSTRUMENT_LABEL[k]}</span>
              </div>
            );
          })}
        </div>
        <div className={zoomLayout ? 'flex min-w-0 items-center gap-2' : 'flex min-w-0 flex-col gap-2'}>
          <p className={zoomLayout ? 'hidden' : 'font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45'}>
            Activities · drag onto the windscreen{focused ? ` (built from "${focused.title}")` : ''} or onto a cargo item
          </p>
          <div className={zoomLayout ? 'flex shrink-0 gap-1.5' : 'flex flex-wrap gap-2'}>
            {stamps.map((s, i) => (
              <button
                key={s.key}
                type="button"
                data-deck-drag={`stamp:${s.key}`}
                data-deck-label={s.name}
                onClick={() => launch(s.key, focused)}
                title={s.marks?.length ? `${s.description}\n${s.marks.map((m) => m.hint).join(' ')}` : s.description}
                className={['cursor-grab touch-none select-none rounded-lg border-[1.5px] border-dashed px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] transition-transform hover:-rotate-2 hover:scale-105', STAMP_TONES[i % STAMP_TONES.length]].join(' ')}
              >
                {s.name}
                {s.marks?.filter((m) => m.label !== 'Phones').map((m) => (
                  <span key={m.label} className="ml-1.5 rounded-full border border-amber-300/50 px-1 text-[9px] normal-case tracking-normal text-amber-200">{m.label}</span>
                ))}
              </button>
            ))}
            {/* Not another activity: a different look (solid, with an icon and an arrow) so it reads as "see the rest". */}
            <button type="button" onClick={() => setPanel(panel === 'catalogue' ? null : 'catalogue')} title="Every game and activity, by kind" className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition ${panel === 'catalogue' ? 'border-amber-300 bg-amber-300 text-slate-950' : 'border-amber-300/50 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20'}`}>
              <LayoutGrid className="h-3.5 w-3.5" /> Browse all {catalogue.length} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {zoomLayout && <span className="mx-1 h-6 w-px shrink-0 bg-white/15" aria-hidden />}
          <p className={zoomLayout ? 'hidden' : 'mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45'}>
            Tools · open where you click, drag to a windscreen corner to snap
            <span className="ml-3 inline-flex gap-1 normal-case tracking-normal">
              {SCREEN_TEMPLATES.map((t) => (
                <button key={t.name} type="button" onClick={() => applyTemplate(t)} title={t.hint} className="rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-white/60 hover:border-amber-300/50 hover:text-amber-200">
                  {t.name}
                </button>
              ))}
            </span>
          </p>
          <div className={zoomLayout ? 'flex shrink-0 gap-1.5' : 'flex flex-wrap gap-2'}>
            {WIDGET_REGISTRY.filter((w) => w.id !== 'random-picker').map((w) => {
              const waitingCount = w.id === 'class-questions' ? waitingMessages : w.id === 'class-board' ? waitingCards : 0;
              const calling = waitingCount > 0;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={(e) => (w.id === 'class-questions' ? openMessages(e.clientX, e.clientY)
                    : w.id === 'class-board' && calling ? openBoardApprovals(e.clientX, e.clientY)
                      // the Word Cloud is now the Class Board's Cloud view (one set of answers, two ways to show them)
                      : w.id === 'word-cloud' ? (openTool('class-board', e.clientX, e.clientY), window.setTimeout(() => window.dispatchEvent(new CustomEvent('lc-board-view', { detail: { view: 'cloud' } })), 150))
                      : openTool(w.id, e.clientX, e.clientY))}
                  title={calling ? (w.id === 'class-board' ? `${waitingCount} card${waitingCount === 1 ? '' : 's'} waiting for approval` : `${waitingCount} new message${waitingCount === 1 ? '' : 's'} from students`) : undefined}
                  className={[
                    'relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors',
                    calling
                      ? 'animate-pulse border-amber-300/80 bg-amber-300/15 text-amber-100 shadow-[0_0_16px_rgba(252,211,77,0.45)]'
                      : 'border-[#2A3854] bg-[#111A2B] text-white/70 hover:border-[#3d5176] hover:text-white',
                  ].join(' ')}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={w.iconPath} /></svg>
                  {w.label}
                  {calling && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-300 px-1 font-mono text-[10px] font-bold text-[#1a1204]">
                      {waitingCount}
                    </span>
                  )}
                </button>
              );
            })}
            <button type="button" onClick={(e) => openTool(QR_WIDGET, e.clientX, e.clientY)} className="flex items-center gap-1.5 rounded-lg border border-[#2A3854] bg-[#111A2B] px-2.5 py-1.5 text-xs text-white/70 hover:border-[#3d5176] hover:text-white">
              <QrCode className="h-3.5 w-3.5" /> Boarding QR
            </button>
            <CopyLinkButton url={joinUrl} className="flex items-center gap-1.5 rounded-lg border border-[#2A3854] bg-[#111A2B] px-2.5 py-1.5 text-xs text-white/70 hover:border-[#3d5176] hover:text-white" />
            <button type="button" onClick={(e) => openTool(FLIGHT_WIDGET, e.clientX, e.clientY)} className="flex items-center gap-1.5 rounded-lg border border-[#2A3854] bg-[#111A2B] px-2.5 py-1.5 text-xs text-white/70 hover:border-[#3d5176] hover:text-white">
              <Plane className="h-3.5 w-3.5" /> Flight map
            </button>
            <button type="button" onClick={() => setPlanOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-amber-300/40 px-2.5 py-1.5 text-xs text-amber-200 hover:bg-amber-300/10">
              <Plane className="h-3.5 w-3.5" /> Launch a flight
            </button>
            <button type="button" onClick={openPopout} className="flex items-center gap-1.5 rounded-lg border border-[#2A3854] px-2.5 py-1.5 text-xs text-white/70 hover:text-white">
              <ExternalLink className="h-3.5 w-3.5" /> Sources
            </button>
          </div>
        </div>
      </section>

      {guideOpen && (
        <RoomGuide
          type={todayType}
          place={classProfile?.place}
          oneOnOne={rosterCount === 1}
          tipsOn={tipsOn}
          onTips={setTipsPref}
          onReplay={startTestFlight}
          onClose={() => setGuideOpen(false)}
        />
      )}
      {tip && !testFlight && (
        <div className="fixed right-4 top-20 z-[71] flex max-w-sm items-start gap-2 rounded-xl border border-sky-300/40 bg-slate-950/95 p-3 text-sm text-sky-50 shadow-xl backdrop-blur-md">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          <span className="flex-1">{tip.text}</span>
          <button type="button" onClick={() => setTip(null)} aria-label="Dismiss tip" className="text-white/50 hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
      {testFlight && (
        <TestFlightCoach
          type={todayType}
          signals={{
            boarded: allSeats.some((p) => p.student_id?.startsWith('pretend-')),
            topic: !!focused && focused.id !== tf.startFocus,
            whereNext: tf.whereNext,
            picture: !!shown && shown.kind === 'image' && shown.id !== tf.startShown,
            picked: tf.spins > 0,
            tookOff: flightStage === 'flying',
            launched: tf.launched,
            finished: tf.finished,
            planOpened: planOpen,
            planStarted: !!flightPlan,
          }}
          onEnd={endTestFlight}
        />
      )}
      {toast && (
        <div role="status" className="fixed left-1/2 top-16 z-[70] -translate-x-1/2 rounded-xl border border-amber-300/50 bg-[#0a101c]/95 px-4 py-2.5 text-sm text-white shadow-2xl">
          {toast}
        </div>
      )}

      {dragging && typeof document !== 'undefined' && createPortal(
        <div className="pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-1/2 -rotate-3 rounded-lg border border-white/30 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-2xl" style={{ left: dragging.x, top: dragging.y }}>
          {dragging.label}
        </div>,
        document.body,
      )}
    </motion.div>
  );
}

interface ScreenTemplate {
  name: string;
  hint: string;
  widgets: Record<string, SnapAnchor>;
}

/** One-click shared-screen layouts: which widgets are open and which windscreen corner each takes. */
const SCREEN_TEMPLATES: ScreenTemplate[] = [
  { name: 'Clear', hint: 'Close every widget', widgets: {} },
  { name: 'Timed task', hint: 'Timer in the top-right corner', widgets: { timer: 'tr' } },
  { name: 'Vote', hint: 'Poll bottom-left, timer top-right', widgets: { poll: 'bl', timer: 'tr' } },
  { name: 'Brainstorm', hint: 'Word cloud bottom-left, class questions bottom-right', widgets: { 'word-cloud': 'bl', 'class-questions': 'br' } },
];

interface FocusBrief {
  briefing: string;
  facts: string[];
  angles: string[];
  vocab?: Array<{ word: string; definition: string }>;
  /** "Where next?": topics that follow from this one, each with how it connects. */
  nextTopics?: Array<{ link: string; title: string }>;
  /** Facts from Wikipedia for a named film, book, singer, famous person... (ending kept back). */
  reference?: { title: string; url: string; kind: string; text: string; ending: string | null };
  /** The facts board: the topic presented as fact cards before the class talks. */
  cards?: FactCard[];
}

/** The glareshield topic bar: type anything to make it the class's topic; recent topics one tap away. */
function FocusBar({ current, status, trail, onSubmit, onPick }: {
  current: RoomItem | null;
  status: 'idle' | 'loading' | 'ready' | 'failed';
  trail: RoomItem[];
  onSubmit: (text: string) => void;
  onPick: (id: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  return (
    <form
      className="relative flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#2A3854] bg-[#0a0f19] px-2.5 py-1.5 focus-within:border-amber-300/60"
      onSubmit={(e) => {
        e.preventDefault();
        if (draft.trim()) onSubmit(draft);
        setDraft('');
        setOpen(false);
      }}
    >
      <Crosshair className={['h-4 w-4 shrink-0', current ? 'text-amber-300' : 'text-white/40'].join(' ')} aria-hidden />
      <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Topic</span>
      <input
        id="deck-focus"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder={current ? current.title : 'Type a topic, a question, or paste a paragraph'}
        className={['min-w-0 flex-1 bg-transparent text-sm focus:outline-none', current ? 'placeholder:text-white' : 'placeholder:text-white/40'].join(' ')}
        aria-label="Class topic"
      />
      {status === 'loading' && <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-300/80">Briefing…</span>}
      {status === 'ready' && <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-300/80">Phones updated</span>}
      {status === 'failed' && <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-rose-300/80">No briefing</span>}
      {open && trail.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-[#2A3854] bg-[#0c1322] p-1.5 shadow-2xl">
          <p className="px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Earlier topics</p>
          {trail.map((m) => (
            <button key={m.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(m.id); setOpen(false); }} className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm text-white/80 hover:bg-white/5">
              {m.title}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

const FLIGHT_WIDGET = 'flight-tracker';
const QR_WIDGET = 'boarding-qr';
const DECK_WIDGET_IDS = [...WIDGET_REGISTRY.map((w) => w.id), FLIGHT_WIDGET, QR_WIDGET];
const ROOM_PINS_KEY = 'room-pins';
// What "chasing the sun" means, so the topic's summary explains the real thing (not a song or a film of that name).
const CHASING_THE_SUN = 'Chasing the sun: the plane is flying west at about the same speed as the sun seems to move across the sky. The Earth turns from west to east, so places further west reach sunset later. Flying west fast enough, a plane keeps up with the sunset, and the sun seems to stay at the same height for a long time: the class is flying through a long sunset (or a long morning). Jets flying west across oceans often do this.';
const stopTopic = (text: string) => text.replace(/^(Cross into|Over|Pass near|Near|Land in)\s+/i, '');
const PIN_PROMPTS = ['Where are you right now?', 'A place you would love to visit', 'Where were you born?'];
const PIN_COLORS = ['#fb7185', '#f59e0b', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#22d3ee', '#facc15'];

const SNAP_INSET = 14;
const SNAP_ANCHORS: SnapAnchor[] = ['tl', 'tc', 'tr', 'bl', 'bc', 'br'];

export interface SnapHost {
  id: string;
  ref: React.RefObject<HTMLElement>;
  anchors: SnapAnchor[];
}

/**
 * Registers snap zones (in viewport coordinates) for the windscreen's corners
 * and edges, plus the side panels' corners (only the teacher sees those when
 * presenting), and shows them while a widget is being dragged.
 */
function SnapGuides({ hosts }: { hosts: SnapHost[] }) {
  const setZones = useSnapZones((s) => s.setZones);
  const setWindRect = useSnapZones((s) => s.setWindRect);
  const dragging = useSnapZones((s) => s.dragging);
  const hotId = useSnapZones((s) => s.hot);
  const [rects, setRects] = useState<Array<{ id: string; anchor: SnapAnchor; r: DOMRect }>>([]);
  const key = hosts.map((h) => h.id).join('|');

  useEffect(() => {
    const els = hosts.map((h) => h.ref.current).filter((el): el is HTMLElement => !!el);
    const update = () => {
      const next: Array<{ id: string; anchor: SnapAnchor; r: DOMRect }> = [];
      for (const h of hosts) {
        const el = h.ref.current;
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (h.id === 'wind') setWindRect({ left: r.left, top: r.top, width: r.width, height: r.height });
        for (const a of h.anchors) next.push({ id: `${h.id}-${a}`, anchor: a, r });
      }
      setRects(next);
      setZones(next.map(({ id, anchor: a, r }) => ({
        id,
        anchor: a,
        x: a.endsWith('l') ? r.left + SNAP_INSET : a.endsWith('r') ? r.right - SNAP_INSET : r.left + r.width / 2,
        y: a.startsWith('t') ? r.top + SNAP_INSET : r.bottom - SNAP_INSET,
      })));
    };
    update();
    const ro = new ResizeObserver(update);
    els.forEach((el) => ro.observe(el));
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      setZones([]);
      setWindRect(null);
    };
    // Hosts are refs; re-register when the set of hosts changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setZones, setWindRect]);

  if (!dragging) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[99]">
      {rects.map(({ id, anchor: a, r }) => {
        const gw = Math.min(260, r.width * (id.startsWith('wind') ? 0.28 : 0.8));
        const gh = Math.min(150, r.height * 0.3);
        const left = a.endsWith('l') ? r.left + SNAP_INSET : a.endsWith('r') ? r.right - SNAP_INSET - gw : r.left + (r.width - gw) / 2;
        const top = a.startsWith('t') ? r.top + SNAP_INSET : r.bottom - SNAP_INSET - gh;
        const on = hotId === id;
        return (
          <div
            key={id}
            className={[
              'absolute rounded-2xl border-2 border-dashed transition-all duration-150',
              on ? 'border-amber-300 bg-amber-300/20 shadow-[0_0_30px_rgba(252,211,77,0.45)]' : id.startsWith('wind') ? 'border-white/35 bg-white/5' : 'border-sky-300/40 bg-sky-300/5',
            ].join(' ')}
            style={{ left, top, width: gw, height: gh }}
          />
        );
      })}
    </div>
  );
}

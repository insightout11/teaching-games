'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Blend, Crosshair, ExternalLink, Hand, ListChecks, Maximize2, Menu, Minimize2, Package, Plane, QrCode, Search, Shuffle, Users, Video, Vote, X } from 'lucide-react';
import { getActivity } from '@/activities/registry';
import { CopyLinkButton, CopyLinkText } from '@/components/session/live-room/copy-link';
import { openHandChannel, HAND_STALE_MS } from '@/lib/live-room/hands';
import { cabinSeatLabel } from '@/lib/live-room/seats';
import { BoardingLane, type Boarder } from '@/components/session/live-room/boarding-lane';
import { parseWouldYouRather } from '@/lib/live-room/talk-vote';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';
import type { SourceMaterial } from '@/types/source-material';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { FlightTracker } from '@/components/live-room/flight/flight-tracker';
import { DeckMap, type DeckMapPin } from '@/components/live-room/flight/deck-map';
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/mock/auth';
import type { InputSpec } from '@/lib/input-spec';
import { WindscreenFlight, type FlightStage, type FlightCity } from '@/components/live-room/flight/windscreen-flight';
import { LC_INTERNATIONAL_COORD, overflightAt, regionOf, type LatLng } from '@/lib/live-room/route-terrain';
import { bearingDeg, offsetClock, solarClock, sunPosition } from '@/lib/live-room/sun';
import { cityNear, countryAt, loadCountries, type CountryShape } from '@/lib/live-room/places-below';
import type { LiveWeather } from '@/lib/live-room/live-weather';
import { rollWeather } from '@/components/world-flight/arrival-scene/weather';
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
const SCENE_CITIES = WORLD_DESTINATIONS.filter((d) => d.scene);
const toRouteCity = (d: (typeof SCENE_CITIES)[number]): RouteCity => ({ id: d.id, city: d.city, scene: d.scene!, lat: d.lat, lng: d.lng });
function hashOf(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}
const DEFAULT_STAMPS = ['flash-quiz', 'hot-take-arena', 'vocab-sprint', 'fact-detective', 'conversation-rounds'];

export interface DeckParticipant {
  id: string;
  student_id: string | null;
  client_id: string;
  display_name: string;
  avatar_seed: string | null;
  joined_at: string;
}

export interface FlightDeckProps {
  sessionId: string;
  className: string;
  joinUrl: string;
  participants: DeckParticipant[];
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
  flightHref: string;
}

function keyOf(p: DeckParticipant) {
  return p.student_id || p.client_id;
}

function fmtClock(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

export function FlightDeck({
  sessionId,
  className,
  joinUrl,
  participants,
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
  flightHref,
}: FlightDeckProps) {
  const reduce = useReducedMotion();
  const scores = useSessionStore((s) => s.scores);
  const setSourceMaterial = useSessionStore((s) => s.setSourceMaterial);
  const setCustomTopic = useSessionStore((s) => s.setCustomTopic);
  const setCurrentStudent = useSessionStore((s) => s.setCurrentStudent);
  const { material, shown } = useRoom(sessionId);
  const addItem = useLiveRoomStore((s) => s.add);
  const showItem = useLiveRoomStore((s) => s.show);
  const hideItem = useLiveRoomStore((s) => s.hide);
  const markRoom = useLiveRoomStore((s) => s.markRoom);
  useEffect(() => markRoom(sessionId), [sessionId, markRoom]);

  const [view, setView] = useState<DeckView>('boarding');
  const [flightStage, setFlightStage] = useState<FlightStage>('gate');
  const [cinematic, setCinematic] = useState(false);
  const [landed, setLanded] = useState(false);
  const [takeoffAt, setTakeoffAt] = useState<number | null>(null);
  // The class journey is World Flight's: depart from the class's current city,
  // within the plane's range (LC International before its first flight).
  const [position, setPosition] = useState<{ currentDestinationId: string | null; rangeKm: number; planeKey?: string | null; journey?: Array<{ from: string | null; to: string }> } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/session/${encodeURIComponent(sessionId)}/room-leg`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setPosition(d ?? { currentDestinationId: null, rangeKm: STARTER_PLANE_RANGE_KM }); })
      .catch(() => { if (!cancelled) setPosition({ currentDestinationId: null, rangeKm: STARTER_PLANE_RANGE_KM }); });
    return () => { cancelled = true; };
  }, [sessionId]);
  const origin = useMemo<RouteCity>(() => {
    const d = position?.currentDestinationId ? SCENE_CITIES.find((c) => c.id === position.currentDestinationId) : undefined;
    return d ? toRouteCity(d) : HOME;
  }, [position]);
  const reachable = useMemo<RouteCity[]>(() => {
    const originPack = SCENE_CITIES.find((c) => c.id === origin.id);
    // First flight: anywhere (nearest to the hub first); otherwise within range. The
    // picker lists these 24, and the default is always one of them.
    const list = !originPack
      ? SCENE_CITIES.map(toRouteCity)
      : destinationsWithinRange(originPack, SCENE_CITIES, position?.rangeKm ?? STARTER_PLANE_RANGE_KM).map((r) => toRouteCity(r.destination));
    return list.slice(0, 24);
  }, [origin, position]);
  const [chosenId, setChosenId] = useState<string | null>(null);
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
  const journeyPins = useMemo<DeckMapPin[]>(() => {
    const stops = new Map<string, DeckMapPin>();
    stops.set(HOME.id, { id: HOME.id, lat: HOME.lat, lng: HOME.lng, color: '#94a3b8' });
    for (const l of position?.journey ?? []) {
      const c = SCENE_CITIES.find((d) => d.id === l.to);
      if (c) { const r = toRouteCity(c); stops.set(r.id, { id: r.id, lat: r.lat, lng: r.lng, color: '#60a5fa' }); }
    }
    stops.set(destination.id, { id: destination.id, lat: destination.lat, lng: destination.lng, label: destination.city, color: '#f59e0b' });
    return Array.from(stops.values());
  }, [position, destination]);

  // "Where should we fly next, and why?": a poll of up to four cities in range
  // (the picked one first). The Poll widget's "Fly to …" sets the winner.
  const startCityPoll = async () => {
    // Every city in range is a choice (nearest first reads naturally as a list).
    const options = Array.from(new Set(reachable.map((c) => c.city)));
    if (options.length < 2) { flash('Only one city is in range right now.'); return; }
    const supabase = createClient();
    await supabase.from('polls').update({ is_active: false }).eq('session_id', sessionId).eq('is_active', true);
    const { error } = await supabase.from('polls').insert({
      session_id: sessionId,
      question: 'Where should we fly next, and why?',
      options,
      is_active: true,
      metadata: { askWhy: true, purpose: 'next-city' },
    });
    if (error) { flash('Could not start the vote.'); return; }
    openTool('poll', window.innerWidth / 2, window.innerHeight / 2);
    flash('Vote open on phones: where next, and why?');
  };

  const takeOff = () => {
    setFlightStage('flying');
    setTakeoffAt(Date.now());
    flash(`Flight to ${destination.city}: cleared for take-off`);
    // Record the leg on the class's World Flight journey.
    void fetch(`/api/session/${encodeURIComponent(sessionId)}/room-leg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: destination.id }),
    }).catch(() => {});
  };

  // Route planner (before take-off): home plus every city in range as a pin.
  const plannerPins = useMemo<DeckMapPin[]>(() => [
    { id: `origin:${origin.id}`, lat: origin.lat, lng: origin.lng, label: origin.city, color: '#94a3b8' },
    ...reachable.map((c) => ({
      id: c.id,
      lat: c.lat,
      lng: c.lng,
      label: c.city,
      color: c.id === destination.id ? '#f59e0b' : '#60a5fa',
    })),
  ], [origin, reachable, destination.id]);
  const plannerPaths = useMemo(() => [{ a: origin as LatLng, b: destination as LatLng }], [origin, destination]);
  const plannerKm = Math.round(distanceBetweenCoordsKm(origin, destination));

  // Class pin map: every phone drops a pin (geo-point input); pins land live.
  const setInputSpec = useSessionStore((s) => s.setInputSpec);
  const [pinRound, setPinRound] = useState<{ id: string; prompt: string } | null>(null);
  const [pins, setPins] = useState<DeckMapPin[]>([]);
  const [mapMode, setMapMode] = useState<'tracker' | 'pins'>('tracker');
  const startPins = (prompt: string) => {
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
  const sceneZoom = zoomLayout && windWidth > 0 ? Math.min(1.6, Math.max(1, windWidth / 1050)) : 1;
  const openRail = (which: 'cargo' | 'cabin') => {
    if (railTimer.current) window.clearTimeout(railTimer.current);
    setRailOpen(which);
  };
  const leaveRail = () => {
    if (railPinned) return;
    if (railTimer.current) window.clearTimeout(railTimer.current);
    railTimer.current = window.setTimeout(() => setRailOpen(null), 450);
  };
  const [panel, setPanel] = useState<'catalogue' | 'sources' | 'menu' | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [spotlight, setSpotlightId] = useState<string | null>(null);
  // Spotlight doubles as the game's "up next" student (the shell sidebar that
  // used to pick it is hidden in the room).
  const setSpotlight = useCallback((id: string | null) => {
    setSpotlightId(id);
    const p = id ? participants.find((x) => x.id === id) : null;
    const rosterId = p?.student_id ?? p?.client_id;
    if (rosterId) setCurrentStudent(rosterId);
  }, [participants, setCurrentStudent]);
  const [roulette, setRoulette] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [classMinutes, setClassMinutes] = useState(60);
  const flightMs = Math.max(15, classMinutes - 5) * 60_000;
  const elapsedMs = takeoffAt ? Math.max(0, now - takeoffAt) : 0;
  const routeT = takeoffAt ? Math.min(1, elapsedMs / flightMs) : 0;
  // Class ran over: the plane circles near the destination until you land.
  const holding = flightStage === 'flying' && takeoffAt !== null && elapsedMs >= flightMs;
  const minutesLeft = takeoffAt ? Math.max(0, (flightMs - elapsedMs) / 60_000) : null;
  const below = useMemo(() => overflightAt(origin, destination, routeT), [origin, destination, routeT]);
  // Country and nearby big city under the plane (outlines load lazily).
  const [countries, setCountries] = useState<CountryShape[] | null>(null);
  useEffect(() => { void loadCountries().then(setCountries).catch(() => {}); }, []);
  const place = useMemo(() => {
    const country = countries ? countryAt(countries, below.point) : null;
    const city = below.terrain !== 'ocean' ? cityNear(below.point) : null;
    const feature = below.terrain !== 'farmland' && below.terrain !== 'ocean' ? below.name : null;
    const label = city
      ? `near ${city.name}${country ? `, ${country}` : ''}`
      : country
        ? (feature ? `${feature}, ${country}` : country)
        : below.name;
    return { label, overCity: city && city.km < 30 ? city.name : null };
  }, [countries, below]);

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
        .then((d: LiveWeather | null) => { if (!cancelled) setLiveWx(d?.condition ? d : null); })
        .catch(() => { if (!cancelled) setLiveWx(null); });
    };
    load();
    const t = window.setInterval(load, 10 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(t); };
    // Only when the plane has moved on (the key), not on every tick of its position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wxKey]);

  // The sky follows the real sun over the ground below (the destination once landing).
  const skyNow = useMemo(() => {
    const at = flightStage === 'landing' ? destination : below.point;
    const s = sunPosition(at, new Date(now));
    const heading = bearingDeg(at, destination.lat === at.lat && destination.lng === at.lng ? { lat: at.lat, lng: at.lng + 1 } : destination);
    const timeOfDay: TimeOfDay = s.elevation < -6 ? 'night' : s.elevation < 8 ? (s.azimuth < 180 ? 'dawn' : 'dusk') : 'day';
    return { sun: { ...s, heading }, timeOfDay, clock: solarClock(at.lng, new Date(now)) };
  }, [below.point, destination, flightStage, now]);
  const [catalogueState, setCatalogueState] = useState({ query: '', category: null as string | null, favourites: [] as string[], recent: [] as string[] });
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
  const catalogue = useMemo<CatalogueEntry[]>(
    () => [
      ...games.map((g) => ({ key: g.key, name: g.name, description: g.description, category: g.category, kind: 'game' as const, readiness: 'ready' as const, minutes: g.estimatedMinutes, deviceFree: g.deviceFree, scored: true })),
      ...activities.map((a) => ({ key: a.key, name: a.name, description: a.description, category: a.category, kind: 'activity' as const, readiness: 'ready' as const, minutes: a.estimatedMinutes, deviceFree: a.deviceFree })),
    ],
    [games, activities],
  );
  const categories = useMemo(() => Array.from(new Set(catalogue.map((c) => c.category))), [catalogue]);
  const stamps = useMemo(() => {
    const keys = [...catalogueState.recent, ...catalogueState.favourites, ...DEFAULT_STAMPS];
    return Array.from(new Set(keys)).map((k) => catalogue.find((c) => c.key === k)).filter((c): c is CatalogueEntry => !!c).slice(0, 6);
  }, [catalogue, catalogueState.recent, catalogueState.favourites]);

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
  }, [catalogue, games, activities, onLaunchGame, onLaunchActivity, setSourceMaterial, setCustomTopic, flash, sessionId]);

  const focused = material.find((m) => m.id === focusId) ?? null;
  const roomChannelRef = useRef<BroadcastChannel | null>(null);
  const focusedTitleRef = useRef<string | null>(null);
  focusedTitleRef.current = focused ? focused.title.slice(0, 120) : null;

  // ── Focus: whatever the class is talking about right now ─────────────────
  // Any topic (typed, a student's question, a Talk prompt) becomes a 'note'
  // cargo item, so it grounds activities exactly like found material does.
  const updateItem = useLiveRoomStore((s) => s.update);
  const [briefs, setBriefs] = useState<Record<string, FocusBrief | 'loading' | 'failed'>>({});
  const [focusTrail, setFocusTrail] = useState<string[]>([]);
  const makeFocus = useCallback((req: FocusRequest) => {
    const raw = req.title.replace(/\s+/g, ' ').trim();
    if (!raw) return;
    // A pasted paragraph: its first sentence is the title, the rest is material.
    const first = raw.split(/(?<=[.?!])\s/)[0];
    const title = (first.length <= 90 ? first : `${raw.slice(0, 87)}…`);
    const text = req.text ?? (raw.length > 120 ? raw : undefined);
    const id = `note-${Date.now().toString(36)}`;
    addItem(sessionId, { id, kind: 'note', title, url: `note:${id}`, publisher: req.credit ?? 'Class', ...(text ? { text } : {}) });
    setFocusId(id);
    flash(req.credit ? `New topic from ${req.credit}` : 'New topic');
  }, [addItem, sessionId, flash]);
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
    setCustomTopic(focused.title.slice(0, 120));
    roomChannelRef.current?.postMessage({ type: 'topic', title: focused.title.slice(0, 120) });
    if (briefs[focused.id]) return;
    const item = focused;
    setBriefs((b) => ({ ...b, [item.id]: 'loading' }));
    void fetch(`/api/session/${encodeURIComponent(sessionId)}/focus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: item.title, text: item.text ?? item.description ?? '' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: FocusBrief | null) => {
        if (!d?.briefing) {
          setBriefs((b) => ({ ...b, [item.id]: 'failed' }));
          return;
        }
        setBriefs((b) => ({ ...b, [item.id]: d }));
        if (item.kind === 'note' && !item.text) {
          updateItem(sessionId, item.id, {
            text: [d.briefing, ...d.facts.map((f) => `- ${f}`), ...d.angles.map((a) => `Question: ${a}`)].join('\n'),
          });
        }
      })
      .catch(() => setBriefs((b) => ({ ...b, [item.id]: 'failed' })));
    // Only when the Focus changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused?.id]);
  const focusBrief = focused ? briefs[focused.id] : undefined;
  const brief = typeof focusBrief === 'object' ? focusBrief : null;
  // The topic's key words feed the Word bank widget.
  const setBusVocab = useFocusBus((s) => s.setVocab);
  useEffect(() => { setBusVocab(brief?.vocab ?? []); }, [brief, setBusVocab]);

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
      // A newly opened Sources window asks what the topic is.
      else if (m.type === 'hello' && focusedTitleRef.current) channel?.postMessage({ type: 'topic', title: focusedTitleRef.current });
    });
    roomChannelRef.current = channel;
    return () => { channel?.close(); roomChannelRef.current = null; };
  }, [sessionId, present, addItem, makeFocus]);

  const openPopout = () => {
    const popup = window.open(`/sessions/${encodeURIComponent(sessionId)}/sources`, `lc-sources-${sessionId}`, 'popup,width=480,height=860');
    if (popup) popup.focus();
    else setPanel('sources');
  };
  // Messages are read in the private window, never on the shared screen.
  // Class Board cards waiting for approval: open the board (for the class) and
  // the private window on its Board tab (for the teacher).
  const openBoardApprovals = (x: number, y: number) => {
    openTool('class-board', x, y);
    const popup = window.open(`/sessions/${encodeURIComponent(sessionId)}/sources?tab=board#board`, `lc-sources-${sessionId}`, 'popup,width=480,height=860');
    popup?.focus();
  };
  const openMessages = (x: number, y: number) => {
    const popup = window.open(`/sessions/${encodeURIComponent(sessionId)}/sources?tab=messages#messages`, `lc-sources-${sessionId}`, 'popup,width=480,height=860');
    if (popup) popup.focus();
    else openTool('class-questions', x, y);
  };

  // ── cabin ────────────────────────────────────────────────────────────────
  const seated = useMemo(() => [...participants].sort((a, b) => a.joined_at.localeCompare(b.joined_at)), [participants]);
  const newest = seated[seated.length - 1] ?? null;
  const answered = useMemo(() => {
    if (!runningKey) return new Set<string>();
    const since = launchedAt.current;
    return new Set(scores.filter((s) => new Date(s.created_at).getTime() >= since).map((s) => s.student_id || s.client_id || ''));
  }, [scores, runningKey]);
  const seatCount = Math.max(12, Math.ceil((seated.length + 1) / 4) * 4);

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
  const nextSpeaker = () => {
    const first = handQueue[0];
    if (!first) return;
    const p = seated.find((s) => s.client_id === first.clientId);
    if (p) setSpotlight(p.id);
    flash(`${first.name}, go ahead!`);
    lowerHand(first.clientId);
  };

  const spinRoulette = () => {
    if (roulette || seated.length === 0) return;
    let i = Math.floor(Math.random() * seated.length);
    let delay = 60;
    const steps = 14 + Math.floor(Math.random() * seated.length);
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
        const p = participants.find((x) => keyOf(x) === k);
        best = { name: p?.display_name ?? '—', pts };
      }
    });
    return best as { name: string; pts: number } | null;
  }, [scores, participants]);
  const sessionMs = startedAt ? now - new Date(startedAt).getTime() : 0;
  const readings: Record<Instrument, { value: string; frac: number; sub?: string }> = {
    aboard: { value: String(seated.length), frac: rosterCount ? Math.min(1, seated.length / rosterCount) : seated.length ? 1 : 0, sub: rosterCount ? `of ${rosterCount}` : undefined },
    answered: { value: runningKey && seated.length ? `${Math.round((answered.size / seated.length) * 100)}%` : '—', frac: runningKey && seated.length ? answered.size / seated.length : 0 },
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
      const c = reachable.find((r) => r.city === city);
      if (c) { setChosenId(c.id); flash(`The class chose ${c.city}!`); }
    });
    return () => setFlyTo(null);
  }, [reachable, setFlyTo, flash]);

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
      const p = participants.find((x) => x.id === d.id);
      if (p) {
        setSpotlight(p.id);
        flash(`${p.display_name}, you're up!`);
      }
    }
  }, [material, present, launch, focused, participants, flash, setSpotlight]);
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

  const spotlightP = participants.find((p) => p.id === spotlight) ?? null;
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
      : [focused?.description ?? focused?.text?.slice(0, 400), talkUsed.length ? `Avoid repeating: ${talkUsed.slice(-5).join(' | ')}` : ''].filter(Boolean).join(' ');
    try {
      const res = await fetch('/api/live-room/talk-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, topic, context, difficulty }),
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

  // ── windscreen content ───────────────────────────────────────────────────
  let scene: ReactNode;
  if (view === 'boarding') {
    scene = (
      <div className="flex flex-wrap items-center justify-center gap-8 rounded-3xl border border-white/15 bg-slate-950/60 px-8 py-7 backdrop-blur-md">
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
          {flightStage === 'gate' && (
            <label className="flex items-center gap-2 text-sm text-white/75">
              Class length
              <select
                id="deck-class-minutes"
                value={classMinutes}
                onChange={(e) => setClassMinutes(Number(e.target.value))}
                className="rounded-lg border border-white/20 bg-slate-900/80 px-2 py-1 text-white"
              >
                {CLASS_MINUTES.map((m) => <option key={m} value={m}>{m} min</option>)}
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
                Let the class vote
              </button>
            </label>
          )}
          {flightStage === 'gate' && (
            <button
              type="button"
              onClick={takeOff}
              className="mt-1 w-max rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-6 py-3 font-display text-lg text-[#1a1204] shadow-[0_10px_30px_rgba(255,160,60,.35)] hover:brightness-105"
            >
              Take off to {destination.city}
            </button>
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
        {!presenting && talkPrompt.trim().length > 3 && (
          <button type="button" onClick={() => void startTalkVote()} className="flex items-center gap-1.5 rounded-lg border border-rose-300/50 bg-slate-950/60 px-2.5 py-1 text-xs text-rose-100 backdrop-blur-sm hover:bg-rose-300/10">
            <Vote className="h-3.5 w-3.5" /> {talkVote ? 'Class vote on phones' : 'Class vote: agree or disagree'}
          </button>
        )}
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
              pins={pins}
              detailed={detailedMap}
              onPinClick={pickPin}
              focusPoint={pinPick ? { lat: pinPick.pin.lat, lng: pinPick.pin.lng, zoom: detailedMap ? 11 : 6 } : null}
            />
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
            <DeckMap className="h-full w-full" pins={plannerPins} paths={plannerPaths} onPinClick={(id) => { if (!id.startsWith('origin:')) setChosenId(id); }} />
            <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
              <div className="rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 backdrop-blur-md">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sky-300">Where next? Tap a city</p>
                <p className="font-display text-lg text-white">{origin.city} → {destination.city}</p>
                <p className="font-mono text-xs text-white/60">{plannerKm.toLocaleString()} km</p>
                <button type="button" onClick={() => void startCityPoll()} className="mt-1.5 rounded-lg border border-amber-300/40 px-2 py-0.5 text-xs text-amber-200 hover:bg-amber-300/10">
                  Let the class vote (with reasons)
                </button>
              </div>
              <button type="button" onClick={takeOff} className="rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-2.5 font-display text-base text-[#1a1204] shadow-[0_10px_30px_rgba(255,160,60,.35)] hover:brightness-105">
                Take off to {destination.city}
              </button>
            </div>
          </>
        ) : (
          <FlightTracker origin={origin} destination={destination} progress={routeT} minutesLeft={minutesLeft} below={below.name} holding={holding} />
        )}
        <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
          {mapMode === 'pins' ? (
            <div className="rounded-xl border border-white/15 bg-slate-950/75 px-3 py-2 backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rose-300">{pinRound ? 'Pins open on your phones' : 'Class map'}</p>
              <p className="font-display text-lg text-white">{pinRound?.prompt ?? 'Pinned by the class'}</p>
              <p className="font-mono text-xs text-white/60">{pins.length} pin{pins.length === 1 ? '' : 's'}</p>
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
      <WindscreenFlight
        stage={flightStage}
        origin={origin}
        destination={destination}
        timeOfDay={skyNow.timeOfDay}
        sun={skyNow.sun}
        weather={liveWx?.condition ?? rollWeather(`${sessionId}:${destination.id}`, destination.scene, skyNow.timeOfDay === 'night')}
        cloudCover={liveWx?.cloudCover}
        terrain={place.overCity ? 'farmland' : below.terrain}
        region={place.overCity ? `city:${place.overCity}` : below.terrain === 'farmland' || below.terrain === 'hills' ? regionOf(below.point) : null}
        calm={view !== 'boarding' && view !== 'talk'}
        onCinematic={setCinematic}
        onLanded={() => {
          setLanded(true);
          window.setTimeout(() => onCompleteSession(destination.id), 9000);
        }}
      />
      {focused && !cinematic && !landed && view !== 'boarding' && view !== 'map' && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
          <span className="max-w-[70%] truncate rounded-full border border-white/20 bg-slate-950/65 px-3 py-1 text-xs text-white/90 backdrop-blur-md">
            <b className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">Now talking about</b>&nbsp; {focused.title}
          </span>
        </div>
      )}
      {flightStage === 'flying' && !cinematic && below.name && view !== 'map' && (
        <p className="pointer-events-none absolute bottom-3 left-4 z-[5] rounded-full border border-white/20 bg-slate-950/55 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm">
          {holding ? `Holding over ${destination.city}` : `Below us: ${place.label}`} · {liveWx?.utcOffsetSeconds !== undefined ? offsetClock(liveWx.utcOffsetSeconds, new Date(now)) : skyNow.clock}{liveWx ? ` · ${liveWx.label}` : ''}
        </p>
      )}

      {/* The running module lives here in the Game view; elsewhere it stays mounted off-screen. */}
      {/* pb-16 keeps the floating "End activity" pill clear of the game's last buttons */}
      <div
        className={view === 'game' && runningKey ? `absolute inset-0 overflow-y-auto p-4 pb-16 sm:p-6 sm:pb-16 ${gameGlass ? 'lc-game-glass' : ''}` : 'hidden'}
        style={zoomLayout && sceneZoom > 1 ? { zoom: Math.min(1.35, sceneZoom) } : undefined}
      >
        {runningKey ? moduleHost : null}
      </div>

      {scene !== null && !cinematic && !landed && flightStage !== 'landing' && (
        <AnimatePresence mode="wait">
          <motion.div
            key={view + (shown?.id ?? '')}
            initial={reduce ? false : { opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center p-6"
            // Zoom layout: grow the content with the (much bigger) windscreen so it reads on a phone in Zoom.
            style={sceneZoom !== 1 ? { zoom: sceneZoom } : undefined}
          >
            {scene}
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

      {landed && (
        <div className="absolute inset-x-0 top-10 z-20 flex justify-center">
          <motion.div initial={reduce ? false : { y: -20, rotate: -6, opacity: 0 }} animate={{ y: 0, rotate: -2, opacity: 1 }} className="rounded-2xl bg-[#f4efe3] px-7 py-5 text-[#1b2233] shadow-2xl">
            <p className="font-display text-3xl">Welcome to {destination.city}</p>
            <p className="mt-1 text-sm">Passport stamped. Thanks for flying with {className}!</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1b2233]/60">Our journey · {journeyPaths.length} flight{journeyPaths.length === 1 ? '' : 's'}</p>
            <DeckMap className="mt-1 h-44 w-[min(420px,70vw)] rounded-xl" pins={journeyPins} paths={journeyPaths} labels={false} />
          </motion.div>
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
    <div className={`relative grid h-[100dvh] ${zoomLayout ? 'grid-cols-[48px_minmax(0,1fr)_48px] grid-rows-[46px_minmax(0,1fr)_56px] gap-2' : 'grid-cols-[220px_minmax(0,1fr)_240px] grid-rows-[52px_minmax(0,1fr)_176px] gap-2.5'} bg-[radial-gradient(ellipse_120%_70%_at_50%_120%,#1b2438_0%,#0b1120_55%,#05070D_100%)] p-2.5 text-white`}>
      <SnapGuides hosts={snapHosts} />
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
        <span className="font-mono text-xs font-semibold tracking-[0.14em] text-white/70">FLIGHT <b className="font-semibold text-amber-300">{className.toUpperCase()}</b></span>
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
          {VIEWS.map((v) => {
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
        <button type="button" onClick={() => setPresenting(true)} className="flex items-center gap-1.5 rounded-lg border border-[#2A3854] px-2.5 py-1.5 text-xs text-white/75 hover:text-white">
          <Maximize2 className="h-3.5 w-3.5" /> Present
        </button>
        <div className="relative">
          <button type="button" onClick={() => setPanel(panel === 'menu' ? null : 'menu')} aria-label="Flight menu" className="rounded-lg border border-[#2A3854] p-1.5 text-white/75 hover:text-white">
            <Menu className="h-4 w-4" />
          </button>
          {panel === 'menu' && (
            <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-[#2A3854] bg-[#0c1322] p-1.5 shadow-2xl">
              <a href={flightHref} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/5"><Plane className="h-4 w-4" /> Launch a flight</a>
              <button
                type="button"
                onClick={() => {
                  setPanel(null);
                  if (flightStage === 'flying') {
                    if (runningKey) onReturn();
                    setFlightStage('landing');
                    flash(`Beginning our descent into ${destination.city}`);
                  } else {
                    // Never took off: the class is still at its departure city.
                    onEndSession(origin.id);
                  }
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-400/10"
              >
                {flightStage === 'flying' ? `Land in ${destination.city} and end` : 'End the session'}
              </button>
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
            <button type="button" onClick={onReturn} className="rounded-full border border-white/25 bg-slate-950/75 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-slate-900">
              End activity · back to the room
            </button>
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
        <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[80px_80px_22px_22px] border border-[#2A3854] bg-gradient-to-b from-[#141e32] to-[#0d1524] px-3 pb-3 pt-7">
          <p className="absolute inset-x-0 top-2.5 text-center font-mono text-[9px] tracking-[0.2em] text-white/35">FLIGHT DECK</p>
          {Array.from({ length: seatCount / 4 }, (_, r) => (
            <div key={r} className="grid grid-cols-[1fr_1fr_12px_1fr_1fr] items-center gap-1.5">
              {[0, 1, -1, 2, 3].map((c) => {
                if (c === -1) return <span key="aisle" className="text-center font-mono text-[8px] text-white/30">{r + 1}</span>;
                const occupant = seated[r * 4 + c];
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
                        onClick={() => { setSpotlight(p.id); flash(`${p.display_name}, you're up!`); }}
                        initial={reduce ? false : { y: -40, scale: 0.4, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                        className="touch-none"
                        title={`${p.display_name} · Seat ${cabinSeatLabel(r * 4 + c)}`}
                      >
                        <CrewAvatar seed={p.avatar_seed ?? p.display_name} name={p.display_name} size={40} />
                      </motion.button>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full border border-dashed border-[#2b3855]" />
                    )}
                    {p && <span className="absolute -bottom-3 left-1/2 max-w-[56px] -translate-x-1/2 truncate font-mono text-[8px] text-white/60">{p.display_name}</span>}
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
          {(Object.keys(INSTRUMENT_LABEL) as Instrument[]).map((k) => {
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
                title={s.description}
                className={['cursor-grab touch-none select-none rounded-lg border-[1.5px] border-dashed px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] transition-transform hover:-rotate-2 hover:scale-105', STAMP_TONES[i % STAMP_TONES.length]].join(' ')}
              >
                {s.name}
              </button>
            ))}
            <button type="button" onClick={() => setPanel(panel === 'catalogue' ? null : 'catalogue')} className="rounded-lg border-[1.5px] border-dashed border-white/30 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-white/70 hover:text-white">
              All {catalogue.length}…
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
            <a href={flightHref} className="flex items-center gap-1.5 rounded-lg border border-amber-300/40 px-2.5 py-1.5 text-xs text-amber-200 hover:bg-amber-300/10">
              <Plane className="h-3.5 w-3.5" /> Launch a flight
            </a>
            <button type="button" onClick={openPopout} className="flex items-center gap-1.5 rounded-lg border border-[#2A3854] px-2.5 py-1.5 text-xs text-white/70 hover:text-white">
              <ExternalLink className="h-3.5 w-3.5" /> Sources
            </button>
          </div>
        </div>
      </section>

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
    </div>
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

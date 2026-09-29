'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ExternalLink, Maximize2, Menu, Minimize2, Plane, Search, Shuffle, X } from 'lucide-react';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';
import { CrewAvatar } from '@/components/ui/crew-avatar';
import { WindscreenFlight, timeOfDayNow, type FlightStage, type FlightCity } from '@/components/live-room/flight/windscreen-flight';
import { LC_INTERNATIONAL_COORD, overflightAt, type LatLng } from '@/lib/live-room/route-terrain';
import { WORLD_DESTINATIONS, STARTER_PLANE_RANGE_KM } from '@/data/world-flight/destinations';
import { destinationsWithinRange } from '@/lib/world-flight/geo';
import { HOME_BASE_ID, HOME_BASE_NAME, HOME_BASE_SCENE } from '@/lib/world-flight/home-base';
import { Leaderboard } from '@/components/session/leaderboard';
import { CatalogueDrawer } from '@/components/live-room/ui/cockpit-workspace/cockpit-panels';
import type { CatalogueEntry } from '@/components/live-room/ui/cockpit-workspace/types';
import { WIDGET_REGISTRY } from '@/components/session/widget-registry';
import { useWidgetStore } from '@/stores/widget-store';
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

export type DeckView = 'boarding' | 'talk' | 'show' | 'game' | 'scores';
type Instrument = 'aboard' | 'answered' | 'clock' | 'top';

const VIEWS: { key: DeckView; label: string }[] = [
  { key: 'boarding', label: 'Boarding' },
  { key: 'talk', label: 'Talk' },
  { key: 'show', label: 'Show' },
  { key: 'game', label: 'Game' },
  { key: 'scores', label: 'Scores' },
];
const INSTRUMENT_LABEL: Record<Instrument, string> = { aboard: 'On board', answered: 'Answered', clock: 'Flight time', top: 'Top score' };
const STAMP_TONES = ['border-orange-300/70 text-orange-200', 'border-emerald-300/70 text-emerald-200', 'border-sky-300/70 text-sky-200', 'border-violet-300/70 text-violet-200'];
type RouteCity = FlightCity & LatLng;
const HOME: RouteCity = { id: HOME_BASE_ID, city: HOME_BASE_NAME, scene: HOME_BASE_SCENE, ...LC_INTERNATIONAL_COORD };
/** Take-off to arrival spans roughly one lesson; progress along the route follows the clock. */
const LESSON_MS = 45 * 60_000;
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
  onEndSession: () => void;
  /** End as a completed flight (World Flight records the landing and moves the class). */
  onCompleteSession: () => void;
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
  const [position, setPosition] = useState<{ currentDestinationId: string | null; rangeKm: number } | null>(null);
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
  const [talkPrompt, setTalkPrompt] = useState('');
  const [huds, setHuds] = useState<Instrument[]>([]);
  const [hudPos, setHudPos] = useState<Record<string, { x: number; y: number }>>({});
  const [presenting, setPresenting] = useState(false);
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
  const routeT = takeoffAt ? Math.min(0.97, Math.max(0, (now - takeoffAt) / LESSON_MS)) : 0;
  const below = useMemo(() => overflightAt(origin, destination, routeT), [origin, destination, routeT]);
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
    flash(`Captain's announcement: ${entry?.name ?? 'Activity'}${sourceItem ? ` from "${sourceItem.title}"` : ''}, boarding now`);
    const game = games.find((g) => g.key === key);
    if (game) return onLaunchGame(game);
    const activity = activities.find((a) => a.key === key);
    if (activity) onLaunchActivity(activity);
  }, [catalogue, games, activities, onLaunchGame, onLaunchActivity, setSourceMaterial, setCustomTopic, flash, sessionId]);

  const focused = material.find((m) => m.id === focusId) ?? null;

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
    });
    return () => channel?.close();
  }, [sessionId, present, addItem]);

  const openPopout = () => {
    const popup = window.open(`/sessions/${encodeURIComponent(sessionId)}/sources`, `lc-sources-${sessionId}`, 'popup,width=480,height=860');
    if (popup) popup.focus();
    else setPanel('sources');
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
  const flightMs = startedAt ? now - new Date(startedAt).getTime() : 0;
  const readings: Record<Instrument, { value: string; frac: number; sub?: string }> = {
    aboard: { value: String(seated.length), frac: rosterCount ? Math.min(1, seated.length / rosterCount) : seated.length ? 1 : 0, sub: rosterCount ? `of ${rosterCount}` : undefined },
    answered: { value: runningKey && seated.length ? `${Math.round((answered.size / seated.length) * 100)}%` : '—', frac: runningKey && seated.length ? answered.size / seated.length : 0 },
    clock: { value: fmtClock(flightMs), frac: Math.min(1, flightMs / 3_600_000), sub: 'h:mm' },
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
    WIDGET_REGISTRY.forEach((w) => closeWidgetStore(w.id));
  }, [closeWidgetStore]);
  const openTool = (id: string, x: number, y: number) => {
    setWidgetPosition(id, { x: Math.max(8, Math.min(window.innerWidth - 340, x - 160)), y: Math.max(8, y - 420) });
    openWidgetStore(id);
    bringToFront(id);
  };

  // ── drag & drop ──────────────────────────────────────────────────────────
  const windRef = useRef<HTMLDivElement>(null);
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

  // ── windscreen content ───────────────────────────────────────────────────
  let scene: ReactNode;
  if (view === 'boarding') {
    scene = (
      <div className="flex flex-wrap items-center justify-center gap-8 rounded-3xl border border-white/15 bg-slate-950/60 px-8 py-7 backdrop-blur-md">
        <span className="rounded-2xl bg-white p-3"><QRCodeSVG value={joinUrl} size={176} level="M" includeMargin={false} /></span>
        <div className="flex max-w-md flex-col gap-3 text-left">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Now boarding</p>
          <p className="font-display text-4xl leading-tight text-white">Scan to board<br />{className}</p>
          <p className="break-all font-mono text-sm text-white/70">{joinUrl.replace(/^https?:\/\//, '')}</p>
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
            </label>
          )}
          {flightStage === 'gate' && (
            <button
              type="button"
              onClick={() => {
                setFlightStage('flying');
                setTakeoffAt(Date.now());
                flash(`Flight to ${destination.city}: cleared for take-off`);
                // Record the leg on the class's World Flight journey.
                void fetch(`/api/session/${encodeURIComponent(sessionId)}/room-leg`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ destinationId: destination.id }),
                }).catch(() => {});
              }}
              className="mt-1 w-max rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-6 py-3 font-display text-lg text-[#1a1204] shadow-[0_10px_30px_rgba(255,160,60,.35)] hover:brightness-105"
            >
              Take off to {destination.city}
            </button>
          )}
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
          onChange={(e) => setTalkPrompt(e.target.value)}
          placeholder={presenting ? '' : 'Type a question for the class…'}
          rows={3}
          className="w-full resize-none bg-transparent text-center font-display text-4xl leading-tight text-white placeholder:text-white/40 focus:outline-none [text-shadow:0_2px_18px_rgba(0,0,0,.45)]"
        />
      </div>
    );
  } else if (view === 'show') {
    scene = shown ? (
      <div className="flex max-h-full w-full max-w-4xl flex-col gap-3 overflow-y-auto rounded-3xl border border-white/15 bg-slate-950/60 p-6 backdrop-blur-md">
        <ShownItem item={shown} />
      </div>
    ) : (
      <div className="rounded-3xl border border-dashed border-white/40 bg-slate-950/40 px-10 py-8 text-center backdrop-blur-md">
        <p className="font-display text-3xl text-white">Drag something from the cargo hold</p>
        <p className="mt-2 text-white/70">…or search for it with Sources.</p>
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
        timeOfDay={timeOfDayNow(new Date(now))}
        terrain={below.terrain}
        calm={view !== 'boarding' && view !== 'talk'}
        onCinematic={setCinematic}
        onLanded={() => {
          setLanded(true);
          window.setTimeout(onCompleteSession, 4500);
        }}
      />
      {flightStage === 'flying' && !cinematic && below.name && (
        <p className="pointer-events-none absolute bottom-3 left-4 z-[5] rounded-full border border-white/20 bg-slate-950/55 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm">
          Below us: {below.name}
        </p>
      )}

      {/* The running module lives here in the Game view; elsewhere it stays mounted off-screen. */}
      <div className={view === 'game' && runningKey ? 'absolute inset-0 overflow-y-auto p-4 sm:p-6' : 'hidden'}>
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
    <div className="grid h-[100dvh] grid-cols-[220px_minmax(0,1fr)_240px] grid-rows-[52px_minmax(0,1fr)_176px] gap-2.5 bg-[radial-gradient(ellipse_120%_70%_at_50%_120%,#1b2438_0%,#0b1120_55%,#05070D_100%)] p-2.5 text-white">
      <style>{'@keyframes deck-drift{from{transform:translateX(110vw)}to{transform:translateX(-120%)}} [data-deck-drag] img{-webkit-user-drag:none;user-select:none;pointer-events:none}'}</style>

      {/* Glareshield */}
      <header className="col-span-3 flex items-center gap-3 rounded-2xl border border-[#2A3854] bg-gradient-to-b from-[#141d30] to-[#0c1322] px-3">
        <span className="font-mono text-xs font-semibold tracking-[0.14em] text-white/70">FLIGHT <b className="font-semibold text-amber-300">{className.toUpperCase()}</b></span>
        <span className="flex min-w-0 items-center gap-2 rounded-full border border-amber-300/45 bg-amber-300/10 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-300" aria-live="polite">
          <i className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-rose-400 shadow-[0_0_10px_#fb7185]" />
          <span className="truncate">On screen: {onScreenLabel}</span>
        </span>
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
                    onEndSession();
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
      <aside className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-2xl border border-[#2A3854] bg-gradient-to-b from-[#0e1524] to-[#0a101c] p-3">
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
      <div className="relative min-h-0">
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
          <button type="button" onClick={onReturn} className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/25 bg-slate-950/75 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-slate-900">
            End activity · back to the room
          </button>
        )}
      </div>

      {/* Cabin */}
      <aside className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-2xl border border-[#2A3854] bg-gradient-to-b from-[#0e1524] to-[#0a101c] p-3">
        <p className="flex justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Cabin <span>{seated.length}{rosterCount ? ` / ${rosterCount}` : ''}</span></p>
        <button type="button" onClick={spinRoulette} disabled={seated.length === 0 || !!roulette} className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300/50 bg-amber-300/10 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300 hover:bg-amber-300/20 disabled:opacity-40">
          <Shuffle className="h-3.5 w-3.5" /> Pick a student
        </button>
        <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[80px_80px_22px_22px] border border-[#2A3854] bg-gradient-to-b from-[#141e32] to-[#0d1524] px-3 pb-3 pt-7">
          <p className="absolute inset-x-0 top-2.5 text-center font-mono text-[9px] tracking-[0.2em] text-white/35">FLIGHT DECK</p>
          {Array.from({ length: seatCount / 4 }, (_, r) => (
            <div key={r} className="grid grid-cols-[1fr_1fr_12px_1fr_1fr] items-center gap-1.5">
              {[0, 1, -1, 2, 3].map((c) => {
                if (c === -1) return <span key="aisle" className="text-center font-mono text-[8px] text-white/30">{r + 1}</span>;
                const p = seated[r * 4 + c];
                const k = p ? keyOf(p) : '';
                const lit = p && answered.has(k);
                const spot = p && (spotlight === p.id || roulette === p.id);
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
                        title={p.display_name}
                      >
                        <CrewAvatar seed={p.avatar_seed ?? p.display_name} name={p.display_name} size={30} className="rounded-full" />
                      </motion.button>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full border border-dashed border-[#2b3855]" />
                    )}
                    {p && <span className="absolute -bottom-3 left-1/2 max-w-[56px] -translate-x-1/2 truncate font-mono text-[8px] text-white/60">{p.display_name}</span>}
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
      <section className="col-span-3 grid min-h-0 grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-2xl border border-[#2A3854] bg-gradient-to-b from-[#141c2d] to-[#0b111d] px-3.5 py-3">
        <div className="flex gap-2.5">
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
        <div className="flex min-w-0 flex-col gap-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Activities · drag onto the windscreen{focused ? ` (built from "${focused.title}")` : ''} or onto a cargo item
          </p>
          <div className="flex flex-wrap gap-2">
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
          <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Tools · open where you click, drag anywhere</p>
          <div className="flex flex-wrap gap-2">
            {WIDGET_REGISTRY.filter((w) => w.id !== 'random-picker').map((w) => (
              <button key={w.id} type="button" onClick={(e) => openTool(w.id, e.clientX, e.clientY)} className="flex items-center gap-1.5 rounded-lg border border-[#2A3854] bg-[#111A2B] px-2.5 py-1.5 text-xs text-white/70 hover:border-[#3d5176] hover:text-white">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={w.iconPath} /></svg>
                {w.label}
              </button>
            ))}
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

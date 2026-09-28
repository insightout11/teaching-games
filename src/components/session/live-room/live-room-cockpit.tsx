'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink } from 'lucide-react';
import type { GamePlugin } from '@/games/types';
import type { ActivityPlugin } from '@/activities/types';
import type { Student } from '@/lib/supabase/types';
import { CockpitWorkspace } from '@/components/live-room/ui/cockpit-workspace';
import { cockpitReducer, type CockpitAction } from '@/components/live-room/ui/cockpit-workspace/cockpit-state';
import type {
  CatalogueEntry,
  CockpitCallbacks,
  CockpitState,
  MaterialKind,
  TrayItem,
  WidgetSlot,
} from '@/components/live-room/ui/cockpit-workspace/types';
import { WIDGET_REGISTRY } from '@/components/session/widget-registry';
import { useSessionStore } from '@/stores/session-store';
import { useLiveRoomStore, useRoom, type RoomItem } from '@/stores/live-room-store';
import { countsForLeaderboard } from '@/lib/scoring-reporting';
import { SourcesDrawer, hostOf } from '@/components/session/live-room/sources-drawer';
import { ShownItem } from '@/components/session/live-room/shown-item';
import { openRoomChannel } from '@/components/session/live-room/room-channel';
import { roomItemToSource } from '@/components/session/live-room/room-source';

/**
 * Binds the agreed Live Room cockpit (CC-08A composition) to a real session on
 * the existing lesson engine. The composition decides nothing; this file maps
 * real data in and real actions out:
 *  - catalogue → the registries; launching runs the real game/activity, which
 *    session-view portals into `moduleHost`
 *  - scores → the session store the Leaderboard reads
 *  - widgets → the real widget components
 *  - tray → room material (Sources drawer / pop-out)
 *  - "Use as focus" → the source every launched activity is grounded in
 */

type Action = CockpitAction | { type: 'sync-items'; items: TrayItem[] } | { type: 'hydrate'; state: CockpitState };

function reducer(state: CockpitState, action: Action): CockpitState {
  if (action.type === 'sync-items') return { ...state, items: action.items };
  if (action.type === 'hydrate') return action.state;
  return cockpitReducer(state, action);
}

const storageKey = (sessionId: string) => `lc-cockpit:${sessionId}`;

function kindOf(item: RoomItem): MaterialKind {
  if (item.kind === 'image') return 'image';
  if (item.kind === 'place') return 'place';
  if (item.kind === 'video') return 'video';
  return 'source';
}

function toTray(item: RoomItem): TrayItem {
  const publisher = item.publisher ?? hostOf(item.url);
  return {
    id: item.id,
    kind: kindOf(item),
    title: item.title,
    caption: publisher,
    detail: item.text ?? item.description ?? item.address ?? undefined,
    attribution: `${publisher} · ${item.url}`,
  };
}

export interface LiveRoomCockpitProps {
  sessionId: string;
  className: string;
  joinUrl: string;
  cockpitUrl: string;
  participantCount: number;
  games: GamePlugin[];
  activities: ActivityPlugin[];
  /** Key of the game/activity running in the session right now, if any. */
  runningKey: string | null;
  moduleHost: ReactNode;
  topic: string;
  difficulty: string;
  onLaunchGame: (game: GamePlugin) => void;
  onLaunchActivity: (activity: ActivityPlugin) => void;
  onReturn: () => void;
  onEndSession: () => void;
}

export function LiveRoomCockpit({
  sessionId,
  className,
  joinUrl,
  cockpitUrl,
  participantCount,
  games,
  activities,
  runningKey,
  moduleHost,
  topic,
  difficulty,
  onLaunchGame,
  onLaunchActivity,
  onReturn,
  onEndSession,
}: LiveRoomCockpitProps) {
  const students = useSessionStore((s) => s.students) as Student[];
  const scores = useSessionStore((s) => s.scores);
  const setSourceMaterial = useSessionStore((s) => s.setSourceMaterial);
  const setCustomTopic = useSessionStore((s) => s.setCustomTopic);
  const { material } = useRoom(sessionId);
  const addItem = useLiveRoomStore((s) => s.add);
  const markRoom = useLiveRoomStore((s) => s.markRoom);
  useEffect(() => markRoom(sessionId), [sessionId, markRoom]);

  const [presenting, setPresenting] = useState(false);

  const initial = useMemo<CockpitState>(
    () => ({
      identity: { className, sessionLabel: 'Live Room' },
      lesson: { title: '', objectives: '', level: difficulty, tone: '' },
      drawer: null,
      overlay: null,
      items: [],
      selectedItemId: null,
      focusedItemId: null,
      stage: { kind: 'idle' },
      publicView: { kind: 'blank' },
      drafts: {},
      widgets: [],
      scoreMode: 'competitive',
      pinnedScores: false,
      catalogue: { query: '', category: null, favourites: [], recent: [] },
      participants: { roster: 0, present: 0, connected: 0 },
      save: { status: 'idle', error: null },
      activity: [],
    }),
    // Identity/level only seed the first render; later edits live in state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [state, dispatch] = useReducer(reducer, initial);

  // Restore teacher UI state after a refresh (drafts, focus, widgets, score mode…).
  const hydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey(sessionId));
      if (raw) {
        const saved = JSON.parse(raw) as CockpitState;
        dispatch({ type: 'hydrate', state: { ...initial, ...saved, drawer: null, overlay: null } });
      }
    } catch {
      // unreadable — start fresh
    }
    hydrated.current = true;
  }, [sessionId, initial]);
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      const { items: _items, activity: _activity, ...rest } = state;
      void _items;
      void _activity;
      sessionStorage.setItem(storageKey(sessionId), JSON.stringify(rest));
    } catch {
      // storage unavailable — state lives for this page only
    }
  }, [state, sessionId]);

  // Tray = room material.
  const trayItems = useMemo(() => material.map(toTray), [material]);
  useEffect(() => dispatch({ type: 'sync-items', items: trayItems }), [trayItems]);

  // Keep the stage in step with what the session is actually running.
  useEffect(() => {
    if (runningKey) {
      if (state.stage.kind !== 'module' || state.stage.entryKey !== runningKey) {
        dispatch({ type: 'launch-entry', key: runningKey });
      }
    } else if (state.stage.kind === 'module') {
      dispatch({ type: 'return-to-room' });
    }
  }, [runningKey, state.stage]);

  useEffect(() => {
    dispatch({
      type: 'set-participants',
      participants: { roster: students.length, present: participantCount, connected: participantCount },
    });
  }, [students.length, participantCount]);

  const catalogue = useMemo<CatalogueEntry[]>(
    () => [
      ...games.map((g) => ({
        key: g.key, name: g.name, description: g.description, category: g.category, kind: 'game' as const,
        readiness: 'ready' as const, minutes: g.estimatedMinutes, deviceFree: g.deviceFree, scored: true,
      })),
      ...activities.map((a) => ({
        key: a.key, name: a.name, description: a.description, category: a.category, kind: 'activity' as const,
        readiness: 'ready' as const, minutes: a.estimatedMinutes, deviceFree: a.deviceFree,
      })),
    ],
    [games, activities],
  );
  const categories = useMemo(() => Array.from(new Set(catalogue.map((c) => c.category))), [catalogue]);

  const itemsRef = useRef(state.items);
  itemsRef.current = state.items;
  const materialRef = useRef(material);
  materialRef.current = material;

  // Add a found source to the room; optionally select + show it straight away.
  const receive = useCallback((item: RoomItem, show: boolean) => {
    addItem(sessionId, item);
    const exists = itemsRef.current.some((t) => t.id === item.id);
    const items = exists ? itemsRef.current : [toTray(item), ...itemsRef.current];
    dispatch({ type: 'sync-items', items });
    if (show) {
      dispatch({ type: 'select-item', id: item.id });
      dispatch({ type: 'show-item', id: item.id });
    }
  }, [addItem, sessionId]);

  // Show/Add from the pop-out search window.
  useEffect(() => {
    const channel = openRoomChannel(sessionId, (m) => {
      if (m.type === 'show') receive(m.item, true);
      else if (m.type === 'add') receive(m.item, false);
    });
    return () => channel?.close();
  }, [sessionId, receive]);

  const launch = useCallback((key: string) => {
    // "Use as focus" is the room's working item: whatever launches is grounded in it.
    const focused = materialRef.current.find((m) => m.id === state.focusedItemId);
    if (focused) {
      setSourceMaterial(roomItemToSource(focused));
      setCustomTopic(focused.title.slice(0, 120));
    } else {
      setSourceMaterial(null);
    }
    const game = games.find((g) => g.key === key);
    if (game) return onLaunchGame(game);
    const activity = activities.find((a) => a.key === key);
    if (activity) onLaunchActivity(activity);
  }, [state.focusedItemId, games, activities, onLaunchGame, onLaunchActivity, setSourceMaterial, setCustomTopic]);

  const callbacks = useMemo<CockpitCallbacks>(() => ({
    openDrawer: (drawer) => dispatch({ type: 'open-drawer', drawer }),
    openOverlay: (overlay) => dispatch({ type: 'open-overlay', overlay }),
    selectItem: (id) => dispatch({ type: 'select-item', id }),
    focusItem: (id) => dispatch({ type: 'focus-item', id }),
    showItem: (id) => dispatch({ type: 'show-item', id }),
    stopShowing: () => dispatch({ type: 'stop-showing' }),
    changeDraft: (id, value) => dispatch({ type: 'change-draft', id, value }),
    openWidget: (id) => dispatch({ type: 'open-widget', id }),
    closeWidget: (id) => dispatch({ type: 'close-widget', id }),
    toggleMinimize: (id) => dispatch({ type: 'toggle-minimize', id }),
    setScoreMode: (mode) => dispatch({ type: 'set-score-mode', mode }),
    togglePinnedScores: () => dispatch({ type: 'toggle-pinned-scores' }),
    searchCatalogue: (query) => dispatch({ type: 'search-catalogue', query }),
    filterCatalogue: (category) => dispatch({ type: 'filter-catalogue', category }),
    toggleFavourite: (key) => dispatch({ type: 'toggle-favourite', key }),
    // The real engine has no separate set-up step: configure = launch.
    configureEntry: (key) => launch(key),
    launchEntry: (key) => launch(key),
    returnToRoom: () => onReturn(),
    showPublic: (view) => dispatch({ type: 'show-public', view }),
    updateLesson: (patch) => dispatch({ type: 'update-lesson', patch }),
    present: () => setPresenting(true),
  }), [launch, onReturn]);

  // Scores: the same aggregation the Leaderboard uses, from the same store.
  const scoreRows = useMemo(() => {
    const totals = new Map<string, { id: string; name: string; points: number }>();
    students.forEach((s) => totals.set(s.id, { id: s.id, name: s.name, points: 0 }));
    scores.filter(countsForLeaderboard).forEach((sc) => {
      const key = sc.student_id || sc.client_id;
      if (!key) return;
      const entry = totals.get(key) ?? (sc.display_name ? { id: key, name: sc.display_name, points: 0 } : null);
      if (!entry) return;
      entry.points += sc.points;
      totals.set(key, entry);
    });
    return Array.from(totals.values()).sort((a, b) => b.points - a.points);
  }, [students, scores]);

  const widgetSlots = useMemo<WidgetSlot[]>(
    () => WIDGET_REGISTRY.map((w) => ({ id: w.id as WidgetSlot['id'], label: w.label, iconPath: w.iconPath, availability: 'local' as const })),
    [],
  );
  const widgetBodies = useMemo(() => {
    const ctx = { sessionId, students, topic, difficulty };
    return Object.fromEntries(
      WIDGET_REGISTRY.map((w) => {
        const Component = w.component;
        return [w.id, <Component key={w.id} {...(w.getProps ? w.getProps(ctx) : {})} />];
      }),
    );
  }, [sessionId, students, topic, difficulty]);

  const openPopout = () => {
    const popup = window.open(`/sessions/${encodeURIComponent(sessionId)}/sources`, `lc-sources-${sessionId}`, 'popup,width=480,height=860');
    popup?.focus();
  };

  const sourcesSlot = (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <button
        type="button"
        onClick={openPopout}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-lc-border px-3 py-2 text-xs text-lc-text2 hover:text-lc-text"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        Search in a private window (the class won&apos;t see it)
      </button>
      <div className="min-h-0 flex-1">
        <SourcesDrawer
          sessionId={sessionId}
          onShow={(item) => receive(item, true)}
          onAdd={(item) => receive(item, false)}
          onClose={() => dispatch({ type: 'open-drawer', drawer: null })}
          fill
        />
      </div>
    </div>
  );

  const joinSlot = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-lc-border bg-lc-card p-4">
        <p className="text-[11px] uppercase tracking-wide text-lc-text3">For students</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <span className="rounded-xl bg-white p-2">
            <QRCodeSVG value={joinUrl} size={132} level="M" includeMargin={false} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="break-all font-[family-name:var(--font-instrument)] text-sm text-lc-text">{joinUrl}</p>
            <p className="mt-1 text-sm text-lc-text2">Students scan or open the link. They don&apos;t need an account.</p>
            <p className="mt-1 text-sm text-lc-text3">{participantCount} on board</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-lc-border bg-lc-card p-4">
        <p className="text-[11px] uppercase tracking-wide text-lc-text3">For your other device</p>
        <p className="mt-1 text-sm text-lc-text2">Control this lesson from your phone or tablet. It asks you to sign in.</p>
        <a href={cockpitUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex rounded-lg border border-lc-border px-3 py-1.5 text-sm text-lc-text hover:bg-lc-card">
          Open on another device
        </a>
      </div>
    </div>
  );

  const materialBody = useCallback((id: string) => {
    const item = material.find((m) => m.id === id);
    return item ? <ShownItem item={item} /> : null;
  }, [material]);

  return (
    <CockpitWorkspace
      state={state}
      callbacks={callbacks}
      catalogue={catalogue}
      categories={categories}
      widgets={widgetSlots}
      scores={scoreRows}
      teams={[]}
      classCode=""
      sourcesSlot={sourcesSlot}
      widgetBodies={widgetBodies}
      presenting={presenting}
      onExitPresenting={() => setPresenting(false)}
      moduleHost={runningKey ? moduleHost : undefined}
      materialBody={materialBody}
      joinSlot={joinSlot}
      onEndSession={onEndSession}
    />
  );
}

/** Mounts a stable DOM node (the portal target) wherever it is rendered. */
export function HostSlot({ el }: { el: HTMLElement }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.appendChild(el);
    return () => {
      if (el.parentNode === node) node.removeChild(el);
    };
  }, [el]);
  return <div ref={ref} className="min-h-0 w-full" />;
}

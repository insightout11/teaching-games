/**
 * UI-only contracts for the cockpit composition.
 *
 * These describe what the *interface* needs to render and what intents it
 * raises. They deliberately assume nothing about a server: no session shape, no
 * command envelope, no transport. CC-08B binds them to released runtime
 * contracts; until then every one of them is satisfied by a fixture.
 *
 * Where a name matches an existing runtime concept (material, run, widget), it
 * is a *view* of that concept, not a replacement for it.
 */

/** Which single task drawer is open. Only ever one. */
export type DrawerKind = 'sources' | 'catalogue' | 'inbox' | 'vocabulary' | 'roster' | null;

/** Which overlay owns the screen. Only ever one, and never with a drawer. */
export type OverlayKind = 'scores' | 'join' | 'menu' | null;

/**
 * How the teacher wants scores handled.
 *
 * `off` is a preference, not the absence of a scoreboard — the totals are still
 * there and still reachable.
 */
export type ScoreMode = 'class' | 'team' | 'competitive' | 'off';

export type MaterialKind = 'source' | 'note' | 'image' | 'place' | 'video' | 'vocabulary';

/**
 * One row in the material tray.
 *
 * `selected`, `focused` and `shown` are three different things and are kept
 * three different things: selecting opens it on the private stage, focus is the
 * room's working item, and shown is what the class can actually see.
 */
export interface TrayItem {
  id: string;
  kind: MaterialKind;
  title: string;
  /** One short line — provenance or type. Never the whole excerpt. */
  caption: string;
  /** Private teacher notes, if any. Never projected. */
  note?: string;
  /** Body shown only when this item is the selected one. */
  detail?: string;
  attribution?: string;
}

/** How integrated a catalogue entry actually is. Never fudged. */
export type CatalogueReadiness = 'ready' | 'configure' | 'not-integrated';

export interface CatalogueEntry {
  key: string;
  name: string;
  description: string;
  /** Registry category, shown as the teacher sees it. */
  category: string;
  kind: 'game' | 'activity' | 'move';
  readiness: CatalogueReadiness;
  /** Why it is not ready, when it is not. Shown instead of a dead button. */
  readinessNote?: string;
  minutes?: number;
  deviceFree?: boolean;
  scored?: boolean;
}

export type WidgetId =
  | 'timer'
  | 'random-picker'
  | 'poll'
  | 'class-board'
  | 'word-cloud'
  | 'class-questions';

/**
 * Whether a widget can be run from this composition yet.
 *
 * `local` runs entirely in the teacher's own view. `needs-session` talks to a
 * session the fixture does not have. `needs-input-owner` would take over the
 * student prompt and cannot be opened beside an activity without a decision
 * that does not exist yet.
 */
export type WidgetAvailability = 'local' | 'needs-session' | 'needs-input-owner';

export interface WidgetSlot {
  id: WidgetId;
  label: string;
  iconPath: string;
  availability: WidgetAvailability;
  /** What is missing, in the teacher's words. */
  note?: string;
}

/** An open widget window. Position is private and viewport-clamped. */
export interface OpenWidget {
  id: WidgetId;
  minimized: boolean;
}

/** What the stage is showing the teacher right now. */
export type StageMode =
  | { kind: 'idle' }
  | { kind: 'material'; itemId: string }
  | { kind: 'module'; entryKey: string; phase: 'configure' | 'running' }
  | { kind: 'reader' };

/** What the class can see. Deliberately small, and deliberately separate. */
export type PublicView =
  | { kind: 'blank' }
  | { kind: 'material'; itemId: string }
  | { kind: 'module'; entryKey: string }
  | { kind: 'scores' }
  | { kind: 'join' };

/**
 * The lesson's own settings, as the teacher edits them.
 *
 * Local only. Nothing here implies these reach a database; CC-08B binds them to
 * the room draft's real save path.
 */
export interface LessonSettings {
  title: string;
  objectives: string;
  level: string;
  tone: string;
}

export interface CockpitState {
  /** Class and session identity for the top bar. */
  identity: { className: string; sessionLabel: string };
  /** Edited in the menu, read by the top bar. One source for both. */
  lesson: LessonSettings;

  drawer: DrawerKind;
  overlay: OverlayKind;

  items: TrayItem[];
  selectedItemId: string | null;
  focusedItemId: string | null;

  stage: StageMode;
  publicView: PublicView;

  /** Per-item private drafts. Closing a panel never discards one. */
  drafts: Record<string, string>;

  widgets: OpenWidget[];
  scoreMode: ScoreMode;
  /** The compact strip beside the stage. A preference, not a projection. */
  pinnedScores: boolean;

  catalogue: { query: string; category: string | null; favourites: string[]; recent: string[] };

  participants: { roster: number; present: number; connected: number };
  /** Compact save state. A real error stays visible and actionable. */
  save: { status: 'idle' | 'saving' | 'saved' | 'error'; error: string | null };

  /** Everything a fixture simulated, so nothing here reads as a real action. */
  activity: string[];
}

/** Intents only. The composition decides nothing and stores nothing. */
export interface CockpitCallbacks {
  openDrawer: (drawer: DrawerKind) => void;
  openOverlay: (overlay: OverlayKind) => void;
  selectItem: (id: string) => void;
  focusItem: (id: string) => void;
  showItem: (id: string) => void;
  stopShowing: () => void;
  changeDraft: (id: string, value: string) => void;
  openWidget: (id: WidgetId) => void;
  closeWidget: (id: WidgetId) => void;
  toggleMinimize: (id: WidgetId) => void;
  setScoreMode: (mode: ScoreMode) => void;
  togglePinnedScores: () => void;
  searchCatalogue: (query: string) => void;
  filterCatalogue: (category: string | null) => void;
  toggleFavourite: (key: string) => void;
  configureEntry: (key: string) => void;
  launchEntry: (key: string) => void;
  returnToRoom: () => void;
  showPublic: (view: PublicView) => void;
  updateLesson: (patch: Partial<LessonSettings>) => void;
  /** Enter clean presentation of whatever the class is already set to see. */
  present: () => void;
}

/**
 * The cockpit's own rules.
 *
 * Three invariants live here rather than in any component, because they are
 * what the composition is *for*:
 *
 *  1. One drawer, or one overlay, and never both. The teaching stage is never
 *     buried under two things at once.
 *  2. Selecting is not showing, and showing is not focusing. Every one of those
 *     is a separate deliberate press.
 *  3. Nothing a teacher typed is discarded because a panel closed.
 *
 * Nothing here talks to a server, and nothing here is a substitute for the
 * room's real command path.
 */

import type {
  CockpitState,
  DrawerKind,
  LessonSettings,
  OverlayKind,
  PublicView,
  ScoreMode,
  WidgetId,
} from './types';

export type CockpitAction =
  | { type: 'open-drawer'; drawer: DrawerKind }
  | { type: 'open-overlay'; overlay: OverlayKind }
  | { type: 'select-item'; id: string }
  | { type: 'focus-item'; id: string }
  | { type: 'show-item'; id: string }
  | { type: 'stop-showing' }
  | { type: 'change-draft'; id: string; value: string }
  | { type: 'open-widget'; id: WidgetId }
  | { type: 'close-widget'; id: WidgetId }
  | { type: 'toggle-minimize'; id: WidgetId }
  | { type: 'set-score-mode'; mode: ScoreMode }
  | { type: 'toggle-pinned-scores' }
  | { type: 'search-catalogue'; query: string }
  | { type: 'filter-catalogue'; category: string | null }
  | { type: 'toggle-favourite'; key: string }
  | { type: 'configure-entry'; key: string }
  | { type: 'launch-entry'; key: string }
  | { type: 'return-to-room' }
  | { type: 'show-public'; view: PublicView }
  | { type: 'update-lesson'; patch: Partial<LessonSettings> }
  /**
   * A participant count changing underneath the lesson — someone joining late.
   * Deliberately touches nothing else: joining must never reset what the
   * teacher is doing.
   */
  | { type: 'set-participants'; participants: Partial<CockpitState['participants']> }
  | { type: 'escape' };

const MAX_RECENT = 6;
const MAX_ACTIVITY = 10;

const note = (state: CockpitState, entry: string): string[] =>
  [...state.activity, entry].slice(-MAX_ACTIVITY);

export function cockpitReducer(state: CockpitState, action: CockpitAction): CockpitState {
  switch (action.type) {
    case 'open-drawer':
      // Opening a drawer closes any overlay: one task surface at a time.
      return {
        ...state,
        drawer: state.drawer === action.drawer ? null : action.drawer,
        overlay: null,
      };

    case 'open-overlay':
      return {
        ...state,
        overlay: state.overlay === action.overlay ? null : action.overlay,
        drawer: null,
      };

    case 'escape':
      // One step back, innermost first, so Escape never closes two things.
      if (state.overlay) return { ...state, overlay: null };
      if (state.drawer) return { ...state, drawer: null };
      if (state.widgets.length > 0) return { ...state, widgets: state.widgets.slice(0, -1) };
      return state;

    case 'select-item': {
      // Private. It opens the item on the teacher's stage and does nothing to
      // what the class can see.
      const item = state.items.find(entry => entry.id === action.id);
      if (!item) return state;
      return {
        ...state,
        selectedItemId: action.id,
        stage: { kind: 'material', itemId: action.id },
      };
    }

    case 'focus-item':
      // Focus is the room's working item. Still not a projection.
      return { ...state, focusedItemId: action.id };

    case 'show-item': {
      const item = state.items.find(entry => entry.id === action.id);
      if (!item) return state;
      return {
        ...state,
        publicView: { kind: 'material', itemId: action.id },
        activity: note(state, `Simulated Show · ${item.title}`),
      };
    }

    case 'stop-showing':
      return {
        ...state,
        publicView: { kind: 'blank' },
        activity: note(state, 'Simulated stop showing'),
      };

    case 'change-draft':
      // Drafts belong to the item, so closing a panel or opening a drawer
      // cannot take one away.
      return { ...state, drafts: { ...state.drafts, [action.id]: action.value } };

    case 'open-widget':
      if (state.widgets.some(widget => widget.id === action.id)) {
        return { ...state, widgets: state.widgets.map(w => (w.id === action.id ? { ...w, minimized: false } : w)) };
      }
      return { ...state, widgets: [...state.widgets, { id: action.id, minimized: false }] };

    case 'close-widget':
      return { ...state, widgets: state.widgets.filter(widget => widget.id !== action.id) };

    case 'toggle-minimize':
      return {
        ...state,
        widgets: state.widgets.map(widget =>
          widget.id === action.id ? { ...widget, minimized: !widget.minimized } : widget,
        ),
      };

    case 'set-score-mode':
      return { ...state, scoreMode: action.mode };

    case 'toggle-pinned-scores':
      return { ...state, pinnedScores: !state.pinnedScores };

    case 'search-catalogue':
      return { ...state, catalogue: { ...state.catalogue, query: action.query } };

    case 'filter-catalogue':
      return { ...state, catalogue: { ...state.catalogue, category: action.category } };

    case 'toggle-favourite': {
      const favourites = state.catalogue.favourites.includes(action.key)
        ? state.catalogue.favourites.filter(key => key !== action.key)
        : [...state.catalogue.favourites, action.key];
      return { ...state, catalogue: { ...state.catalogue, favourites } };
    }

    case 'configure-entry':
      return {
        ...state,
        drawer: null,
        stage: { kind: 'module', entryKey: action.key, phase: 'configure' },
      };

    case 'launch-entry':
      return {
        ...state,
        drawer: null,
        overlay: null,
        stage: { kind: 'module', entryKey: action.key, phase: 'running' },
        catalogue: {
          ...state.catalogue,
          recent: [action.key, ...state.catalogue.recent.filter(key => key !== action.key)].slice(
            0,
            MAX_RECENT,
          ),
        },
        activity: note(state, `Simulated launch · ${action.key} · nothing was generated`),
      };

    case 'return-to-room':
      // Coming back restores the room. Widgets, drafts, scores and the public
      // view are all untouched by leaving and returning.
      return {
        ...state,
        stage: state.selectedItemId
          ? { kind: 'material', itemId: state.selectedItemId }
          : { kind: 'idle' },
        activity: note(state, 'Simulated return to the room'),
      };

    case 'show-public':
      return { ...state, publicView: action.view };

    case 'update-lesson':
      return { ...state, lesson: { ...state.lesson, ...action.patch } };

    case 'set-participants':
      // Only the counts. The stage, drafts, widgets, shown content and any
      // running activity are exactly as they were — teaching does not wait for
      // the room to fill, and a late arrival does not restart it.
      return { ...state, participants: { ...state.participants, ...action.participants } };
  }
}

/** The item currently open on the private stage, if any. */
export const selectedItem = (state: CockpitState) =>
  state.items.find(item => item.id === state.selectedItemId) ?? null;

/** What the class can see, described in one short line for the teacher. */
export function publicSummary(state: CockpitState): string {
  const view = state.publicView;
  switch (view.kind) {
    case 'blank':
      return 'Nothing — the display is blank';
    case 'material':
      return state.items.find(item => item.id === view.itemId)?.title ?? 'A saved item';
    case 'module':
      return 'The activity';
    case 'scores':
      return 'The scoreboard';
    case 'join':
      return 'The join code';
  }
}

/** Whether showing this exact item is what the class is already seeing. */
export const isShown = (state: CockpitState, id: string): boolean =>
  state.publicView.kind === 'material' && state.publicView.itemId === id;

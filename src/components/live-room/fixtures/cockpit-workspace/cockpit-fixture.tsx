'use client';

/**
 * The browsable cockpit, one story at a time.
 *
 * This owns the local reducer and supplies synthetic content. Two things are
 * deliberately *real* rather than drawn: the catalogue (from the shipped
 * registries) and the Random Picker (the shipped component, which needs only a
 * student list). Everything that would require a session is a labelled
 * stand-in, and the label says exactly what is missing.
 *
 * Nothing in the application imports this directory.
 */

import { useEffect, useReducer, useRef, useState } from 'react';
import type { Student } from '@/lib/supabase/types';
import { RandomPickerContent } from '@/components/session/random-picker-tool';
import { Button } from '@/components/ui/button';
import { CockpitWorkspace } from '../../ui/cockpit-workspace';
import { cockpitReducer } from '../../ui/cockpit-workspace/cockpit-state';
import type {
  CockpitCallbacks,
  PublicView,
  ScoreMode,
  WidgetId,
} from '../../ui/cockpit-workspace/types';
import {
  COCKPIT_STORIES,
  COCKPIT_WIDGETS,
  SYNTHETIC_STUDENTS,
  SYNTHETIC_TEAMS,
  cockpitCatalogue,
  cockpitCategories,
  storyFor,
} from './data';

const CATALOGUE = cockpitCatalogue();
const CATEGORIES = cockpitCategories(CATALOGUE);

/** The shape RandomPickerContent needs. Synthetic, and only ever local. */
const PICKER_STUDENTS = SYNTHETIC_STUDENTS.map(student => ({
  id: student.id,
  name: student.name,
})) as unknown as Student[];

/**
 * A stand-in for the timer.
 *
 * The shipped `TimerContent` builds a Supabase client at module scope and
 * writes the countdown to the session so the class display can follow it, so
 * it cannot be mounted here at all. This shows the shape it occupies and says
 * why it is not the real one — a fake running clock would imply the class
 * could see it.
 */
function TimerStandIn() {
  const [seconds, setSeconds] = useState(300);
  return (
    <div className="space-y-2">
      <p className="text-center font-[family-name:var(--font-instrument)] text-3xl tabular-nums text-lc-text">
        {String(Math.floor(seconds / 60)).padStart(2, '0')}:
        {String(seconds % 60).padStart(2, '0')}
      </p>
      <div className="flex justify-center gap-1">
        {[60, 180, 300].map(value => (
          <Button key={value} variant="secondary" size="sm" onClick={() => setSeconds(value)}>
            {value / 60}m
          </Button>
        ))}
      </div>
      <p className="text-xs text-lc-text3">
        Layout only. The real timer publishes to the session so the class display can follow it;
        this one counts nothing and nobody else can see it.
      </p>
    </div>
  );
}

/** What the floating fixture panel is allowed to do to the running story. */
interface FixtureControls {
  /** Simulate students arriving mid-lesson. Only the counts change. */
  join: (count: number) => void;
  reset: () => void;
}

function StoryRunner({
  storyKey,
  sourcesSlot,
  controls,
}: {
  storyKey: string;
  sourcesSlot?: React.ReactNode;
  controls: React.MutableRefObject<FixtureControls | null>;
}) {
  const story = storyFor(storyKey);
  const [state, dispatch] = useReducer(cockpitReducer, story.state);
  const [presenting, setPresenting] = useState(Boolean(story.presenting));

  // Registered after render rather than during it.
  useEffect(() => {
    controls.current = {
      join: count =>
        dispatch({
          type: 'set-participants',
          participants: {
            connected: Math.min(state.participants.roster, state.participants.connected + count),
            present: Math.min(state.participants.roster, state.participants.present + count),
          },
        }),
      reset: () =>
        dispatch({ type: 'set-participants', participants: { connected: 0, present: 0 } }),
    };
  }, [controls, state.participants]);

  const callbacks: CockpitCallbacks = {
    openDrawer: drawer => dispatch({ type: 'open-drawer', drawer }),
    openOverlay: overlay => dispatch({ type: 'open-overlay', overlay }),
    selectItem: id => dispatch({ type: 'select-item', id }),
    focusItem: id => dispatch({ type: 'focus-item', id }),
    showItem: id => dispatch({ type: 'show-item', id }),
    stopShowing: () => dispatch({ type: 'stop-showing' }),
    changeDraft: (id, value) => dispatch({ type: 'change-draft', id, value }),
    openWidget: (id: WidgetId) => dispatch({ type: 'open-widget', id }),
    closeWidget: (id: WidgetId) => dispatch({ type: 'close-widget', id }),
    toggleMinimize: (id: WidgetId) => dispatch({ type: 'toggle-minimize', id }),
    setScoreMode: (mode: ScoreMode) => dispatch({ type: 'set-score-mode', mode }),
    togglePinnedScores: () => dispatch({ type: 'toggle-pinned-scores' }),
    searchCatalogue: query => dispatch({ type: 'search-catalogue', query }),
    filterCatalogue: category => dispatch({ type: 'filter-catalogue', category }),
    toggleFavourite: key => dispatch({ type: 'toggle-favourite', key }),
    configureEntry: key => dispatch({ type: 'configure-entry', key }),
    launchEntry: key => dispatch({ type: 'launch-entry', key }),
    returnToRoom: () => dispatch({ type: 'return-to-room' }),
    showPublic: (view: PublicView) => dispatch({ type: 'show-public', view }),
    updateLesson: patch => dispatch({ type: 'update-lesson', patch }),
    present: () => setPresenting(true),
  };

  return (
    <>
      <CockpitWorkspace
        state={state}
        callbacks={callbacks}
        catalogue={CATALOGUE}
        categories={CATEGORIES}
        widgets={COCKPIT_WIDGETS}
        scores={SYNTHETIC_STUDENTS}
        teams={SYNTHETIC_TEAMS}
        classCode="FIXTURE-0000"
        sourcesSlot={sourcesSlot}
        presenting={presenting}
        onExitPresenting={() => setPresenting(false)}
        widgetBodies={{
          timer: <TimerStandIn />,
          // The shipped component, running for real on synthetic students.
          'random-picker': <RandomPickerContent students={PICKER_STUDENTS} />,
        }}
      />
    </>
  );
}

export function CockpitFixture({
  storyKey,
  sourcesSlot,
}: {
  storyKey?: string;
  sourcesSlot?: React.ReactNode;
}) {
  const [key, setKey] = useState(storyKey ?? COCKPIT_STORIES[0].key);
  const story = storyFor(key);
  const controls = useRef<FixtureControls | null>(null);

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <StoryRunner
        key={key}
        storyKey={key}
        sourcesSlot={sourcesSlot}
        controls={controls}
      />

      {/*
        The story picker floats over the frame — the frame itself must stay
        exactly one viewport, which is the thing under review — and it sits in
        the bottom-left corner, collapsed, so it never covers the top bar's
        public indicator in a screenshot.
      */}
      <div className="pointer-events-none fixed bottom-1 left-1 z-50">
        <details className="pointer-events-auto rounded-xl border border-lc-border bg-lc-surface/95 px-2 py-1 text-xs shadow-lg backdrop-blur">
          <summary className="cursor-pointer select-none text-lc-text3">
            Fixture · {story.label}
          </summary>
          <div className="mt-2 max-w-lg space-y-1">
            <p className="text-[11px] text-lc-text3">{story.blurb}</p>
            <div className="flex flex-wrap gap-1">
              {COCKPIT_STORIES.map(entry => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setKey(entry.key)}
                  aria-pressed={entry.key === key}
                  className={`rounded-lg border px-2 py-1 text-[11px] ${
                    entry.key === key
                      ? 'border-lc-blue bg-lc-blue/10 text-lc-text'
                      : 'border-lc-border bg-lc-card text-lc-text2'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            {/*
              Simulated arrivals. Only the participant counts change — the
              point is to show that nothing the teacher is doing resets. This
              verifies no joining, attendance, round eligibility or sync.
            */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => controls.current?.join(3)}
                className="rounded-lg border border-lc-border bg-lc-card px-2 py-1 text-[11px] text-lc-text2"
              >
                Simulate 3 students joining
              </button>
              <button
                type="button"
                onClick={() => controls.current?.reset()}
                className="rounded-lg border border-lc-border bg-lc-card px-2 py-1 text-[11px] text-lc-text2"
              >
                Back to nobody connected
              </button>
            </div>
            <p className="text-[11px] text-lc-warn">
              Synthetic throughout. No session, no students, no provider, no scoring.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

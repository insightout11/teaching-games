'use client';

/**
 * The cockpit's structural pieces: frame, top bar, dock, and the two strips
 * that carry status.
 *
 * The composition idea is the one the product already uses everywhere else —
 * an instrument panel. The teaching stage is the windscreen: the largest,
 * quietest surface, and the only one that ever grows. Everything else is
 * bezel — dense, dark, bounded strips that frame it and never push it down the
 * page. That is what fixes the scrolling complaint: the frame is exactly one
 * viewport, and only the strips inside it scroll.
 *
 * Nothing here invents a palette or a typeface. It uses the existing `lc-*`
 * tokens and the existing `--font-instrument` mono for readouts, because those
 * already say "cockpit" and a second visual identity would be a regression.
 */

import type { ReactNode } from 'react';
import {
  ChevronDown,
  Link2,
  Monitor,
  Radio,
  Settings2,
  Trophy,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CockpitState, DrawerKind, OverlayKind } from './types';
import { publicSummary } from './cockpit-state';

/** Mono, from the app's own instrument face. Used only for readouts. */
const READOUT = 'font-[family-name:var(--font-instrument)] tabular-nums tracking-tight';

/**
 * One viewport, three rows, and no document scroll.
 *
 * `h-[100dvh]` and `overflow-hidden` are the whole contract. Every child that
 * can grow carries `min-h-0` so it scrolls inside itself instead of stretching
 * the page — which is precisely what the previous layout did.
 */
export function CockpitFrame({
  topBar,
  tray,
  stage,
  drawer,
  dock,
  overlay,
  floating,
  drawerOpen,
}: {
  topBar: ReactNode;
  tray: ReactNode;
  stage: ReactNode;
  drawer: ReactNode;
  dock: ReactNode;
  overlay: ReactNode;
  floating: ReactNode;
  /** Whether the stage has to share its row with a drawer column. */
  drawerOpen: boolean;
}) {
  return (
    <div
      data-testid="cockpit-frame"
      /*
       * `minmax(0,1fr)` on the COLUMN as well as the rows. A grid item defaults
       * to `min-width: auto`, so one wide child — the dock's row of tools —
       * silently widened the whole frame past the viewport and pushed the top
       * bar's controls out of reach at phone width. The frame must be exactly
       * the viewport in both directions.
       */
      className="relative grid h-[100dvh] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-lc-bg text-lc-text"
    >
      {topBar}

      <div className="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]">
        {/* The checklist strip. Bounded, and scrolls on its own. */}
        <aside className="hidden min-h-0 flex-col border-r border-lc-border bg-lc-surface lg:flex">
          {tray}
        </aside>

        {/*
          One column normally; two when a drawer is open, so on a wide screen
          the drawer takes space BESIDE the stage rather than covering it. On a
          narrow screen it stays absolutely positioned and becomes a sheet.
        */}
        <main
          className={cn(
            'relative grid min-h-0 overflow-hidden',
            'min-w-0',
            drawerOpen
              ? 'grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_26rem]'
              : 'grid-cols-[minmax(0,1fr)]',
          )}
        >
          {stage}
          {drawer}
        </main>
      </div>

      {dock}
      {overlay}
      {floating}
    </div>
  );
}

/**
 * The glareshield: identity on the left, instruments in the middle, the
 * session's own controls on the right.
 */
export function CockpitTopBar({
  state,
  onDrawer,
  onOverlay,
  onStopShowing,
  onPresent,
}: {
  state: CockpitState;
  onDrawer: (drawer: DrawerKind) => void;
  onOverlay: (overlay: OverlayKind) => void;
  onStopShowing: () => void;
  /** Enter clean presentation. Choosing WHAT is shown stays a separate act. */
  onPresent: () => void;
}) {
  const showing = state.publicView.kind !== 'blank';

  return (
    <header className="flex min-w-0 items-center gap-1.5 border-b border-lc-border bg-lc-surface px-2 py-2 sm:gap-2 sm:px-3">
      <div className="flex min-w-0 shrink items-baseline gap-2 overflow-hidden">
        {/* The wordmark is the first thing to go: the class name is what the
            teacher needs to identify the room they are standing in. */}
        <span className="hidden font-[family-name:var(--font-display)] text-base leading-none text-lc-text sm:inline">
          LessonCaptain
        </span>
        {/* `min-w-0` as well as `truncate`: a flex item will not shrink below
            its content without it, which is what pushed the controls off the
            right edge at phone width. */}
        <span className="min-w-0 truncate text-sm text-lc-text2">{state.identity.className}</span>
        {/* The same title the settings menu edits — one value, two places. */}
        <span
          data-testid="lesson-title"
          className={cn(READOUT, 'hidden truncate text-xs text-lc-text3 lg:inline')}
        >
          {state.lesson.title}
        </span>
      </div>

      {/*
        The loudest thing in the room, on purpose. Private preparation and
        public output are the product's central claim, so the state of the
        class display is never more than one glance away — and when something
        IS on screen it is amber, which nothing else in this frame is.

        Below md it steps aside for the controls and the dock's own caption
        carries the same sentence, because a clipped indicator would be worse
        than a relocated one.
      */}
      <div
        data-testid="public-indicator"
        className={cn(
          'mx-auto hidden min-w-0 items-center gap-2 rounded-full border px-3 py-1 md:flex',
          showing
            ? 'border-lc-amber/50 bg-lc-amber-muted text-lc-text'
            : 'border-lc-border bg-lc-card text-lc-text3',
        )}
      >
        <Radio
          aria-hidden="true"
          className={cn('h-3.5 w-3.5 shrink-0', showing ? 'text-lc-amber' : 'text-lc-text3')}
        />
        <span className="truncate text-xs">
          <span className="text-lc-text3">Class is seeing: </span>
          <span className={showing ? 'text-lc-text' : ''}>{publicSummary(state)}</span>
        </span>
        {showing ? (
          <button
            type="button"
            onClick={onStopShowing}
            className="shrink-0 rounded px-1 text-xs text-lc-amber underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow"
          >
            Stop
          </button>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
        <SaveReadout state={state} />

        <Button variant="ghost" size="sm" onClick={() => onOverlay('join')} aria-label="Join">
          <Link2 aria-hidden="true" className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Join</span>
        </Button>

        <button
          type="button"
          onClick={() => onDrawer('roster')}
          aria-label={`Participants: ${state.participants.connected} connected of ${state.participants.roster}`}
          className="flex min-h-9 items-center gap-1.5 rounded-xl border border-lc-border bg-lc-card px-2 text-xs text-lc-text2 hover:bg-lc-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow"
        >
          <Users aria-hidden="true" className="h-4 w-4" />
          {/* Three different measures, never collapsed into one number. */}
          <span className={READOUT}>
            {state.participants.connected}
            <span className="text-lc-text3">/{state.participants.roster}</span>
          </span>
        </button>

        {/*
          Present enters the clean class view of whatever the class is already
          set to see. It does not pick anything: selecting, showing and
          presenting stay three separate decisions.
        */}
        <Button variant="ghost" size="sm" onClick={onPresent} aria-label="Present">
          <Monitor aria-hidden="true" className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Present</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={() => onOverlay('scores')} aria-label="Scores">
          <Trophy aria-hidden="true" className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Scores</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={() => onOverlay('menu')}>
          <Settings2 aria-hidden="true" className="h-4 w-4" />
          <ChevronDown aria-hidden="true" className="hidden h-3 w-3 sm:inline" />
          <span className="sr-only">Session menu</span>
        </Button>
      </div>
    </header>
  );
}

/** Compact by default. A real failure is not compact. */
function SaveReadout({ state }: { state: CockpitState }) {
  if (state.save.status === 'error') {
    return (
      <p role="alert" className="max-w-[18rem] truncate text-xs text-lc-danger">
        {state.save.error ?? 'That did not save.'}
      </p>
    );
  }
  return (
    <span className={cn(READOUT, 'px-1 text-xs text-lc-text3')} aria-live="polite">
      {state.save.status === 'saving' ? 'Saving…' : state.save.status === 'saved' ? 'Saved' : ''}
    </span>
  );
}

/**
 * The throttle quadrant: always there, never in the way.
 *
 * Bounded height, horizontal scroll on its own if it must, and the one place
 * activities, games and widgets are launched from.
 */
export function CockpitDock({
  children,
  publicState,
}: {
  children: ReactNode;
  publicState: string;
}) {
  return (
    <footer className="min-w-0 border-t border-lc-border bg-lc-surface">
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">{children}</div>
      {/* The same sentence as the top bar's indicator, and the only copy of it
          at narrow widths where the bar has no room. */}
      <p className="border-t border-lc-border-subtle px-3 py-1 text-[11px] text-lc-text3">
        {publicState}
      </p>
    </footer>
  );
}

/** A dock control. Deliberately small, labelled, and honest about availability. */
export function DockButton({
  label,
  iconPath,
  active,
  unavailable,
  note,
  onClick,
}: {
  label: string;
  iconPath: string;
  active?: boolean;
  unavailable?: boolean;
  note?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={note}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow',
        active
          ? 'border-lc-blue bg-lc-blue/10 text-lc-text'
          : 'border-lc-border bg-lc-card text-lc-text2 hover:bg-lc-surface',
        // Never hidden, never silently dead: dimmed and explained.
        unavailable && 'opacity-60',
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path d={iconPath} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="whitespace-nowrap">{label}</span>
      {unavailable ? (
        <Badge tone="neutral" variant="outline" size="xs">
          Not wired
        </Badge>
      ) : null}
    </button>
  );
}

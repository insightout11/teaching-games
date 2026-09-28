'use client';

/**
 * The task drawer and the three overlays.
 *
 * All four are bounded and all four scroll inside themselves. Only one can be
 * open at a time — the reducer enforces that, not these components — so the
 * teaching stage is never buried.
 */

import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { useMediaQuery } from '../use-media-query';
import { useFocusContainment } from './use-focus-containment';
import { SCORE_MODE_LABEL, type ScoreView } from './score-view';
import { Search, Star, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type {
  CatalogueEntry,
  CatalogueReadiness,
  LessonSettings,
  OpenWidget,
  ScoreMode,
  WidgetId,
  WidgetSlot,
} from './types';

/** Below this the drawer covers the stage, so it behaves as a modal. */
const WIDE_QUERY = '(min-width: 1024px)';

/**
 * The one task drawer.
 *
 * A column beside the stage on a wide screen; a sheet over it on a narrow one.
 * Either way it owns its own scrolling and it closes on Escape.
 */
export function TaskDrawer({
  title,
  onClose,
  children,
  open = true,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /**
   * False keeps the drawer mounted but hidden and inert, so whatever is being
   * prepared inside it survives closing and switching drawers without being
   * focusable or visible. Clean presentation does not render it at all.
   */
  open?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Beside the stage on a wide screen it is a side panel and must not hold the
  // keyboard. Below that it covers the stage, and then it is a modal.
  const wide = useMediaQuery(WIDE_QUERY);
  const onKeyDown = useFocusContainment(ref, !wide, open);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      hidden={!open}
      // `inert` is not in React 18's attribute types; it is a real DOM attribute.
      {...(open ? {} : ({ inert: '' } as Record<string, string>))}
      role={wide ? 'region' : 'dialog'}
      aria-modal={wide ? undefined : true}
      aria-label={title}
      onKeyDown={onKeyDown}
      data-testid="task-drawer"
      className={cn(
        /*
         * `flex` only while open. A display class beats the browser's own
         * `[hidden] { display: none }`, so a retained drawer carrying `flex`
         * stayed on screen over the stage despite its `hidden` attribute — a
         * defect invisible to jsdom, which applies no CSS at all.
         */
        open ? 'flex' : 'hidden',
        'absolute inset-y-0 right-0 z-20 w-full min-h-0 flex-col border-l border-lc-border bg-lc-surface shadow-2xl outline-none',
        // At lg it stops floating and occupies its own grid column instead.
        'sm:w-[26rem] lg:static lg:z-auto lg:w-auto lg:shadow-none',
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-lc-border-subtle px-3 py-2">
        <h2 className="text-sm font-semibold text-lc-text">{title}</h2>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label={`Close ${title}`}>
          <X aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </div>
  );
}

/** An overlay that takes the screen. Scores, Join and the session menu. */
export function CockpitOverlay({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Always modal: an overlay covers everything. Tab stays inside, and closing
  // returns focus to whatever opened it rather than dropping it on the page.
  const onKeyDown = useFocusContainment(ref, true);

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-lc-bg/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={onKeyDown}
        data-testid="cockpit-overlay"
        className="flex max-h-[85dvh] w-full max-w-2xl min-h-0 flex-col overflow-hidden rounded-t-2xl border border-lc-border bg-lc-surface outline-none sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-lc-border-subtle px-4 py-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-lc-text">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={`Close ${title}`}>
            <X aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-lc-border-subtle px-4 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

// --- catalogue --------------------------------------------------------------

const READINESS: Record<CatalogueReadiness, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  ready: { label: 'Ready', tone: 'success' },
  configure: { label: 'Needs setting up', tone: 'warning' },
  'not-integrated': { label: 'Not in the room yet', tone: 'neutral' },
};

/**
 * The catalogue.
 *
 * Real registry names and metadata, filtered by the registries' own visibility
 * rules. The three readiness states are shown as three different things,
 * because an apparently working Launch on something that cannot run is the
 * worst possible outcome here.
 */
export function CatalogueDrawer({
  entries,
  categories,
  query,
  category,
  favourites,
  recent,
  onQuery,
  onCategory,
  onFavourite,
  onConfigure,
  onLaunch,
}: {
  entries: CatalogueEntry[];
  categories: string[];
  query: string;
  category: string | null;
  favourites: string[];
  recent: string[];
  onQuery: (value: string) => void;
  onCategory: (value: string | null) => void;
  onFavourite: (key: string) => void;
  onConfigure: (key: string) => void;
  onLaunch: (key: string) => void;
}) {
  const shown = entries.filter(entry => {
    const text = `${entry.name} ${entry.description} ${entry.category}`.toLowerCase();
    if (query.trim() && !text.includes(query.trim().toLowerCase())) return false;
    if (category && entry.category !== category) return false;
    return true;
  });

  const pinned = shown.filter(entry => favourites.includes(entry.key));
  const rest = shown.filter(entry => !favourites.includes(entry.key));
  const recentEntries = recent
    .map(key => entries.find(entry => entry.key === key))
    .filter((entry): entry is CatalogueEntry => Boolean(entry));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lc-text3"
        />
        <Input
          variant="search"
          inputSize="compact"
          aria-label="Search activities and games"
          value={query}
          placeholder="Search activities and games…"
          onChange={event => onQuery(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-1">
        <FilterChip active={category === null} onClick={() => onCategory(null)}>
          All
        </FilterChip>
        {categories.map(name => (
          <FilterChip key={name} active={category === name} onClick={() => onCategory(name)}>
            {name}
          </FilterChip>
        ))}
      </div>

      {recentEntries.length > 0 && !query.trim() ? (
        <section aria-label="Recently used">
          <h3 className="mb-1 text-[11px] uppercase tracking-wide text-lc-text3">Recent</h3>
          <div className="flex flex-wrap gap-1">
            {recentEntries.map(entry => (
              <FilterChip key={entry.key} active={false} onClick={() => onConfigure(entry.key)}>
                {entry.name}
              </FilterChip>
            ))}
          </div>
        </section>
      ) : null}

      {pinned.length > 0 ? (
        <CatalogueGroup
          label="Favourites"
          entries={pinned}
          favourites={favourites}
          onFavourite={onFavourite}
          onConfigure={onConfigure}
          onLaunch={onLaunch}
        />
      ) : null}

      <CatalogueGroup
        label={pinned.length > 0 ? 'Everything else' : 'Activities and games'}
        entries={rest}
        favourites={favourites}
        onFavourite={onFavourite}
        onConfigure={onConfigure}
        onLaunch={onLaunch}
      />

      {shown.length === 0 ? (
        <p role="status" className="text-sm text-lc-text2">
          Nothing matches “{query}”. Try a different word, or clear the filter.
        </p>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow',
        active
          ? 'border-lc-blue bg-lc-blue/10 text-lc-text'
          : 'border-lc-border bg-lc-card text-lc-text2 hover:bg-lc-surface',
      )}
    >
      {children}
    </button>
  );
}

function CatalogueGroup({
  label,
  entries,
  favourites,
  onFavourite,
  onConfigure,
  onLaunch,
}: {
  label: string;
  entries: CatalogueEntry[];
  favourites: string[];
  onFavourite: (key: string) => void;
  onConfigure: (key: string) => void;
  onLaunch: (key: string) => void;
}) {
  if (entries.length === 0) return null;
  return (
    <section aria-label={label}>
      <h3 className="mb-1 text-[11px] uppercase tracking-wide text-lc-text3">{label}</h3>
      <ul className="space-y-1.5">
        {entries.map(entry => {
          const readiness = READINESS[entry.readiness];
          return (
            <li
              key={entry.key}
              className="rounded-xl border border-lc-border bg-lc-card p-2.5"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-lc-text">{entry.name}</p>
                  <p className="line-clamp-2 text-[11px] text-lc-text3">{entry.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onFavourite(entry.key)}
                  aria-pressed={favourites.includes(entry.key)}
                  aria-label={`Favourite ${entry.name}`}
                  className="shrink-0 rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow"
                >
                  <Star
                    aria-hidden="true"
                    className={cn(
                      'h-4 w-4',
                      favourites.includes(entry.key)
                        ? 'fill-lc-amber text-lc-amber'
                        : 'text-lc-text3',
                    )}
                  />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge tone={readiness.tone} variant="outline" size="xs">
                  {readiness.label}
                </Badge>
                <Badge tone="neutral" variant="outline" size="xs">
                  {entry.category}
                </Badge>
                {entry.scored ? (
                  <Badge tone="neutral" variant="outline" size="xs">
                    Scored
                  </Badge>
                ) : null}

                <span className="ml-auto flex gap-1">
                  {/*
                    Nothing that cannot run gets a button that looks like it
                    can. It gets the reason instead.
                  */}
                  {entry.readiness === 'not-integrated' ? (
                    <span className="text-[11px] text-lc-text3">
                      {entry.readinessNote ?? 'Not connected to the room yet.'}
                    </span>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onConfigure(entry.key)}>
                        Set up
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={entry.readiness === 'configure'}
                        title={entry.readiness === 'configure' ? entry.readinessNote : undefined}
                        onClick={() => onLaunch(entry.key)}
                      >
                        Start
                      </Button>
                    </>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// --- scores -----------------------------------------------------------------

export function ScoreboardPanel({
  mode,
  pinned,
  rows,
  teams,
  view,
  onMode,
  onPinned,
  onShowPublic,
  showingPublic,
}: {
  mode: ScoreMode;
  pinned: boolean;
  rows: { id: string; name: string; points: number; team?: string }[];
  teams: { name: string; points: number }[];
  /** The same arrangement the strip and the public view use. */
  view: ScoreView;
  onMode: (mode: ScoreMode) => void;
  onPinned: () => void;
  onShowPublic: () => void;
  showingPublic: boolean;
}) {
  void rows;
  void teams;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1">
        {(Object.keys(SCORE_MODE_LABEL) as ScoreMode[]).map(key => (
          <FilterChip key={key} active={mode === key} onClick={() => onMode(key)}>
            {SCORE_MODE_LABEL[key]}
          </FilterChip>
        ))}
      </div>

      {/* 'Off' is a preference. The totals are still here. */}
      {view.note ? (
        <p role="status" className="rounded-xl border border-lc-border bg-lc-card p-3 text-sm text-lc-text2">
          {view.note}
        </p>
      ) : null}

      <ol className="space-y-1" data-testid="overlay-scores">
        {view.rows.map((row, index) => (
          <li
            key={row.id}
            className="flex items-baseline gap-3 rounded-xl border border-lc-border bg-lc-card px-3 py-2"
          >
            {view.rows.length > 1 ? (
              <span className="font-[family-name:var(--font-instrument)] tabular-nums text-lc-text3">
                {index + 1}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate text-sm text-lc-text">{row.name}</span>
            <span
              className={cn(
                'font-[family-name:var(--font-instrument)] tabular-nums',
                view.counting ? 'text-lc-text' : 'text-lc-text3',
              )}
            >
              {row.points}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2 border-t border-lc-border-subtle pt-3">
        <Button variant="ghost" size="sm" aria-pressed={pinned} onClick={onPinned}>
          {pinned ? 'Unpin from the side' : 'Pin beside the stage'}
        </Button>
        {/* Putting the scoreboard on the display is its own deliberate act. */}
        <Button variant="secondary" size="sm" onClick={onShowPublic}>
          {showingPublic ? 'Stop showing the class' : 'Show the class'}
        </Button>
        <p className="w-full text-xs text-lc-text3">
          Synthetic students. These totals are not read from or written to any scoring system.
        </p>
      </div>
    </div>
  );
}

// --- join -------------------------------------------------------------------

/**
 * Join.
 *
 * Two different connections that are constantly confused, so they are kept
 * visually and verbally apart: students join without signing in; a second
 * teacher device must sign in. No working URL is encoded here, and the panel
 * says so rather than showing a QR that would fail in the room.
 */
export function JoinPanel({ classCode }: { classCode: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-lc-border bg-lc-card p-4">
        <p className="text-[11px] uppercase tracking-wide text-lc-text3">For students</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <div
            aria-hidden="true"
            className="grid h-28 w-28 shrink-0 place-items-center rounded-xl border border-dashed border-lc-border text-[10px] text-lc-text3"
          >
            QR goes here
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-instrument)] text-2xl tracking-[0.2em] text-lc-text">
              {classCode}
            </p>
            <p className="mt-1 text-sm text-lc-text2">
              Students scan or type the code. They do not need an account.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-lc-border bg-lc-card p-4">
        <p className="text-[11px] uppercase tracking-wide text-lc-text3">For your other device</p>
        <p className="mt-1 text-sm text-lc-text2">
          Open your phone or tablet cockpit to control this same lesson. That one asks you to sign
          in — it is your account, not a student seat.
        </p>
        <Button variant="secondary" size="sm" className="mt-2" disabled>
          Open on another device
        </Button>
      </div>

      <p role="status" className="rounded-xl border border-lc-warn/40 bg-lc-warn/10 p-3 text-sm text-lc-text2">
        This is a layout example. There is no session behind it, the code is not real and no phone
        can join it. Real joining is wired once the session contract is ready.
      </p>
    </div>
  );
}

// --- session menu -----------------------------------------------------------

export function SessionMenuPanel({
  lesson,
  attendance,
  onLesson,
  onOpenRoster,
}: {
  lesson: LessonSettings;
  attendance: { roster: number; present: number; connected: number };
  /** Every keystroke is an intent. Nothing typed here is held only in the DOM. */
  onLesson: (patch: Partial<LessonSettings>) => void;
  onOpenRoster: () => void;
}) {
  return (
    <div className="space-y-4">
      <Field
        label="Lesson title"
        id="menu-title"
        value={lesson.title}
        onChange={value => onLesson({ title: value })}
      />
      <Field
        label="Objectives"
        id="menu-objectives"
        value={lesson.objectives}
        onChange={value => onLesson({ objectives: value })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Level"
          id="menu-level"
          value={lesson.level}
          onChange={value => onLesson({ level: value })}
        />
        <Field
          label="Tone"
          id="menu-tone"
          value={lesson.tone}
          onChange={value => onLesson({ tone: value })}
        />
      </div>
      <p className="text-xs text-lc-text3">
        Kept for this layout example only — nothing here is saved anywhere.
      </p>

      <section aria-label="Attendance" className="rounded-2xl border border-lc-border bg-lc-card p-3">
        <h3 className="text-[11px] uppercase tracking-wide text-lc-text3">Attendance</h3>
        {/* Three measures, three numbers. Never one blended figure. */}
        <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
          {[
            ['On the roster', attendance.roster],
            ['Marked present', attendance.present],
            ['Connected now', attendance.connected],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="text-[11px] text-lc-text3">{label}</dt>
              <dd className="font-[family-name:var(--font-instrument)] text-xl tabular-nums text-lc-text">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <Button variant="ghost" size="sm" className="mt-2" onClick={onOpenRoster}>
          Open the full register
        </Button>
      </section>

      <div className="border-t border-lc-border-subtle pt-3">
        <Button variant="secondary" size="sm" disabled>
          End the session
        </Button>
        <p className="mt-1 text-xs text-lc-text3">
          Disabled here: this layout example has no session to end.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-lc-text3">
        {label}
      </label>
      {/* Controlled. An uncontrolled field is what silently discarded edits. */}
      <Input
        id={id}
        inputSize="compact"
        className="mt-1"
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </div>
  );
}

// --- widgets ----------------------------------------------------------------

/** The reason an unwired tool is not doing anything, always before its shape. */
function WidgetReason({ slot }: { slot: WidgetSlot }) {
  if (slot.availability === 'local') return null;
  return (
    <p role="status" className="rounded-lg border border-lc-warn/40 bg-lc-warn/10 p-2 text-xs text-lc-text2">
      {slot.note ??
        'This one needs a live session before it can do anything. Its layout is here; its behaviour is not.'}
    </p>
  );
}

/**
 * A widget window, for wide screens.
 *
 * Laid out right-to-left so two or three open tools sit side by side; beyond
 * that they cascade. Only used where there is room for it — see `WidgetDeck`.
 * Rendered inside the frame rather than portaled to the body, which is what
 * keeps it out of clean presentation entirely.
 */
export function WidgetWindow({
  slot,
  index,
  minimized,
  onMinimize,
  onClose,
  children,
}: {
  slot: WidgetSlot;
  index: number;
  minimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      data-testid={`widget-${slot.id}`}
      style={{
        right: `${1 + Math.min(index, 2) * 20 + Math.max(0, index - 2) * 1.25}rem`,
        bottom: `${5 + Math.max(0, index - 2) * 0.75}rem`,
      }}
      className="absolute z-20 flex max-h-[60dvh] w-[19rem] max-w-[calc(100vw-2rem)] min-h-0 flex-col overflow-hidden rounded-2xl border border-lc-border bg-lc-surface shadow-2xl"
    >
      <WidgetHeader slot={slot} minimized={minimized} onMinimize={onMinimize} onClose={onClose} />
      {minimized ? null : (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          <WidgetReason slot={slot} />
          {children}
        </div>
      )}
    </div>
  );
}

function WidgetHeader({
  slot,
  minimized,
  onMinimize,
  onClose,
}: {
  slot: WidgetSlot;
  minimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-lc-border-subtle px-3 py-1.5">
      <span className="flex-1 truncate text-xs font-medium text-lc-text2">{slot.label}</span>
      <button
        type="button"
        onClick={onMinimize}
        aria-label={`${minimized ? 'Expand' : 'Minimize'} ${slot.label}`}
        className="min-h-8 min-w-8 rounded px-1.5 text-xs text-lc-text3 hover:text-lc-text2 focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow"
      >
        {minimized ? '▢' : '—'}
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close ${slot.label}`}
        className="grid min-h-8 min-w-8 place-items-center rounded px-1 text-lc-text3 hover:text-lc-text2 focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow"
      >
        <X aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Every open widget, reachable at every width.
 *
 * On a wide screen: side-by-side windows. Below that there is no room for
 * windows beside each other, and fixed offsets are exactly what pushed the
 * second one off the left edge of a phone — so it becomes ONE bounded panel,
 * full width above the dock, with a tab per open tool. Every tool's content,
 * minimize and close stay on screen; switching tabs keeps each tool mounted, so
 * a picker does not lose its state because the timer was looked at.
 */
export function WidgetDeck({
  open,
  slots,
  bodies,
  onMinimize,
  onClose,
}: {
  open: OpenWidget[];
  slots: WidgetSlot[];
  bodies?: Partial<Record<string, ReactNode>>;
  onMinimize: (id: WidgetId) => void;
  onClose: (id: WidgetId) => void;
}) {
  const wide = useMediaQuery(WIDE_QUERY);
  const [chosen, setChosen] = useState<WidgetId | null>(null);

  const entries = open
    .map(widget => ({ widget, slot: slots.find(slot => slot.id === widget.id) }))
    .filter((entry): entry is { widget: OpenWidget; slot: WidgetSlot } => Boolean(entry.slot));
  if (entries.length === 0) return null;

  if (wide) {
    return (
      <>
        {entries.map(({ widget, slot }, index) => (
          <WidgetWindow
            key={widget.id}
            slot={slot}
            index={index}
            minimized={widget.minimized}
            onMinimize={() => onMinimize(widget.id)}
            onClose={() => onClose(widget.id)}
          >
            {bodies?.[widget.id] ?? null}
          </WidgetWindow>
        ))}
      </>
    );
  }

  // The tab the teacher picked, or else the most recently opened tool.
  const active =
    entries.find(entry => entry.widget.id === chosen) ?? entries[entries.length - 1];

  return (
    <div
      data-testid="widget-deck"
      className="absolute inset-x-2 bottom-[5.5rem] z-20 flex max-h-[55dvh] min-h-0 flex-col overflow-hidden rounded-2xl border border-lc-border bg-lc-surface shadow-2xl"
    >
      {entries.length > 1 ? (
        <div role="tablist" aria-label="Open tools" className="flex shrink-0 gap-1 overflow-x-auto border-b border-lc-border-subtle px-2 py-1.5">
          {entries.map(({ widget, slot }) => (
            <button
              key={widget.id}
              type="button"
              role="tab"
              aria-selected={widget.id === active.widget.id}
              onClick={() => setChosen(widget.id)}
              className={cn(
                'min-h-9 shrink-0 rounded-lg border px-2.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow',
                widget.id === active.widget.id
                  ? 'border-lc-blue bg-lc-blue/10 text-lc-text'
                  : 'border-lc-border bg-lc-card text-lc-text2',
              )}
            >
              {slot.label}
            </button>
          ))}
        </div>
      ) : null}

      <WidgetHeader
        slot={active.slot}
        minimized={active.widget.minimized}
        onMinimize={() => onMinimize(active.widget.id)}
        onClose={() => onClose(active.widget.id)}
      />

      {/*
        Every open tool stays mounted; only the active one is visible, and the
        hidden ones are inert so the keyboard cannot wander into them.
      */}
      {entries.map(({ widget, slot }) => {
        const visible = widget.id === active.widget.id && !widget.minimized;
        return (
          <div
            key={widget.id}
            data-testid={`widget-${slot.id}`}
            hidden={!visible}
            {...(visible ? {} : ({ inert: '' } as Record<string, string>))}
            // The class as well as the attribute, for the same reason as the
            // retained drawer: a display utility would otherwise win.
            className={cn('min-h-0 flex-1 space-y-2 overflow-y-auto p-3', !visible && 'hidden')}
          >
            <WidgetReason slot={slot} />
            {bodies?.[widget.id] ?? null}
          </div>
        );
      })}
    </div>
  );
}

export type { WidgetId };

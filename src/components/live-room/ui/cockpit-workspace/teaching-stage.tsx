'use client';

/**
 * The teaching stage — the windscreen.
 *
 * The only surface that grows, and the only one a teacher should be looking at
 * while teaching. Everything it shows is *private* until an explicit Show, so
 * the one piece of chrome it always carries is the line saying whether this
 * particular thing is on the class display.
 */

import type { ReactNode } from 'react';
import { ArrowLeft, Eye, Radio, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ScoreView } from './score-view';
import type { CatalogueEntry, TrayItem } from './types';

export function StageFrame({
  eyebrow,
  title,
  actions,
  children,
  scoreStrip,
}: {
  eyebrow: string;
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  scoreStrip?: ReactNode;
}) {
  return (
    <section
      aria-label="Teaching stage"
      data-testid="teaching-stage"
      className="flex min-h-0 flex-col overflow-hidden"
    >
      {/*
        Stacked at phone width, side by side from sm. Competing for one row is
        what squeezed the title to three characters and wrapped the eyebrow
        down the left edge.
      */}
      <div className="flex shrink-0 flex-col gap-2 border-b border-lc-border-subtle px-4 py-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wide text-lc-text3">{eyebrow}</p>
          <h1 className="truncate font-[family-name:var(--font-display)] text-xl text-lc-text">
            {title}
          </h1>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2 overflow-x-auto">{actions}</div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* The stage body scrolls; the page does not. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {scoreStrip}
      </div>
    </section>
  );
}

/** Nothing selected. A starting point, not an instruction manual. */
export function IdleStage({ onOpenSources, onOpenCatalogue }: {
  onOpenSources: () => void;
  onOpenCatalogue: () => void;
}) {
  return (
    <StageFrame eyebrow="Your room" title="Ready when you are">
      <div className="mx-auto max-w-md space-y-3 pt-6 text-center">
        <p className="text-sm text-lc-text2">
          Pick something from the tray to work on it privately, or start somewhere:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="primary" size="sm" onClick={onOpenSources}>
            Find a source
          </Button>
          <Button variant="secondary" size="sm" onClick={onOpenCatalogue}>
            Activities &amp; games
          </Button>
        </div>
        <p className="text-xs text-lc-text3">
          Nothing reaches the class display until you press Show.
        </p>
      </div>
    </StageFrame>
  );
}

/** One selected item, open. This is the only place its detail expands. */
export function MaterialStage({
  item,
  draft,
  shown,
  focused,
  onDraft,
  onShow,
  onStopShowing,
  onFocus,
  scoreStrip,
  body,
}: {
  item: TrayItem;
  draft: string;
  shown: boolean;
  focused: boolean;
  onDraft: (value: string) => void;
  onShow: () => void;
  onStopShowing: () => void;
  onFocus: () => void;
  scoreStrip?: ReactNode;
  /** Real rendering of the item (image, article, video, place). Falls back to its text. */
  body?: ReactNode;
}) {
  return (
    <StageFrame
      eyebrow={shown ? 'Showing the class' : 'Not shown yet'}
      title={item.title}
      scoreStrip={scoreStrip}
      actions={
        <>
          {/* Three separate presses, three separate outcomes. */}
          <Button
            variant={shown ? 'secondary' : 'primary'}
            size="sm"
            onClick={shown ? onStopShowing : onShow}
          >
            <Radio aria-hidden="true" className="mr-1.5 h-4 w-4" />
            {shown ? 'Stop showing' : 'Show the class'}
          </Button>
          <Button variant="ghost" size="sm" aria-pressed={focused} onClick={onFocus}>
            <Target aria-hidden="true" className="mr-1.5 h-4 w-4" />
            {focused ? 'In focus' : 'Use as focus'}
          </Button>
        </>
      }
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {body ?? (item.detail ? (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-lc-text2">
            {item.detail}
          </p>
        ) : null)}

        {item.attribution ? (
          <p className="text-xs text-lc-text3">{item.attribution}</p>
        ) : null}

        <div>
          <label
            htmlFor="stage-note"
            className="block text-xs font-medium text-lc-text3"
          >
            Your note (hidden when presenting)
          </label>
          <Textarea
            id="stage-note"
            inputSize="compact"
            className="mt-1 min-h-[4.5rem]"
            rows={3}
            value={draft}
            placeholder="It stays here if you open a drawer or run an activity. Present hides it."
            onChange={event => onDraft(event.target.value)}
          />
        </div>
      </div>
    </StageFrame>
  );
}

/**
 * An activity or game on the stage.
 *
 * Deliberately a fixture surface. It says so, it generates nothing, and there
 * is no animation pretending otherwise — a false success here would be the
 * single most misleading thing this packet could ship.
 */
export function ModuleStage({
  entry,
  phase,
  connected,
  onLaunch,
  onReturn,
  scoreStrip,
  host,
}: {
  entry: CatalogueEntry;
  phase: 'configure' | 'running';
  /** The real running game/activity. Absent means the layout example below. */
  host?: ReactNode;
  /** Students connected right now. Zero is a normal state, not an error. */
  connected: number;
  onLaunch: () => void;
  onReturn: () => void;
  scoreStrip?: ReactNode;
}) {
  return (
    <StageFrame
      eyebrow={phase === 'configure' ? 'Set it up' : host ? 'Running' : 'Running — fixture only'}
      title={entry.name}
      scoreStrip={scoreStrip}
      actions={
        <>
          {phase === 'configure' ? (
            <Button
              variant="primary"
              size="sm"
              disabled={entry.readiness === 'not-integrated'}
              onClick={onLaunch}
            >
              Start it
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={onReturn}>
            <ArrowLeft aria-hidden="true" className="mr-1.5 h-4 w-4" />
            Back to the room
          </Button>
        </>
      }
    >
      {phase === 'running' && host ? (
        <div className="min-h-0 w-full">{host}</div>
      ) : (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral" variant="outline" size="xs">
            {entry.category}
          </Badge>
          {entry.minutes ? (
            <Badge tone="neutral" variant="outline" size="xs">
              about {entry.minutes} min
            </Badge>
          ) : null}
          {entry.deviceFree ? (
            <Badge tone="neutral" variant="outline" size="xs">
              No student devices needed
            </Badge>
          ) : null}
        </div>

        <p className="text-sm text-lc-text2">{entry.description}</p>

        {/*
          Teaching does not wait for the room to fill. An activity that needs
          student devices says so plainly when nobody has joined yet, instead of
          pretending to have participants or blocking the rest of the lesson.
        */}
        {!entry.deviceFree && connected === 0 ? (
          <p
            role="status"
            data-testid="needs-devices"
            className="rounded-xl border border-lc-border bg-lc-card p-3 text-sm text-lc-text2"
          >
            Nobody has joined on a device yet. This one needs students on their own phones or
            laptops; everything else in the room works in the meantime, and Join stays open.
          </p>
        ) : null}

        {/* Said plainly, once, where it cannot be missed. */}
        <div className="rounded-2xl border border-lc-warn/40 bg-lc-warn/10 p-4">
          <p className="text-sm text-lc-text2">
            {phase === 'configure'
              ? 'This is a layout example. Starting it here arranges the screen — it does not run the real activity, contact anything or generate content.'
              : 'This is a layout example of a running activity. No module is mounted, no student can answer it and no score can change.'}
          </p>
          {entry.readinessNote ? (
            <p className="mt-1 text-xs text-lc-text3">{entry.readinessNote}</p>
          ) : null}
        </div>

        {phase === 'running' ? (
          <div className="rounded-2xl border border-lc-border bg-lc-card p-6">
            <p className="text-[11px] uppercase tracking-wide text-lc-text3">
              Where the activity would appear
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {['Prompt', 'Responses', 'Reveal'].map(slot => (
                <div
                  key={slot}
                  className="rounded-xl border border-dashed border-lc-border p-4 text-center text-xs text-lc-text3"
                >
                  {slot}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      )}
    </StageFrame>
  );
}

/** Clean presentation: what the class sees, and nothing else. */
export function PublicStage({
  title,
  body,
  attribution,
  scores,
  onExit,
  richBody,
}: {
  title: string;
  body?: string;
  /** Real media (image, video, article) in place of plain text. */
  richBody?: ReactNode;
  attribution?: string;
  /** Present only when the teacher deliberately chose to show the scoreboard. */
  scores?: ScoreView;
  onExit: () => void;
}) {
  return (
    <div
      data-testid="public-stage"
      className="flex h-[100dvh] flex-col overflow-hidden bg-lc-bg px-6 py-8 sm:px-10 sm:py-10"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col justify-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight text-lc-text sm:text-4xl">
          {scores ? `Scores · ${scores.label}` : title}
        </h1>
        {richBody ? <div className="mt-6 min-h-0">{richBody}</div> : null}
        {body ? (
          <p className="mt-6 max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-xl leading-relaxed text-lc-text2 sm:text-2xl">
            {body}
          </p>
        ) : null}

        {/*
          The scoreboard the teacher chose to show, in the mode they chose.
          Totals and names only: no mode switch, no pin, no teacher control.
        */}
        {scores ? (
          <div className="mt-6 min-h-0 overflow-y-auto">
            {scores.note ? <p className="mb-3 text-lg text-lc-text3">{scores.note}</p> : null}
            <ol data-testid="public-scores" className="space-y-2">
              {scores.rows.map((row, index) => (
                <li
                  key={row.id}
                  className={cn(
                    'flex items-baseline gap-4 rounded-2xl border px-5 py-3 text-2xl',
                    index === 0 && scores.counting && scores.rows.length > 1
                      ? 'border-lc-amber/50 bg-lc-amber-muted text-lc-text'
                      : 'border-lc-border bg-lc-card text-lc-text2',
                  )}
                >
                  {scores.rows.length > 1 ? (
                    <span className="font-[family-name:var(--font-instrument)] tabular-nums text-lc-text3">
                      {index + 1}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate">{row.name}</span>
                  <span
                    className={cn(
                      'font-[family-name:var(--font-instrument)] tabular-nums',
                      scores.counting ? 'text-lc-text' : 'text-lc-text3',
                    )}
                  >
                    {row.points}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {attribution ? <p className="mt-6 text-base text-lc-text3">{attribution}</p> : null}
      </div>
      {/*
        The only control in this view, and it is not a teacher tool — it is the
        way out. No tray, no dock, no notes, no widget.
      */}
      <button
        type="button"
        onClick={onExit}
        className="self-end rounded-xl border border-lc-border px-3 py-1.5 text-xs text-lc-text3 hover:text-lc-text2 focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow"
      >
        <Eye aria-hidden="true" className="mr-1.5 inline h-4 w-4" />
        Exit presentation
      </button>
    </div>
  );
}

/**
 * The optional pinned score strip. A preference, never a projection.
 *
 * Takes the same `ScoreView` as the overlay and the public view, so Teams shows
 * teams, Whole class shows one shared total, and Off still shows the totals
 * without ranking them as if they were being counted.
 */
export function ScoreStrip({ view, onOpen }: { view: ScoreView; onOpen: () => void }) {
  return (
    <aside
      aria-label="Pinned scores"
      data-testid="score-strip"
      className="hidden w-44 shrink-0 flex-col border-l border-lc-border-subtle bg-lc-surface xl:flex"
    >
      <div className="flex shrink-0 items-baseline justify-between px-3 py-2">
        <h2 className="text-[11px] uppercase tracking-wide text-lc-text3">Scores</h2>
        <button
          type="button"
          onClick={onOpen}
          className="text-[11px] text-lc-blue hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-lc-blue-glow"
        >
          Open
        </button>
      </div>
      <p data-testid="score-strip-mode" className="px-3 pb-1 text-[10px] text-lc-text3">
        {view.label}
      </p>
      <ol className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {view.rows.slice(0, 6).map((row, index) => (
          <li
            key={row.id}
            className={cn(
              'flex items-baseline gap-2 rounded-lg px-2 py-1 text-xs',
              index === 0 && view.counting && view.rows.length > 1
                ? 'bg-lc-amber-muted text-lc-text'
                : 'text-lc-text2',
            )}
          >
            {view.rows.length > 1 ? (
              <span className="font-[family-name:var(--font-instrument)] tabular-nums text-lc-text3">
                {index + 1}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate">{row.name}</span>
            <span
              className={cn(
                'font-[family-name:var(--font-instrument)] tabular-nums',
                view.counting ? '' : 'text-lc-text3',
              )}
            >
              {row.points}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

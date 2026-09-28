'use client';

/**
 * The whole cockpit, assembled.
 *
 * Fully controlled: no state, no effects beyond a keyboard listener, no data
 * fetching. Everything it renders comes from `state` and every interaction is
 * an intent handed back through `callbacks`, so the composition can be
 * reviewed as a *composition* before any runtime exists behind it.
 */

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  CatalogueDrawer,
  CockpitOverlay,
  JoinPanel,
  ScoreboardPanel,
  SessionMenuPanel,
  TaskDrawer,
  WidgetDeck,
} from './cockpit-panels';
import { scoreViewFor } from './score-view';
import { CockpitDock, CockpitFrame, CockpitTopBar, DockButton } from './cockpit-chrome';
import { MaterialStrip, MaterialTray } from './material-tray';
import {
  IdleStage,
  MaterialStage,
  ModuleStage,
  PublicStage,
  ScoreStrip,
  StageFrame,
} from './teaching-stage';
import { isShown, publicSummary, selectedItem } from './cockpit-state';
import type {
  CatalogueEntry,
  CockpitCallbacks,
  CockpitState,
  DrawerKind,
  WidgetSlot,
} from './types';

const DRAWER_TITLE: Record<Exclude<DrawerKind, null>, string> = {
  sources: 'Sources',
  catalogue: 'Activities & games',
  inbox: 'From students',
  vocabulary: 'Vocabulary',
  roster: 'Register',
};

export interface CockpitWorkspaceProps {
  state: CockpitState;
  callbacks: CockpitCallbacks;
  catalogue: CatalogueEntry[];
  categories: string[];
  widgets: WidgetSlot[];
  scores: { id: string; name: string; points: number; team?: string }[];
  teams: { name: string; points: number }[];
  classCode: string;
  /** The real sources drawer, mounted by the composer. */
  sourcesSlot?: ReactNode;
  /** Per-widget bodies. Absent means the window explains itself instead. */
  widgetBodies?: Partial<Record<string, ReactNode>>;
  /** Clean presentation replaces the whole frame. */
  presenting?: boolean;
  onExitPresenting?: () => void;
}

export function CockpitWorkspace({
  state,
  callbacks,
  catalogue,
  categories,
  widgets,
  scores,
  teams,
  classCode,
  sourcesSlot,
  widgetBodies,
  presenting,
  onExitPresenting,
}: CockpitWorkspaceProps) {
  // The only effect in the composition, and it only ever closes something.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') callbacks.openDrawer(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [callbacks]);

  const item = selectedItem(state);
  // One arrangement of the totals for the strip, the overlay and the class.
  const scoreView = scoreViewFor(state.scoreMode, scores, teams);
  const shownItemId = state.publicView.kind === 'material' ? state.publicView.itemId : null;
  const entryFor = (key: string) => catalogue.find(entry => entry.key === key);

  /*
   * Clean presentation is a different page, not this one with things hidden.
   * Returning the public stage here — rather than layering it over the frame —
   * is what guarantees no tray, dock, widget window or private note can be in
   * the DOM at all while the class is looking.
   */
  if (presenting) {
    const view = state.publicView;
    const publicItem =
      view.kind === 'material' ? state.items.find(entry => entry.id === view.itemId) : null;
    return (
      <PublicStage
        title={publicItem?.title ?? publicSummary(state)}
        body={publicItem?.detail}
        attribution={publicItem?.attribution}
        // Only when the teacher deliberately chose to show the scoreboard.
        scores={view.kind === 'scores' ? scoreView : undefined}
        onExit={onExitPresenting ?? (() => undefined)}
      />
    );
  }

  const scoreStrip = state.pinnedScores ? (
    <ScoreStrip view={scoreView} onOpen={() => callbacks.openOverlay('scores')} />
  ) : undefined;

  let stage: ReactNode;
  if (state.stage.kind === 'material' && item) {
    stage = (
      <MaterialStage
        item={item}
        draft={state.drafts[item.id] ?? ''}
        shown={isShown(state, item.id)}
        focused={state.focusedItemId === item.id}
        scoreStrip={scoreStrip}
        onDraft={value => callbacks.changeDraft(item.id, value)}
        onShow={() => callbacks.showItem(item.id)}
        onStopShowing={callbacks.stopShowing}
        onFocus={() => callbacks.focusItem(item.id)}
      />
    );
  } else if (state.stage.kind === 'module') {
    const entry = entryFor(state.stage.entryKey);
    stage = entry ? (
      <ModuleStage
        entry={entry}
        phase={state.stage.phase}
        scoreStrip={scoreStrip}
        connected={state.participants.connected}
        onLaunch={() => callbacks.launchEntry(entry.key)}
        onReturn={callbacks.returnToRoom}
      />
    ) : (
      <StageFrame eyebrow="Your room" title="That is not in the catalogue">
        <Button variant="secondary" size="sm" onClick={callbacks.returnToRoom}>
          Back to the room
        </Button>
      </StageFrame>
    );
  } else {
    stage = (
      <IdleStage
        onOpenSources={() => callbacks.openDrawer('sources')}
        onOpenCatalogue={() => callbacks.openDrawer('catalogue')}
      />
    );
  }

  return (
    <CockpitFrame
      drawerOpen={state.drawer !== null}
      topBar={
        <CockpitTopBar
          state={state}
          onDrawer={callbacks.openDrawer}
          onOverlay={callbacks.openOverlay}
          onStopShowing={callbacks.stopShowing}
          onPresent={callbacks.present}
        />
      }
      tray={
        <MaterialTray
          items={state.items}
          selectedId={state.selectedItemId}
          focusedId={state.focusedItemId}
          shownId={shownItemId}
          drafts={state.drafts}
          onSelect={callbacks.selectItem}
          onOpenDrawer={() => callbacks.openDrawer('sources')}
        />
      }
      stage={
        <div className="flex min-h-0 min-w-0 flex-col">
          <MaterialStrip
            items={state.items}
            selectedId={state.selectedItemId}
            shownId={shownItemId}
            onSelect={callbacks.selectItem}
          />
          {stage}
        </div>
      }
      drawer={
        <>
          {/*
            Sources is retained. Its query, link, reader, passage and
            acknowledgements live inside the slot, so unmounting it on close is
            what threw a prepared passage away. It stays mounted — hidden and
            inert while another drawer or none is open — and only clean
            presentation, which renders a different tree entirely, removes it.
          */}
          {sourcesSlot ? (
            <TaskDrawer
              title={DRAWER_TITLE.sources}
              open={state.drawer === 'sources'}
              onClose={() => callbacks.openDrawer(null)}
            >
              {sourcesSlot}
            </TaskDrawer>
          ) : null}

          {state.drawer && !(state.drawer === 'sources' && sourcesSlot) ? (
            <TaskDrawer
              key={state.drawer}
              title={DRAWER_TITLE[state.drawer]}
              onClose={() => callbacks.openDrawer(null)}
            >
              {state.drawer === 'catalogue' ? (
                <CatalogueDrawer
                  entries={catalogue}
                  categories={categories}
                  query={state.catalogue.query}
                  category={state.catalogue.category}
                  favourites={state.catalogue.favourites}
                  recent={state.catalogue.recent}
                  onQuery={callbacks.searchCatalogue}
                  onCategory={callbacks.filterCatalogue}
                  onFavourite={callbacks.toggleFavourite}
                  onConfigure={callbacks.configureEntry}
                  onLaunch={callbacks.launchEntry}
                />
              ) : (
                <DrawerPlaceholder name={DRAWER_TITLE[state.drawer]} />
              )}
            </TaskDrawer>
          ) : null}
        </>
      }
      dock={
        <CockpitDock publicState={`Class is seeing: ${publicSummary(state)}`}>
          <Button
            variant={state.drawer === 'catalogue' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => callbacks.openDrawer('catalogue')}
          >
            Activities &amp; games
          </Button>
          <span aria-hidden="true" className="h-5 w-px shrink-0 bg-lc-border" />
          {widgets.map(slot => (
            <DockButton
              key={slot.id}
              label={slot.label}
              iconPath={slot.iconPath}
              active={state.widgets.some(widget => widget.id === slot.id)}
              unavailable={slot.availability !== 'local'}
              note={slot.note}
              onClick={() => callbacks.openWidget(slot.id)}
            />
          ))}
        </CockpitDock>
      }
      overlay={
        state.overlay === 'scores' ? (
          <CockpitOverlay title="Scores" onClose={() => callbacks.openOverlay(null)}>
            <ScoreboardPanel
              mode={state.scoreMode}
              pinned={state.pinnedScores}
              rows={scores}
              teams={teams}
              view={scoreView}
              showingPublic={state.publicView.kind === 'scores'}
              onMode={callbacks.setScoreMode}
              onPinned={callbacks.togglePinnedScores}
              onShowPublic={() =>
                callbacks.showPublic(
                  state.publicView.kind === 'scores' ? { kind: 'blank' } : { kind: 'scores' },
                )
              }
            />
          </CockpitOverlay>
        ) : state.overlay === 'join' ? (
          <CockpitOverlay title="Join this lesson" onClose={() => callbacks.openOverlay(null)}>
            <JoinPanel classCode={classCode} />
          </CockpitOverlay>
        ) : state.overlay === 'menu' ? (
          <CockpitOverlay title="Lesson settings" onClose={() => callbacks.openOverlay(null)}>
            <SessionMenuPanel
              lesson={state.lesson}
              attendance={state.participants}
              onLesson={callbacks.updateLesson}
              onOpenRoster={() => callbacks.openDrawer('roster')}
            />
          </CockpitOverlay>
        ) : null
      }
      floating={
        <WidgetDeck
          open={state.widgets}
          slots={widgets}
          bodies={widgetBodies}
          onMinimize={callbacks.toggleMinimize}
          onClose={callbacks.closeWidget}
        />
      }
    />
  );
}

function DrawerPlaceholder({ name }: { name: string }) {
  return (
    <p role="status" className="text-sm text-lc-text2">
      {name} opens here. This packet composes the space it occupies; its contents are wired to the
      released panels separately.
    </p>
  );
}

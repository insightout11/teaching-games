'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, Map, Pause, Play, RotateCcw, Route, Trophy, X } from 'lucide-react';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { distanceKm, formatDistance } from '@/lib/world-flight/geo';
import {
  deriveWorldFlightExpeditionProgress,
  getWorldFlightExpedition,
  WORLD_FLIGHT_EXPEDITIONS,
  type WorldFlightExpeditionLength,
  type WorldFlightExpeditionRouteGuidance,
  type WorldFlightExpeditionRunSummary,
  type WorldFlightExpeditionTheme,
} from '@/lib/world-flight/expeditions';
import type { DestinationPack } from '@/lib/world-flight/types';

type ExpeditionAction = 'activate' | 'pause' | 'resume' | 'leave';

function destination(destinationId: string) {
  return WORLD_DESTINATIONS.find((candidate) => candidate.id === destinationId) ?? null;
}

export function ExpeditionPanel({
  runs,
  routeOrigin,
  rangeKm,
  routeGuidance,
  actionStatus,
  onAction,
  onSelectDestination,
  previewExpeditionId,
  onPreviewExpedition,
}: {
  runs: WorldFlightExpeditionRunSummary[];
  routeOrigin: DestinationPack | null;
  rangeKm: number;
  routeGuidance: WorldFlightExpeditionRouteGuidance | null;
  actionStatus: 'idle' | 'working' | 'error';
  onAction: (action: ExpeditionAction, expeditionId: string, runId?: string) => void;
  onSelectDestination: (destinationId: string, focusId?: string) => void;
  previewExpeditionId: string;
  onPreviewExpedition: (expeditionId: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const currentRun = runs.find((run) => run.status === 'active' || run.status === 'paused') ?? null;
  const completedExpeditionIds = new Set(runs.filter((run) => run.status === 'completed').map((run) => run.expeditionId));
  const preview = getWorldFlightExpedition(previewExpeditionId) ?? WORLD_FLIGHT_EXPEDITIONS[0];
  const previewRun = runs.find((run) => run.expeditionId === preview.id && (run.status === 'active' || run.status === 'paused' || run.status === 'completed')) ?? null;
  const progress = deriveWorldFlightExpeditionProgress(preview, previewRun?.visitedDestinationIds ?? []);
  const currentDefinition = currentRun ? getWorldFlightExpedition(currentRun.expeditionId) : null;
  const currentProgress = currentDefinition
    ? deriveWorldFlightExpeditionProgress(currentDefinition, currentRun?.visitedDestinationIds ?? [])
    : null;
  const routeTarget = routeGuidance ? destination(routeGuidance.targetDestinationId) : null;
  const routeNext = routeGuidance ? destination(routeGuidance.nextDestinationId) : null;
  const routeFocusId = currentDefinition?.stops.find((stop) => stop.destinationId === routeGuidance?.targetDestinationId)?.recommendedFocusId;
  const routePath = routeGuidance?.routeDestinationIds
    .map((destinationId) => destination(destinationId))
    .filter((city): city is DestinationPack => Boolean(city)) ?? [];
  const [themeFilter, setThemeFilter] = useState<'all' | WorldFlightExpeditionTheme>('all');
  const [lengthFilter, setLengthFilter] = useState<'all' | WorldFlightExpeditionLength>('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [panelView, setPanelView] = useState<'catalog' | 'detail'>('catalog');
  const themeOptions = useMemo(
    () => Array.from(new Set(WORLD_FLIGHT_EXPEDITIONS.flatMap((expedition) => expedition.themes))).sort(),
    [],
  );
  const regionOptions = useMemo(
    () => Array.from(new Set(WORLD_FLIGHT_EXPEDITIONS.flatMap((expedition) => expedition.regions))).sort(),
    [],
  );
  const levelOptions = useMemo(
    () => Array.from(new Set(WORLD_FLIGHT_EXPEDITIONS.map((expedition) => expedition.suggestedLevel))).sort(),
    [],
  );
  const filteredExpeditions = WORLD_FLIGHT_EXPEDITIONS.filter((expedition) => (
    (themeFilter === 'all' || expedition.themes.includes(themeFilter))
    && (lengthFilter === 'all' || expedition.length === lengthFilter)
    && (regionFilter === 'all' || expedition.regions.includes(regionFilter))
    && (levelFilter === 'all' || expedition.suggestedLevel === levelFilter)
  ));
  const filtersActive = themeFilter !== 'all' || lengthFilter !== 'all' || regionFilter !== 'all' || levelFilter !== 'all';

  useEffect(() => {
    if (currentRun?.status === 'active') panelRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentRun?.id, currentRun?.status]);

  return (
    <div ref={panelRef} className="min-h-0 flex-1 overflow-y-auto">
      {currentRun && currentDefinition && currentProgress && (
        <section className="border-b border-rose-300/20 bg-rose-300/[0.045] px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-instrument flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-200/80">
                <Compass className="h-4 w-4" aria-hidden />
                {currentRun.status === 'paused' ? 'Paused expedition' : 'Active expedition'}
              </p>
              <h2 className="font-display mt-2 text-xl leading-tight text-lc-text">{currentDefinition.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-lc-text2">{currentDefinition.centralQuestion}</p>
            </div>
            <span className="shrink-0 rounded-full border border-rose-200/25 bg-rose-300/[0.08] px-2 py-1 text-[11px] font-semibold text-rose-100">
              {currentProgress.completedStopCount}/{currentProgress.requiredStopCount}
            </span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-rose-300 transition-[width]"
              style={{ width: `${Math.min(100, (currentProgress.completedStopCount / currentProgress.requiredStopCount) * 100)}%` }}
            />
          </div>
          {routeGuidance && routeNext && routeTarget && (
            <div className="mt-4 rounded-md border border-rose-200/20 bg-[var(--wf-inset)] p-3">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-rose-200/70">
                    Recommended next flight
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-lc-text">{routeNext.city}</span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-lc-text3">
                    {routeGuidance.direct
                      ? `${routeNext.city} is an Expedition stop within range.`
                      : `${routeNext.city} is the next bridge city on the way to ${routeTarget.city}.`}
                  </span>
                </span>
                <span className="shrink-0 rounded-sm border border-rose-200/25 bg-rose-300/[0.07] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-100/80">
                  {routeGuidance.direct ? 'Stop' : `${routePath.length} flights`}
                </span>
              </div>
              {routePath.length > 1 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label={`Route to ${routeTarget.city}`}>
                  {routePath.map((city, index) => (
                    <span key={city.id} className="flex items-center gap-1.5 text-[10px] font-semibold text-lc-text2">
                      {index > 0 && <ArrowRight className="h-2.5 w-2.5 text-rose-200/55" aria-hidden />}
                      <span className={city.id === routeTarget.id ? 'text-rose-100' : ''}>{city.city}</span>
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => onSelectDestination(routeNext.id, routeGuidance.direct ? routeFocusId : undefined)}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-rose-300 px-3 text-xs font-bold text-[var(--wf-bg)] transition-colors hover:bg-rose-200"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                {routeGuidance.direct ? `Open Recommended ${routeNext.city} Lesson` : `Open ${routeNext.city} as Next Flight`}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={actionStatus === 'working'}
              onClick={() => onAction(currentRun.status === 'paused' ? 'resume' : 'pause', currentRun.expeditionId, currentRun.id)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[0.035] px-3 text-xs font-semibold text-lc-text transition-colors hover:border-cyan-200/30 hover:bg-white/[0.06] disabled:opacity-50"
            >
              {currentRun.status === 'paused' ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
              {currentRun.status === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              disabled={actionStatus === 'working'}
              onClick={() => onAction('leave', currentRun.expeditionId, currentRun.id)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[0.035] px-3 text-xs font-semibold text-lc-text2 transition-colors hover:border-rose-200/35 hover:bg-rose-300/[0.06] hover:text-rose-100 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Leave
            </button>
          </div>
          {actionStatus === 'error' && <p className="mt-2 text-xs text-rose-200">The expedition could not be updated. Try again.</p>}
        </section>
      )}

      {panelView === 'catalog' && <section className="border-b border-white/10 px-5 py-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-instrument text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/70">Route library</p>
            <h2 className="font-display mt-1 text-xl text-lc-text">Preview a class expedition.</h2>
          </div>
          <span className="text-[11px] text-lc-text3">{filteredExpeditions.length} of {WORLD_FLIGHT_EXPEDITIONS.length}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-lc-text2">Select a route to see every stop on the map. Detours remain available, and Design Missions stay separate.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ExpeditionFilter label="Theme" value={themeFilter} onChange={(value) => setThemeFilter(value as 'all' | WorldFlightExpeditionTheme)}>
            <option value="all">All themes</option>
            {themeOptions.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
          </ExpeditionFilter>
          <ExpeditionFilter label="Length" value={lengthFilter} onChange={(value) => setLengthFilter(value as 'all' | WorldFlightExpeditionLength)}>
            <option value="all">Any length</option>
            <option value="short">Short</option>
            <option value="standard">Standard</option>
            <option value="long">Long</option>
          </ExpeditionFilter>
          <ExpeditionFilter label="Region" value={regionFilter} onChange={setRegionFilter}>
            <option value="all">All regions</option>
            {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
          </ExpeditionFilter>
          <ExpeditionFilter label="Suggested level" value={levelFilter} onChange={setLevelFilter}>
            <option value="all">Any level</option>
            {levelOptions.map((level) => <option key={level} value={level}>{level}</option>)}
          </ExpeditionFilter>
          <button
            type="button"
            disabled={!filtersActive}
            onClick={() => {
              setThemeFilter('all');
              setLengthFilter('all');
              setRegionFilter('all');
              setLevelFilter('all');
            }}
            className="col-span-2 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.025] px-2 text-[11px] font-semibold text-lc-text2 transition-colors hover:border-cyan-200/25 hover:text-lc-text disabled:cursor-not-allowed disabled:opacity-35"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            Reset
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {filteredExpeditions.map((expedition) => {
            const selected = expedition.id === preview.id;
            const completed = completedExpeditionIds.has(expedition.id);
            const active = currentRun?.expeditionId === expedition.id;
            return (
              <button
                key={expedition.id}
                type="button"
                onClick={() => {
                  onPreviewExpedition(expedition.id);
                  setPanelView('detail');
                }}
                className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                  selected ? 'border-rose-200/45 bg-rose-300/[0.07]' : 'border-white/10 bg-white/[0.025] hover:border-cyan-200/25 hover:bg-white/[0.045]'
                }`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-lc-text">{expedition.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-lc-text3">{expedition.subtitle}</span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-sm border border-white/10 bg-white/[0.035] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text2">
                        {expedition.stops.length} cities
                      </span>
                      <span className="rounded-sm border border-white/10 bg-white/[0.035] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text2">
                        {expedition.estimatedLessons}
                      </span>
                      <span className="rounded-sm border border-white/10 bg-white/[0.035] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lc-text2">
                        {expedition.length}
                      </span>
                      {selected && (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-rose-200/25 bg-rose-300/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-100/80">
                          <Map className="h-2.5 w-2.5" aria-hidden />
                          On map
                        </span>
                      )}
                    </span>
                  </span>
                  {completed ? <Trophy className="h-4 w-4 shrink-0 text-lc-amber" aria-label="Completed" /> : active ? <Compass className="h-4 w-4 shrink-0 text-rose-200" aria-label="Current" /> : null}
                </span>
              </button>
            );
          })}
          {filteredExpeditions.length === 0 && (
            <p className="rounded-md border border-white/10 bg-white/[0.025] px-3 py-4 text-center text-xs leading-relaxed text-lc-text3">
              No routes match these filters.
            </p>
          )}
        </div>
      </section>}

      {panelView === 'detail' && <section className="px-5 py-5">
        <button
          type="button"
          onClick={() => setPanelView('catalog')}
          className="mb-4 inline-flex min-h-9 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.025] px-2.5 text-[11px] font-semibold text-lc-text2 transition-colors hover:border-cyan-200/25 hover:text-lc-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All Expeditions
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-instrument flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-200/75">
              <Map className="h-3.5 w-3.5" aria-hidden />
              Map preview - {preview.suggestedOrder ? 'Suggested sequence' : 'Flexible order'}
            </p>
            <h2 className="font-display mt-1 text-2xl leading-tight text-lc-text">{preview.title}</h2>
          </div>
          {completedExpeditionIds.has(preview.id) && <Trophy className="h-6 w-6 shrink-0 text-lc-amber" aria-label="Completed expedition" />}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-lc-text2">{preview.description}</p>
        <div className="mt-4 border-l-2 border-rose-200/45 pl-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-100/65">Guiding question</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-lc-text">{preview.centralQuestion}</p>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-rose-100/70">
          <Route className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          {preview.suggestedOrder
            ? 'Map arrows show the suggested sequence. The class can still take detours.'
            : 'Map lines connect the route stops for an overview. The class can visit them in any order.'}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-white/10 bg-white/10">
          <ExpeditionFact label="Complete" value={`${preview.requiredStopCount} of ${preview.stops.length}`} />
          <ExpeditionFact label="Length" value={preview.estimatedLessons} />
          <ExpeditionFact label="Level" value={preview.suggestedLevel} />
        </div>

        <div className="mt-5 space-y-2">
          {preview.stops.map((stop, index) => {
            const city = destination(stop.destinationId);
            if (!city) return null;
            const completed = progress.completedDestinationIds.includes(stop.destinationId);
            const distance = routeOrigin ? distanceKm(routeOrigin, city) : null;
            const inRange = distance == null || distance <= rangeKm || city.id === routeOrigin?.id;
            const focus = city.focusOptions.find((candidate) => candidate.id === stop.recommendedFocusId);
            return (
              <button
                key={stop.destinationId}
                type="button"
                onClick={() => onSelectDestination(stop.destinationId, stop.recommendedFocusId)}
                className="group w-full rounded-md border border-white/10 bg-white/[0.025] px-3 py-3 text-left transition-colors hover:border-rose-200/35 hover:bg-rose-300/[0.04]"
              >
                <span className="flex items-start gap-3">
                  <span className={`font-instrument flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                    completed ? 'border-lc-success/45 bg-lc-success/10 text-lc-success' : 'border-rose-200/30 bg-rose-300/[0.06] text-rose-100/80'
                  }`}>
                    {completed ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-lc-text">{city.city}</span>
                      {distance != null && (
                        <span className={`shrink-0 text-[11px] font-semibold ${inRange ? 'text-lc-success/80' : 'text-lc-text3'}`}>{formatDistance(distance)}</span>
                      )}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-cyan-100/65">
                      <BookOpen className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="truncate">{focus?.title ?? 'Recommended city lesson'}</span>
                    </span>
                    <span className="mt-1.5 block text-xs leading-relaxed text-lc-text3">{stop.reason}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {!currentRun && !completedExpeditionIds.has(preview.id) && (
          <button
            type="button"
            disabled={actionStatus === 'working'}
            onClick={() => onAction('activate', preview.id)}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-rose-300 px-4 text-sm font-bold text-[var(--wf-bg)] transition-colors hover:bg-rose-200 disabled:opacity-50"
          >
            <Compass className="h-4 w-4" aria-hidden />
            {actionStatus === 'working' ? 'Starting expedition...' : 'Start This Expedition'}
          </button>
        )}
        {currentRun && currentRun.expeditionId !== preview.id && !completedExpeditionIds.has(preview.id) && (
          <button
            type="button"
            disabled={actionStatus === 'working'}
            onClick={() => onAction('activate', preview.id)}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-rose-200/35 bg-rose-300/[0.08] px-4 text-sm font-bold text-rose-100 transition-colors hover:bg-rose-300/[0.14] disabled:opacity-50"
          >
            <Route className="h-4 w-4" aria-hidden />
            Replace Current Expedition
          </button>
        )}
      </section>}
    </div>
  );
}

function ExpeditionFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-lc-text3">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-9 w-full rounded-md border border-white/10 bg-[var(--wf-inset)] px-2 text-[11px] font-semibold text-lc-text outline-none transition-colors hover:border-cyan-200/25 focus:border-cyan-300/45"
      >
        {children}
      </select>
    </label>
  );
}

function ExpeditionFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--wf-inset)] px-2.5 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-lc-text3">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-snug text-lc-text">{value}</p>
    </div>
  );
}

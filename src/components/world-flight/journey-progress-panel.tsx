'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Award, BookOpen, CalendarDays, Gauge, Lightbulb, MapPin, MapPinned, Plane, Play, Route } from 'lucide-react';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { WorldFlightInvestigationProgress } from '@/lib/world-flight/investigations';
import type { WorldFlightCompletedLegSummary } from '@/lib/world-flight/journey';
import { formatDistance } from '@/lib/world-flight/geo';
import { ShareJourneyButton } from './share-journey-button';

function destination(destinationId: string | null) {
  return WORLD_DESTINATIONS.find((candidate) => candidate.id === destinationId) ?? null;
}

function formatDate(iso: string | null) {
  if (!iso) return 'Journey origin';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function stampRotation(destinationId: string) {
  const hash = Array.from(destinationId).reduce((total, character) => total + character.charCodeAt(0), 0);
  return `${(hash % 7) - 3}deg`;
}

export function JourneyProgressPanel({
  classId,
  className,
  currentDestinationId,
  visitedDestinationIds,
  completedLegs,
  planeName,
  rangeKm,
  investigations,
  selectedLegId,
  selectedDestinationId,
  onSelectLeg,
  onHoverLeg,
  onSelectDestination,
  onReplayArrival,
}: {
  classId: string | null;
  className: string;
  currentDestinationId: string | null;
  visitedDestinationIds: string[];
  completedLegs: WorldFlightCompletedLegSummary[];
  planeName: string;
  rangeKm: number;
  investigations: WorldFlightInvestigationProgress[];
  selectedLegId: string | null;
  selectedDestinationId: string | null;
  onSelectLeg: (legId: string) => void;
  onHoverLeg: (legId: string | null) => void;
  onSelectDestination: (destinationId: string) => void;
  onReplayArrival: (destinationId: string) => void;
}) {
  const currentCity = destination(currentDestinationId);
  const visitedDestinations = visitedDestinationIds
    .map((destinationId) => destination(destinationId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const totalDistanceKm = completedLegs.reduce((total, leg) => total + leg.distanceKm, 0);
  const compactDistance = totalDistanceKm >= 1000 ? `${Math.round(totalDistanceKm / 1000)}k km` : `${Math.round(totalDistanceKm)} km`;
  const countryCount = new Set(visitedDestinations.map((item) => item.country)).size;
  const regionCount = new Set(visitedDestinations.map((item) => item.region)).size;
  const completedMissions = investigations.filter((investigation) => investigation.designMissionStatus === 'completed');
  const selectedLeg = completedLegs.find((leg) => leg.id === selectedLegId) ?? null;
  const selectedLegNumber = selectedLeg ? completedLegs.findIndex((leg) => leg.id === selectedLeg.id) + 1 : null;
  const selectedCity = destination(selectedDestinationId);
  const selectedCityLessons = selectedDestinationId
    ? completedLegs.filter((leg) => leg.destinationId === selectedDestinationId)
    : [];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="border-b border-white/10 bg-[linear-gradient(145deg,rgba(14,116,144,0.16),rgba(245,158,11,0.07))] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-instrument flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
              <MapPinned className="h-4 w-4" aria-hidden />
              Class passport
            </p>
            <h2 className="font-display mt-2 truncate text-2xl text-lc-text">{className}</h2>
            <p className="mt-1 text-xs text-lc-text3">
              {currentCity ? `Currently in ${currentCity.city}, ${currentCity.country}` : 'Choose a departure city to begin the journey'}
            </p>
          </div>
          <div className="shrink-0 border-l border-white/10 pl-4 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-lc-text2">Flights</p>
            <p className="mt-1 text-2xl font-bold text-cyan-100">{completedLegs.length}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          <PassportStat label="Cities" value={visitedDestinations.length} />
          <PassportStat label="Countries" value={countryCount} />
          <PassportStat label="Regions" value={regionCount} />
          <PassportStat label="Distance" value={compactDistance} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
          <span className="flex min-w-0 items-center gap-2 text-lc-text2">
            <Plane className="h-4 w-4 shrink-0 text-cyan-300/75" aria-hidden />
            <span className="truncate">{planeName}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-lc-text3">
            <Gauge className="h-3.5 w-3.5" aria-hidden />
            {formatDistance(rangeKm)}
          </span>
        </div>

        {classId && (
          <div className="mt-4">
            <ShareJourneyButton classId={classId} />
          </div>
        )}
      </section>

      {(selectedLeg || selectedCity) && (
        <section className="border-b border-white/10 bg-cyan-300/[0.025] px-5 py-5">
          {selectedLeg && (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-instrument text-[11px] font-semibold uppercase tracking-[0.16em] text-lc-amber/80">
                    Flight {selectedLegNumber}
                  </p>
                  <h3 className="font-display mt-1 text-xl leading-tight text-lc-text">
                    {destination(selectedLeg.originDestinationId)?.city ?? 'Journey origin'} to {destination(selectedLeg.destinationId)?.city ?? selectedLeg.destinationId}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onReplayArrival(selectedLeg.destinationId)}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-cyan-200/25 bg-cyan-300/[0.07] px-3 text-[11px] font-semibold uppercase tracking-wide text-cyan-100 transition-colors hover:border-cyan-200/55 hover:bg-cyan-300/[0.12]"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden />
                  Replay
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 text-xs">
                <FlightFact icon={<CalendarDays className="h-3.5 w-3.5" />} label="Completed" value={formatDate(selectedLeg.completedAt)} />
                <FlightFact icon={<Route className="h-3.5 w-3.5" />} label="Distance" value={formatDistance(selectedLeg.distanceKm)} />
                <FlightFact icon={<BookOpen className="h-3.5 w-3.5" />} label="Lesson" value={selectedLeg.focusTitle ?? 'Completed city lesson'} />
                <FlightFact icon={<Plane className="h-3.5 w-3.5" />} label="Source" value={[selectedLeg.focusKind, selectedLeg.publisher].filter(Boolean).join(' - ') || 'Lesson source'} />
              </div>

              {selectedLeg.keyIdea && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-lc-amber/15 bg-lc-amber/[0.05] px-3 py-2.5 text-xs leading-relaxed text-lc-text2">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lc-amber" aria-hidden />
                  <span>{selectedLeg.keyIdea}</span>
                </div>
              )}

              {selectedLeg.fieldNotes.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-lc-text2">Field notes earned</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedLeg.fieldNotes.slice(0, 6).map((note) => (
                      <span key={note} className="rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-2 py-0.5 text-[11px] text-violet-100/80">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedCity && (
            <div className={selectedLeg ? 'mt-5 border-t border-white/10 pt-4' : ''}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-lc-text2">{selectedCity.city} lesson history</h3>
                <span className="text-[11px] text-cyan-100/65">{selectedCityLessons.length} completed</span>
              </div>
              {selectedCityLessons.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {selectedCityLessons.map((leg) => (
                    <li key={leg.id}>
                      <button
                        type="button"
                        onClick={() => onSelectLeg(leg.id)}
                        onMouseEnter={() => onHoverLeg(leg.id)}
                        onMouseLeave={() => onHoverLeg(null)}
                        className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                          leg.id === selectedLegId
                            ? 'border-lc-amber/35 bg-lc-amber/[0.06]'
                            : 'border-white/10 bg-white/[0.025] hover:border-cyan-200/30 hover:bg-cyan-300/[0.04]'
                        }`}
                      >
                        <span className="block text-xs font-semibold text-lc-text">{leg.focusTitle ?? 'Completed city lesson'}</span>
                        <span className="mt-1 block text-[11px] text-lc-text3">{formatDate(leg.completedAt)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-lc-text3">The journey began here. Completed arrival lessons will appear in this city record.</p>
              )}
            </div>
          )}
        </section>
      )}

      <section className="border-b border-white/10 px-5 py-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-lc-text2">Passport stamps</h3>
            <p className="mt-1 text-xs text-lc-text3">Select a stamp to revisit that city on the map.</p>
          </div>
          <span className="text-xs font-semibold text-cyan-200/65">{visitedDestinations.length} collected</span>
        </div>

        {visitedDestinations.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {visitedDestinations.map((item) => {
              const arrival = [...completedLegs].reverse().find((leg) => leg.destinationId === item.id)
                ?? completedLegs.find((leg) => leg.originDestinationId === item.id)
                ?? null;
              const isCurrent = item.id === currentDestinationId;
              const isSelected = item.id === selectedDestinationId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectDestination(item.id)}
                  onMouseEnter={() => onHoverLeg(arrival?.id ?? null)}
                  onMouseLeave={() => onHoverLeg(null)}
                  className={`group min-h-[126px] border-2 border-dashed p-2 text-center transition-colors ${isCurrent ? 'animate-passport-stamp ' : ''}${
                    isCurrent
                      ? 'border-lc-amber/60 bg-lc-amber/[0.08] text-lc-amber'
                      : isSelected
                        ? 'border-cyan-100/70 bg-cyan-300/[0.1] text-cyan-50'
                      : 'border-cyan-200/30 bg-cyan-300/[0.035] text-cyan-100/80 hover:border-cyan-200/60 hover:bg-cyan-300/[0.07]'
                  }`}
                  style={{ '--stamp-rotation': stampRotation(item.id), transform: `rotate(${stampRotation(item.id)})` } as CSSProperties}
                >
                  <span className="flex h-full min-h-[106px] flex-col items-center justify-center border border-current/25 px-2 py-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-75">{item.country}</span>
                    <span className="font-instrument mt-1 text-3xl font-black leading-none tracking-widest">{item.primaryAirport}</span>
                    <span className="mt-2 text-sm font-bold leading-tight">{item.city}</span>
                    <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">{formatDate(arrival?.completedAt ?? null)}</span>
                    {isCurrent && (
                      <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide">
                        <MapPin className="h-3 w-3" aria-hidden />
                        Current stop
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 border-l-2 border-cyan-300/25 pl-3 text-xs leading-relaxed text-lc-text3">
            The first stamps appear after the class completes its first flight lesson.
          </p>
        )}
      </section>

      {completedMissions.length > 0 && (
        <section className="border-b border-white/10 px-5 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-lc-text2">Design mission visas</h3>
          <div className="mt-3 space-y-2">
            {completedMissions.map((mission) => (
              <div key={mission.id} className="flex items-start gap-3 border-l-2 border-lc-success/40 bg-lc-success/[0.04] px-3 py-3">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-lc-success" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-lc-success/80">{mission.title}</span>
                  <span className="mt-1 block text-sm font-semibold text-lc-text">{mission.completedDesignTitle}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-5 py-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-lc-text2">Flight log</h3>
          <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-lc-text2">
            <Route className="h-3.5 w-3.5" aria-hidden />
            {formatDistance(totalDistanceKm)}
          </span>
        </div>
        {completedLegs.length > 0 ? (
          <ol className="mt-3 space-y-3">
            {completedLegs.map((leg, index) => {
              const origin = destination(leg.originDestinationId);
              const arrival = destination(leg.destinationId);
              return (
                <li key={leg.id} className="relative pl-8">
                  <span className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border font-instrument text-[11px] font-bold ${
                    leg.id === selectedLegId
                      ? 'border-lc-amber/70 bg-lc-amber/15 text-lc-amber'
                      : 'border-cyan-200/30 bg-[var(--wf-inset)] text-cyan-200'
                  }`}>
                    {index + 1}
                  </span>
                  {index < completedLegs.length - 1 && <span className="absolute bottom-[-14px] left-[11px] top-7 w-px bg-cyan-200/15" />}
                  <button
                    type="button"
                    onClick={() => onSelectLeg(leg.id)}
                    onMouseEnter={() => onHoverLeg(leg.id)}
                    onMouseLeave={() => onHoverLeg(null)}
                    className={`block w-full rounded-md border px-3 py-2 text-left transition-colors ${
                      leg.id === selectedLegId
                        ? 'border-lc-amber/30 bg-lc-amber/[0.055]'
                        : 'border-transparent hover:border-cyan-200/20 hover:bg-cyan-300/[0.035]'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-lc-text">
                      {origin?.city ?? 'First departure'} to {arrival?.city ?? leg.destinationId}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-3 text-[11px] text-lc-text2">
                      <span className="flex min-w-0 items-center gap-1">
                        <BookOpen className="h-3 w-3 shrink-0" aria-hidden />
                        <span className="truncate">{leg.focusTitle ?? 'Completed city lesson'}</span>
                      </span>
                      <span className="shrink-0">{formatDistance(leg.distanceKm)}</span>
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-cyan-200/65">
                      {formatDate(leg.completedAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-lc-text3">Completed flights will create a chronological class travel log.</p>
        )}
      </section>
    </div>
  );
}

function PassportStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-l border-white/10 pl-2 first:border-l-0 first:pl-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-lc-text2">{label}</p>
      <p className="mt-1 text-sm font-bold text-lc-text">{value}</p>
    </div>
  );
}

function FlightFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 bg-[var(--wf-inset)] px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-100/60">{icon}{label}</p>
      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-lc-text">{value}</p>
    </div>
  );
}

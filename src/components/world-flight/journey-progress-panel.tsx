'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, MapPinned, Plane } from 'lucide-react';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { WorldFlightCompletedLegSummary } from '@/lib/world-flight/journey';

function cityName(destinationId: string | null) {
  if (!destinationId) return 'First departure';
  return WORLD_DESTINATIONS.find((destination) => destination.id === destinationId)?.city ?? destinationId;
}

export function JourneyProgressPanel({
  currentDestinationId,
  visitedDestinationIds,
  completedLegCount,
  recentLegs,
}: {
  currentDestinationId: string | null;
  visitedDestinationIds: string[];
  completedLegCount: number;
  recentLegs: WorldFlightCompletedLegSummary[];
}) {
  const [open, setOpen] = useState(false);
  const currentCity = cityName(currentDestinationId);

  return (
    <div className="border-t border-white/10">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/[0.035]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-lc-success/25 bg-lc-success/[0.08] text-lc-success">
          <MapPinned className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-lc-text2">
            Journey passport
            {visitedDestinationIds.length > 0 && (
              <span className="rounded-full border border-lc-success/25 bg-lc-success/10 px-1.5 py-0.5 text-[9px] tracking-normal text-lc-success">
                {visitedDestinationIds.length} visited
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-lc-text3">
            {currentDestinationId
              ? `Now in ${currentCity} - ${completedLegCount} completed ${completedLegCount === 1 ? 'flight' : 'flights'}`
              : 'Choose a departure city to begin this class journey'}
          </span>
        </span>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-lc-text3" aria-hidden />
          : <ChevronDown className="h-4 w-4 shrink-0 text-lc-text3" aria-hidden />}
      </button>

      {open && (
        <div className="max-h-[330px] overflow-y-auto border-t border-white/10 px-5 py-4">
          {visitedDestinationIds.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {visitedDestinationIds.map((destinationId) => (
                  <span
                    key={destinationId}
                    className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${
                      destinationId === currentDestinationId
                        ? 'border-lc-amber/30 bg-lc-amber/10 text-lc-amber'
                        : 'border-lc-success/20 bg-lc-success/[0.06] text-lc-success'
                    }`}
                  >
                    <Check className="h-3 w-3" aria-hidden />
                    {cityName(destinationId)}
                  </span>
                ))}
              </div>

              {recentLegs.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-lc-text3">Recent flights</h3>
                  {recentLegs.map((leg, index) => (
                    <div key={`${leg.destinationId}-${leg.completedAt ?? index}`} className="flex items-start gap-2 text-xs">
                      <Plane className="mt-0.5 h-3.5 w-3.5 shrink-0 rotate-45 text-cyan-200/70" aria-hidden />
                      <span className="min-w-0">
                        <span className="block font-semibold text-lc-text2">
                          {cityName(leg.originDestinationId)} to {cityName(leg.destinationId)}
                        </span>
                        {leg.focusTitle && <span className="block truncate text-[10px] text-lc-text3">{leg.focusTitle}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs leading-relaxed text-lc-text3">
              The passport records both the departure and arrival cities after the class completes its first flight lesson.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

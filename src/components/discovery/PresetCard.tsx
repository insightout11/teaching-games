'use client';

// A "Full Flight" preset card — a COMPACT boarding pass (the hero's little sibling).
// Size = commitment: bigger and richer than a module DiscoveryCard, smaller than the
// hero. Encodes a whole-lesson journey: themed accent, a static route strip, a stub
// (focus / duration / class), flight number, and a "Build this lesson" affordance.
//
// Presentational for now (the prototype). Wiring real launches comes when the new
// preset SET is designed — see docs/home-screen-redesign-audit-jun2026.md §8.

import { Plane, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RouteWaypoint } from '@/lib/discovery-shelves';

export interface PresetCardData {
  id: string;
  name: string;
  focus: string;
  durationMinutes: number;
  classFit: string;
  flightNumber: string;
  route: RouteWaypoint[];
  /** Tailwind accent classes — kept explicit so Tailwind never purges a dynamic string. */
  accent: {
    border: string;
    glow: string;
    tick: string;
    dot: string;
    line: string;
    text: string;
  };
  /** Visual-only flag for placeholder cards in the prototype. */
  preview?: boolean;
  onSelect?: (id: string) => void;
}

export function PresetCard({ data }: { data: PresetCardData }) {
  const { name, focus, durationMinutes, classFit, flightNumber, route, accent, preview, onSelect } = data;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0b1c38]/85 to-[#060f1f]/90 p-5 backdrop-blur-md transition-all',
        accent.border,
        'hover:-translate-y-0.5',
        accent.glow,
      )}
    >
      {/* Glass sheen */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/[0.06] to-transparent" />

      {/* Header row: Full Flight badge + flight no. */}
      <div className="flex items-center justify-between">
        <span className={cn('font-instrument inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em]', accent.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', accent.dot)} />
          Full Flight
        </span>
        <span className="font-instrument text-[10px] uppercase tracking-[0.18em] text-lc-text3">{flightNumber}</span>
      </div>

      {/* Title */}
      <h3 className="font-game mt-3 text-[1.7rem] leading-[0.95] text-lc-text">{name}</h3>

      {/* Focus / duration / class chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[focus, `≈ ${durationMinutes} min`, classFit].map((chip) => (
          <span
            key={chip}
            className="font-instrument rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-wider text-lc-text2"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Route strip — static (lighter than the animated hero) */}
      <div className="mt-5">
        <div className="relative pt-1">
          <div className={cn('absolute left-1 right-1 top-[7px] h-px', accent.line)} />
          <ol className="relative flex justify-between">
            {route.map((wp, i) => {
              const isLanding = wp.kind === 'landing';
              return (
                <li key={`${wp.label}-${i}`} className="flex flex-col items-center gap-2">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full border',
                      isLanding ? 'border-lc-amber bg-lc-amber/80' : cn('border-transparent', accent.dot),
                    )}
                  />
                  <span className="font-instrument hidden text-[8.5px] uppercase tracking-wide text-lc-text3 sm:block">
                    {wp.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => onSelect?.(data.id)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border bg-white/[0.04] px-3.5 py-2 text-[13px] font-semibold text-lc-text transition-colors',
            accent.border,
            'hover:bg-white/[0.08]',
          )}
        >
          <Plane className="h-4 w-4" aria-hidden />
          Build this lesson
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
        {preview && (
          <span className="font-instrument rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-lc-text3">
            Preview
          </span>
        )}
      </div>
    </article>
  );
}

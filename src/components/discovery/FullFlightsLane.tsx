'use client';

// "Full Flights" lane — the whole-lesson presets section (the hero's siblings).
// Mirrors DiscoveryShelf's branded header, but renders richer PresetCards instead of
// module cards. Captain's Flight stays the hero ABOVE this lane; this is where the
// rest of the (future) preset set lives.
//
// PROTOTYPE: the SAMPLE_FULL_FLIGHTS below are placeholder visuals so we can see the
// lane's look while the real preset set is designed from scratch (parked — see
// docs/home-screen-redesign-audit-jun2026.md §8). Replace with real presets later.

import { PresetCard, type PresetCardData } from './PresetCard';
import { CardRail } from './CardRail';

// ── PROTOTYPE sample data ─────────────────────────────────────────────────────
const ACCENTS = {
  cyan: {
    border: 'border-cyan-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(34,211,238,0.55)]',
    tick: 'bg-cyan-400', dot: 'bg-cyan-300', line: 'bg-cyan-300/25', text: 'text-cyan-300/90',
  },
  violet: {
    border: 'border-violet-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(167,139,250,0.55)]',
    tick: 'bg-violet-400', dot: 'bg-violet-300', line: 'bg-violet-300/25', text: 'text-violet-300/90',
  },
  emerald: {
    border: 'border-emerald-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(52,211,153,0.55)]',
    tick: 'bg-emerald-400', dot: 'bg-emerald-300', line: 'bg-emerald-300/25', text: 'text-emerald-300/90',
  },
  amber: {
    border: 'border-amber-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(245,158,11,0.55)]',
    tick: 'bg-amber-400', dot: 'bg-amber-300', line: 'bg-amber-300/25', text: 'text-amber-300/90',
  },
  rose: {
    border: 'border-rose-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(251,113,133,0.55)]',
    tick: 'bg-rose-400', dot: 'bg-rose-300', line: 'bg-rose-300/25', text: 'text-rose-300/90',
  },
} as const;

const SAMPLE_FULL_FLIGHTS: PresetCardData[] = [
  {
    id: 'sample-speaking-circle', name: 'Speaking Circle', focus: 'Speaking', durationMinutes: 60,
    classFit: 'Whole class', flightNumber: 'LC-S1', preview: true, accent: ACCENTS.cyan,
    route: [
      { label: 'Warm-up', kind: 'stage' }, { label: 'Scene', kind: 'stage' },
      { label: 'Rounds', kind: 'micro-event' }, { label: 'Debate', kind: 'stage' },
      { label: 'Final Word', kind: 'landing' },
    ],
  },
  {
    id: 'sample-debate-ready', name: 'Debate Ready', focus: 'Discussion', durationMinutes: 60,
    classFit: 'Whole class', flightNumber: 'LC-D1', preview: true, accent: ACCENTS.violet,
    route: [
      { label: 'Take', kind: 'stage' }, { label: 'Evidence', kind: 'stage' },
      { label: 'Defend', kind: 'micro-event' }, { label: 'Vote', kind: 'stage' },
      { label: 'Shift', kind: 'landing' },
    ],
  },
  {
    id: 'sample-grammar-clinic', name: 'Grammar Clinic', focus: 'Grammar', durationMinutes: 45,
    classFit: 'Any size', flightNumber: 'LC-G1', preview: true, accent: ACCENTS.emerald,
    route: [
      { label: 'Check-in', kind: 'stage' }, { label: 'Hunt', kind: 'micro-event' },
      { label: 'Build', kind: 'stage' }, { label: 'Proof', kind: 'landing' },
    ],
  },
  {
    id: 'sample-game-day', name: 'Game Day', focus: 'Games', durationMinutes: 45,
    classFit: 'Whole class', flightNumber: 'LC-X1', preview: true, accent: ACCENTS.amber,
    route: [
      { label: 'Connect', kind: 'stage' }, { label: 'Rush', kind: 'end-game' },
      { label: 'Imposter', kind: 'end-game' }, { label: 'Quiz', kind: 'landing' },
    ],
  },
  {
    id: 'sample-travel-english', name: 'Travel English', focus: 'Functional', durationMinutes: 60,
    classFit: '1–on–1 · small', flightNumber: 'LC-T1', preview: true, accent: ACCENTS.rose,
    route: [
      { label: 'Vocab', kind: 'stage' }, { label: 'Dialogue', kind: 'stage' },
      { label: 'Scene', kind: 'micro-event' }, { label: 'Rounds', kind: 'stage' },
      { label: 'Final Word', kind: 'landing' },
    ],
  },
];
// ──────────────────────────────────────────────────────────────────────────────

export function FullFlightsLane() {
  return (
    <section aria-label="Full Flights">
      <div className="mb-5">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <span aria-hidden className="h-6 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
            <h2 className="text-2xl font-bold tracking-tight text-lc-text">Full Flights</h2>
          </div>
          <div className="hud-rule hidden sm:block" aria-hidden />
        </div>
        <p className="mt-1.5 text-sm text-lc-text3">Complete, ready-to-run lessons — pick a route and launch the whole class.</p>
      </div>

      <CardRail itemWidthClass="w-[340px]">
        {SAMPLE_FULL_FLIGHTS.map((preset) => (
          <PresetCard key={preset.id} data={preset} />
        ))}
      </CardRail>
    </section>
  );
}

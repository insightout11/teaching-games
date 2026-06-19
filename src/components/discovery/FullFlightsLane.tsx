'use client';

// "Full Flights" lane — the whole-lesson presets section (the hero's siblings).
// Captain's Flight stays the hero ABOVE this lane; this is where the rest of the
// preset set lives. Speak, Grammar, Travel, and Debate are REAL, launchable presets
// (cards derived from the live preset so they never drift); any remaining cards are
// PROTOTYPE preview visuals until those presets are authored
// (see docs/world-flight-presets-direction.md).

import { useState } from 'react';
import { PresetCard, type PresetCardData } from './PresetCard';
import { CardRail } from './CardRail';
import { FeaturedFlightLaunchModal } from './FeaturedFlightLaunchModal';
import { FLIGHT_PLAN_PRESETS, type FlightPlanPreset } from '@/lib/flight-plan-presets';

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

// ── Real, launchable presets ──────────────────────────────────────────────────
// Speak — route + duration derived from the live speak-60 preset so the card never drifts.
const SPEAK_PRESET = FLIGHT_PLAN_PRESETS.find((p) => p.id === 'speak-60');
const SPEAK_CARD: PresetCardData = {
  id: 'speak-60',
  name: SPEAK_PRESET?.name ?? 'Speak',
  focus: 'Speaking',
  durationMinutes: SPEAK_PRESET?.lessonDurationMinutes ?? 60,
  classFit: 'Whole class',
  flightNumber: 'LC-S1',
  accent: ACCENTS.cyan,
  route: (SPEAK_PRESET?.flightConfig?.stages ?? []).map((s) => ({ label: s.label, kind: s.kind })),
};

const GRAMMAR_PRESET = FLIGHT_PLAN_PRESETS.find((p) => p.id === 'grammar-60');
const GRAMMAR_CARD: PresetCardData = {
  id: 'grammar-60',
  name: GRAMMAR_PRESET?.name ?? 'Grammar',
  focus: 'Grammar',
  durationMinutes: GRAMMAR_PRESET?.lessonDurationMinutes ?? 60,
  classFit: 'Any size',
  flightNumber: 'LC-G1',
  accent: ACCENTS.emerald,
  route: (GRAMMAR_PRESET?.flightConfig?.stages ?? []).map((s) => ({ label: s.label, kind: s.kind })),
};

const TRAVEL_PRESET = FLIGHT_PLAN_PRESETS.find((p) => p.id === 'travel-60');
const TRAVEL_CARD: PresetCardData = {
  id: 'travel-60',
  name: TRAVEL_PRESET?.name ?? 'Travel',
  focus: 'Travel',
  durationMinutes: TRAVEL_PRESET?.lessonDurationMinutes ?? 60,
  classFit: 'Whole class',
  flightNumber: 'LC-T1',
  accent: ACCENTS.rose,
  route: (TRAVEL_PRESET?.flightConfig?.stages ?? []).map((s) => ({ label: s.label, kind: s.kind })),
};

const DEBATE_PRESET = FLIGHT_PLAN_PRESETS.find((p) => p.id === 'debate-60');
const DEBATE_CARD: PresetCardData = {
  id: 'debate-60',
  name: DEBATE_PRESET?.name ?? 'Debate',
  focus: 'Discussion',
  durationMinutes: DEBATE_PRESET?.lessonDurationMinutes ?? 60,
  classFit: 'Whole class',
  flightNumber: 'LC-D1',
  accent: ACCENTS.violet,
  route: (DEBATE_PRESET?.flightConfig?.stages ?? []).map((s) => ({ label: s.label, kind: s.kind })),
};

// ── PROTOTYPE preview cards (not yet authored as real presets) ─────────────────
const PREVIEW_FLIGHTS: PresetCardData[] = [
  {
    id: 'sample-game-day', name: 'Game Day', focus: 'Games', durationMinutes: 45,
    classFit: 'Whole class', flightNumber: 'LC-X1', preview: true, accent: ACCENTS.amber,
    route: [
      { label: 'Warm-up', kind: 'stage' }, { label: 'Connect', kind: 'stage' },
      { label: 'Rush', kind: 'end-game' }, { label: 'Imposter', kind: 'end-game' },
      { label: 'Password', kind: 'end-game' }, { label: 'Quiz', kind: 'end-game' },
      { label: 'Scores', kind: 'stage' }, { label: 'Landing', kind: 'landing' },
    ],
  },
];
// ──────────────────────────────────────────────────────────────────────────────

export function FullFlightsLane() {
  const [launchPreset, setLaunchPreset] = useState<FlightPlanPreset | null>(null);

  function handleSelect(id: string) {
    const preset = FLIGHT_PLAN_PRESETS.find((p) => p.id === id);
    if (preset) setLaunchPreset(preset);
  }

  const cards: PresetCardData[] = [
    { ...SPEAK_CARD, onSelect: handleSelect },
    { ...GRAMMAR_CARD, onSelect: handleSelect },
    { ...TRAVEL_CARD, onSelect: handleSelect },
    { ...DEBATE_CARD, onSelect: handleSelect },
    ...PREVIEW_FLIGHTS,
  ];

  return (
    <section aria-label="Full Lessons">
      <div className="mb-5">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <span aria-hidden className="h-6 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
            <h2 className="text-2xl font-bold tracking-tight text-lc-text">Full Lessons</h2>
          </div>
          <div className="hud-rule hidden sm:block" aria-hidden />
        </div>
        <p className="mt-1.5 text-sm text-lc-text3">Complete, ready-to-run lessons — pick a route and launch the whole class.</p>
      </div>

      <CardRail itemWidthClass="w-[360px] sm:w-[560px]">
        {cards.map((preset) => (
          <PresetCard key={preset.id} data={preset} />
        ))}
      </CardRail>

      <FeaturedFlightLaunchModal
        open={!!launchPreset}
        preset={launchPreset}
        onClose={() => setLaunchPreset(null)}
      />
    </section>
  );
}

'use client';

// "Great with a video or reading" lane — lessons curated to SHINE when paired with a
// source the teacher chooses. Bringing a source is normal on any lesson; this lane just
// features the sequences built to make the most of one. They're real lessons, so they
// render as boarding-pass PresetCards (like Full Flights), tagged with what they pair with.
//
// PROTOTYPE: SAMPLE_SOURCE_LESSONS are placeholder visuals while the real preset set is
// designed from scratch (parked — docs/home-screen-redesign-audit-jun2026.md §8).

import { PresetCard, type PresetCardData } from './PresetCard';

// ── PROTOTYPE sample data ─────────────────────────────────────────────────────
const ACCENTS = {
  cyan: {
    border: 'border-cyan-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(34,211,238,0.55)]',
    tick: 'bg-cyan-400', dot: 'bg-cyan-300', line: 'bg-cyan-300/25', text: 'text-cyan-300/90',
  },
  emerald: {
    border: 'border-emerald-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(52,211,153,0.55)]',
    tick: 'bg-emerald-400', dot: 'bg-emerald-300', line: 'bg-emerald-300/25', text: 'text-emerald-300/90',
  },
  sky: {
    border: 'border-sky-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(56,189,248,0.55)]',
    tick: 'bg-sky-400', dot: 'bg-sky-300', line: 'bg-sky-300/25', text: 'text-sky-300/90',
  },
} as const;

const SAMPLE_SOURCE_LESSONS: PresetCardData[] = [
  {
    id: 'sample-watch-discuss', name: 'Watch & Discuss', focus: 'Speaking', durationMinutes: 60,
    classFit: 'Whole class', flightNumber: 'LC-V1', pairsWith: 'Best with a video', preview: true, accent: ACCENTS.cyan,
    route: [
      { label: 'Watch', kind: 'stage' }, { label: 'Check', kind: 'micro-event' },
      { label: 'React', kind: 'stage' }, { label: 'Debate', kind: 'stage' },
      { label: 'Final Word', kind: 'landing' },
    ],
  },
  {
    id: 'sample-deep-reading', name: 'Deep Reading', focus: 'Vocabulary', durationMinutes: 45,
    classFit: 'Any size', flightNumber: 'LC-R1', pairsWith: 'Best with an article', preview: true, accent: ACCENTS.emerald,
    route: [
      { label: 'Read', kind: 'stage' }, { label: 'Vocab', kind: 'micro-event' },
      { label: 'Questions', kind: 'stage' }, { label: 'Discuss', kind: 'landing' },
    ],
  },
  {
    id: 'sample-listening-lab', name: 'Listening Lab', focus: 'Listening', durationMinutes: 45,
    classFit: 'Whole class', flightNumber: 'LC-L1', pairsWith: 'Best with a clip', preview: true, accent: ACCENTS.sky,
    route: [
      { label: 'Listen', kind: 'stage' }, { label: 'Gap-fill', kind: 'micro-event' },
      { label: 'Rebuild', kind: 'stage' }, { label: 'Talk', kind: 'landing' },
    ],
  },
];
// ──────────────────────────────────────────────────────────────────────────────

export function SourceLessonsLane() {
  return (
    <section aria-label="Great with a video or reading">
      <div className="mb-5">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <span aria-hidden className="h-6 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
            <h2 className="text-2xl font-bold tracking-tight text-lc-text">Great with a video or reading</h2>
          </div>
          <div className="hud-rule hidden sm:block" aria-hidden />
        </div>
        <p className="mt-1.5 text-sm text-lc-text3">Lessons built to make the most of a video, article, or clip you choose.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {SAMPLE_SOURCE_LESSONS.map((lesson) => (
          <PresetCard key={lesson.id} data={lesson} />
        ))}
      </div>
    </section>
  );
}

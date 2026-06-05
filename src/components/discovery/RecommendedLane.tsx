'use client';

// "Recommended for you" — driven by the onboarding profile (home §5). Honest by design:
// the rail's subheading states the real reason ("Because you teach 1-on-1 beginners"),
// and with no profile yet it shows curated starting points labelled as such (never faked
// personalization).
//
// PROTOTYPE: the recommendable lessons below are sample visuals; real ranking against the
// live preset set lands when that set is built. The PROFILE wiring is real.

import { PresetCard, type PresetCardData } from './PresetCard';
import { CardRail } from './CardRail';
import {
  type TeacherProfile,
  type TeachingFocus,
  buildRecommendationReason,
  isProfileComplete,
} from '@/lib/teacher-profile';

const A = {
  cyan: { border: 'border-cyan-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(34,211,238,0.55)]', tick: 'bg-cyan-400', dot: 'bg-cyan-300', line: 'bg-cyan-300/25', text: 'text-cyan-300/90' },
  violet: { border: 'border-violet-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(167,139,250,0.55)]', tick: 'bg-violet-400', dot: 'bg-violet-300', line: 'bg-violet-300/25', text: 'text-violet-300/90' },
  emerald: { border: 'border-emerald-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(52,211,153,0.55)]', tick: 'bg-emerald-400', dot: 'bg-emerald-300', line: 'bg-emerald-300/25', text: 'text-emerald-300/90' },
  amber: { border: 'border-amber-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(245,158,11,0.55)]', tick: 'bg-amber-400', dot: 'bg-amber-300', line: 'bg-amber-300/25', text: 'text-amber-300/90' },
  rose: { border: 'border-rose-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(251,113,133,0.55)]', tick: 'bg-rose-400', dot: 'bg-rose-300', line: 'bg-rose-300/25', text: 'text-rose-300/90' },
  sky: { border: 'border-sky-300/30', glow: 'hover:shadow-[0_0_50px_-18px_rgba(56,189,248,0.55)]', tick: 'bg-sky-400', dot: 'bg-sky-300', line: 'bg-sky-300/25', text: 'text-sky-300/90' },
} as const;

type Pick = PresetCardData & { focuses: TeachingFocus[] };

// ── PROTOTYPE recommendable pool ──────────────────────────────────────────────
const POOL: Pick[] = [
  {
    id: 'rec-conversation', name: 'Conversation Builder', focus: 'Speaking', durationMinutes: 45, classFit: 'Any size',
    flightNumber: 'LC-C1', preview: true, accent: A.cyan, focuses: ['speaking'],
    route: [{ label: 'Warm-up', kind: 'stage' }, { label: 'Scene', kind: 'stage' }, { label: 'Rounds', kind: 'micro-event' }, { label: 'Recap', kind: 'stage' }, { label: 'Final Word', kind: 'landing' }],
  },
  {
    id: 'rec-debate', name: 'Debate Club', focus: 'Discussion', durationMinutes: 60, classFit: 'Whole class',
    flightNumber: 'LC-C2', preview: true, accent: A.violet, focuses: ['speaking', 'exam'],
    route: [{ label: 'Take', kind: 'stage' }, { label: 'Evidence', kind: 'stage' }, { label: 'Defend', kind: 'micro-event' }, { label: 'Vote', kind: 'stage' }, { label: 'Shift', kind: 'landing' }],
  },
  {
    id: 'rec-grammar', name: 'Grammar Gym', focus: 'Grammar', durationMinutes: 45, classFit: 'Any size',
    flightNumber: 'LC-C3', preview: true, accent: A.emerald, focuses: ['grammar'],
    route: [{ label: 'Check-in', kind: 'stage' }, { label: 'Hunt', kind: 'micro-event' }, { label: 'Build', kind: 'stage' }, { label: 'Proof', kind: 'landing' }],
  },
  {
    id: 'rec-vocab', name: 'Word Power', focus: 'Vocabulary', durationMinutes: 45, classFit: 'Any size',
    flightNumber: 'LC-C4', preview: true, accent: A.amber, focuses: ['vocabulary'],
    route: [{ label: 'Radar', kind: 'stage' }, { label: 'Sprint', kind: 'micro-event' }, { label: 'Use', kind: 'stage' }, { label: 'Recap', kind: 'landing' }],
  },
  {
    id: 'rec-exam', name: 'Exam Sprint', focus: 'Exam prep', durationMinutes: 60, classFit: 'Small · 1-on-1',
    flightNumber: 'LC-C5', preview: true, accent: A.rose, focuses: ['exam'],
    route: [{ label: 'Brief', kind: 'stage' }, { label: 'Drill', kind: 'micro-event' }, { label: 'Practice', kind: 'stage' }, { label: 'Review', kind: 'landing' }],
  },
  {
    id: 'rec-business', name: 'Business Brief', focus: 'Business', durationMinutes: 60, classFit: 'Small · 1-on-1',
    flightNumber: 'LC-C6', preview: true, accent: A.sky, focuses: ['business'],
    route: [{ label: 'Scenario', kind: 'stage' }, { label: 'Roleplay', kind: 'micro-event' }, { label: 'Negotiate', kind: 'stage' }, { label: 'Wrap', kind: 'landing' }],
  },
  {
    id: 'rec-kids', name: 'Story Time', focus: 'Young learners', durationMinutes: 30, classFit: 'Any size',
    flightNumber: 'LC-C7', preview: true, accent: A.amber, focuses: ['kids'],
    route: [{ label: 'Sing', kind: 'stage' }, { label: 'Story', kind: 'stage' }, { label: 'Game', kind: 'micro-event' }, { label: 'Wave', kind: 'landing' }],
  },
];

const DEFAULT_PICK_IDS = ['rec-conversation', 'rec-vocab', 'rec-debate', 'rec-grammar'];

function pickFor(profile: TeacherProfile | null): Pick[] {
  if (profile?.focus) {
    const matched = POOL.filter((p) => p.focuses.includes(profile.focus as TeachingFocus));
    const rest = POOL.filter((p) => !p.focuses.includes(profile.focus as TeachingFocus));
    return [...matched, ...rest].slice(0, 5);
  }
  return DEFAULT_PICK_IDS.map((id) => POOL.find((p) => p.id === id)!).filter(Boolean);
}

export function RecommendedLane({ profile }: { profile: TeacherProfile | null }) {
  const picks = pickFor(profile);
  const personalized = !!profile && isProfileComplete(profile);
  const reason = personalized ? buildRecommendationReason(profile) : 'Reliable, low-prep wins to start with.';

  return (
    <section aria-label="Recommended for you">
      <div className="mb-5">
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <span aria-hidden className="h-6 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
            <h2 className="text-2xl font-bold tracking-tight text-lc-text">
              {personalized ? 'Recommended for you' : 'Great starting points'}
            </h2>
          </div>
          <div className="hud-rule hidden sm:block" aria-hidden />
        </div>
        <p className="mt-1.5 text-sm text-lc-text3">{reason}</p>
      </div>

      <CardRail itemWidthClass="w-[340px] sm:w-[440px]">
        {picks.map((p) => (
          <PresetCard key={p.id} data={p} />
        ))}
      </CardRail>
    </section>
  );
}

import { notFound } from 'next/navigation';
import { EndSessionSummary } from '@/components/session/end-session-summary';
import {
  calculateWorldFlightReward,
  getWorldFlightUpgradeState,
  type WorldFlightProgressionRewardResult,
} from '@/lib/world-flight/progression';
import type { ClassLogbookSummary } from '@/lib/class-logbook';

export const dynamic = 'force-dynamic';

type RewardPreviewState = 'progress' | 'reveal' | 'pending';

const PREVIEW_STATES: Array<{ key: RewardPreviewState; label: string; description: string }> = [
  {
    key: 'progress',
    label: 'Progress Only',
    description: 'No reveal. The class still needs more crew stars for the next tier.',
  },
  {
    key: 'reveal',
    label: 'Fresh Unlock',
    description: 'The end screen reveals the new range and starts the aircraft choice.',
  },
  {
    key: 'pending',
    label: 'Choice Pending',
    description: 'The class already unlocked the tier and can choose the aircraft here.',
  },
];

const baseSnapshot = calculateWorldFlightReward(
  [
    { clientId: 'student-1' },
    { clientId: 'student-2' },
    { clientId: 'student-3' },
    { clientId: 'student-4' },
  ],
  [
    { clientId: 'student-1', outcome: 'on-task', accuracyStatus: 'correct', countsForAccuracy: true, countsForLeaderboard: true },
    { clientId: 'student-2', outcome: 'on-task', accuracyStatus: 'correct', countsForAccuracy: true, countsForLeaderboard: true },
    { clientId: 'student-3', outcome: 'on-task', accuracyStatus: 'incorrect', countsForAccuracy: true, countsForLeaderboard: true },
    { clientId: 'student-4', outcome: 'standout', accuracyStatus: 'correct', countsForAccuracy: true, countsForLeaderboard: true },
  ],
);

const classLogbook: ClassLogbookSummary = {
  classId: 'dev-class-world-flight-rewards',
  className: 'Class 5',
  completedFlights: 14,
  totalResponses: 326,
  totalPoints: 1480,
  averageAccuracy: 78,
  bestStreak: 7,
  recentTopics: ['Tokyo transit choices', 'Vancouver housing pressure', 'Honolulu land stewardship'],
  lastTopic: 'Tokyo transit choices',
  lastFlightAt: '2026-07-01T08:00:00.000Z',
};

function rewardFor(state: RewardPreviewState): WorldFlightProgressionRewardResult {
  if (state === 'reveal') {
    const flightHours = 7;
    const crewStars = 8;
    return {
      ...baseSnapshot,
      flightHours,
      crewStars,
      alreadyRecorded: false,
      planeTier: 1,
      planeKey: 'scout-monoplane',
      planeSelectionRequired: false,
      rangeKm: 6800,
      upgradeState: getWorldFlightUpgradeState({
        planeTier: 1,
        rangeKm: 6800,
        flightHours,
        crewStars,
      }),
    };
  }

  if (state === 'pending') {
    const flightHours = 7;
    const crewStars = 8;
    return {
      ...baseSnapshot,
      flightHours,
      crewStars,
      alreadyRecorded: true,
      planeTier: 2,
      planeKey: 'scout-monoplane',
      planeSelectionRequired: true,
      rangeKm: 6800,
      upgradeState: getWorldFlightUpgradeState({
        planeTier: 2,
        rangeKm: 6800,
        flightHours,
        crewStars,
      }),
    };
  }

  const flightHours = 17;
  const crewStars = 6;
  return {
    ...baseSnapshot,
    crewStarsAwarded: 0,
    snapshot: {
      ...baseSnapshot.snapshot,
      everyoneAboardEarned: false,
      strongLandingEarned: false,
    },
    flightHours,
    crewStars,
    alreadyRecorded: false,
    planeTier: 1,
    planeKey: 'scout-monoplane',
    planeSelectionRequired: false,
    rangeKm: 6800,
    upgradeState: getWorldFlightUpgradeState({
      planeTier: 1,
      rangeKm: 6800,
      flightHours,
      crewStars,
    }),
  };
}

export default function WorldFlightRewardsPreviewPage({
  searchParams,
}: {
  searchParams?: { state?: string };
}) {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  const selectedState = PREVIEW_STATES.some((preview) => preview.key === searchParams?.state)
    ? searchParams?.state as RewardPreviewState
    : 'reveal';
  const reward = rewardFor(selectedState);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.18),transparent_36%),#050b16] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">Development QA</p>
        <h1 className="mt-2 text-3xl font-bold">World Flight Rewards Preview</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
          Use this page to audit the class logbook deposit, end-of-lesson progress bars, cloud reveal, and aircraft selection without replaying a real lesson.
        </p>

        <nav className="mt-5 grid gap-3 md:grid-cols-3" aria-label="Reward preview states">
          {PREVIEW_STATES.map((preview) => (
            <a
              key={preview.key}
              href={`/dev/world-flight-rewards?state=${preview.key}`}
              className={`rounded-xl border p-4 transition ${
                preview.key === selectedState
                  ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-50'
                  : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-cyan-300/40 hover:text-cyan-100'
              }`}
            >
              <span className="text-sm font-bold">{preview.label}</span>
              <span className="mt-1 block text-xs leading-relaxed opacity-80">{preview.description}</span>
            </a>
          ))}
        </nav>

        <section className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
          <EndSessionSummary
            classId="dev-class-world-flight-rewards"
            className="Class 5"
            sessionId={`dev-session-${selectedState}`}
            flightCode="LC-REWARD"
            progressionReward={reward}
            classLogbook={classLogbook}
            currentTopic="Recife rivers, bridges, and mangroves"
            previewMode
          />
        </section>
      </div>
    </main>
  );
}

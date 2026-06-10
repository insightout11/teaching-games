import { runScoreEngine, type ScoringProfile } from '@/lib/score-engine';

// Hand-authored data for the explorable sample session ("Explore a sample
// lesson" on /home). Seeds a real, ended session into the teacher's hidden
// demo class so every production surface — leaderboard, end-of-session
// summary, Control Room debrief — renders it natively. Nothing here is
// simulated live; this is scripted theater, deliberately good.

export const SAMPLE_TOPIC = 'Travel & Tourism';
export const SAMPLE_DIFFICULTY = 'Intermediate';
export const SAMPLE_DURATION_MINUTES = 45;

export interface SamplePersona {
  name: string;
  avatarSeed: string;
  /** Fixed UUID so re-seeding upserts cleanly into session_participants. */
  clientId: string;
}

// Five distinct voices: strong/streaky, terse, curious, funny, steady.
export const SAMPLE_STUDENTS: SamplePersona[] = [
  { name: 'Mia',  avatarSeed: 'navigator', clientId: '5a3b1e01-0000-4000-8000-000000000001' },
  { name: 'Leo',  avatarSeed: 'radio',     clientId: '5a3b1e02-0000-4000-8000-000000000002' },
  { name: 'Ava',  avatarSeed: 'starchart', clientId: '5a3b1e03-0000-4000-8000-000000000003' },
  { name: 'Kai',  avatarSeed: 'comet',     clientId: '5a3b1e04-0000-4000-8000-000000000004' },
  { name: 'Noor', avatarSeed: 'beacon',    clientId: '5a3b1e05-0000-4000-8000-000000000005' },
];

export const SAMPLE_ROUNDS = [
  { gameType: 'vocab-sprint',     roundNumber: 1 },
  { gameType: 'would-you-rather', roundNumber: 2 },
  { gameType: 'decision-council', roundNumber: 3 },
] as const;

// Copies of the real plugin scoringProfiles (importing the plugin index files
// would drag their React components into the API route bundle). A unit test
// asserts these stay equal to the registry — see sample-session.test.ts.
export const SAMPLE_PROFILES: Record<string, ScoringProfile> = {
  'vocab-sprint':     { displayMode: 'competitive', supportsOnTask: true,  supportsStandout: true,  tracksAccuracy: true },
  'would-you-rather': { displayMode: 'class',       supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  'decision-council': { displayMode: 'class',       supportsOnTask: true,  supportsStandout: true,  tracksAccuracy: false, defaultOutcome: 'genuine' },
};

export const SAMPLE_SESSION_NOTE = `(Sample lesson — this note shows how your debrief notes work.)

Great energy today. Mia ran a 5-streak in Vocab Sprint — push her toward harder synonyms next time. Leo answers in 3 words; his "window seat, less talking" got the biggest laugh of the lesson, build on that confidence. Ava asked whether "itinerary" works for a single day — nice depth question, worth a follow-up. Kai's beach-week proposal was off-the-wall but he defended it with a real cost argument. Review "accommodation" spelling with the whole group.`;

interface VocabAnswer {
  correct: boolean;
  answer: string;
  streak: number; // streak AFTER this answer
}

// Round 1 — Vocab Sprint (practice, tracks accuracy). Five prompts, target
// words on-topic. Correctness patterns give each persona a readable shape:
// Mia 5/5 with a streak, Leo 3/5, Ava 4/5, Kai 2/5, Noor 4/5.
const VOCAB_PROMPTS = ['itinerary', 'departure', 'scenic', 'accommodation', 'souvenir'];

const VOCAB_MATRIX: Record<string, VocabAnswer[]> = {
  Mia: [
    { correct: true,  answer: 'itinerary',     streak: 1 },
    { correct: true,  answer: 'departure',     streak: 2 },
    { correct: true,  answer: 'scenic',        streak: 3 },
    { correct: true,  answer: 'accommodation', streak: 4 },
    { correct: true,  answer: 'souvenir',      streak: 5 },
  ],
  Leo: [
    { correct: true,  answer: 'itinerary', streak: 1 },
    { correct: false, answer: 'departing', streak: 0 },
    { correct: true,  answer: 'scenic',    streak: 1 },
    { correct: false, answer: 'hotel',     streak: 0 },
    { correct: true,  answer: 'souvenir',  streak: 1 },
  ],
  Ava: [
    { correct: true,  answer: 'itinerary',     streak: 1 },
    { correct: true,  answer: 'departure',     streak: 2 },
    { correct: false, answer: 'beautiful',     streak: 0 },
    { correct: true,  answer: 'accommodation', streak: 1 },
    { correct: true,  answer: 'souvenir',      streak: 2 },
  ],
  Kai: [
    { correct: false, answer: 'plan thing',    streak: 0 },
    { correct: true,  answer: 'departure',     streak: 1 },
    { correct: false, answer: 'nice view',     streak: 0 },
    { correct: false, answer: 'acomodation',   streak: 0 },
    { correct: true,  answer: 'souvenir',      streak: 1 },
  ],
  Noor: [
    { correct: true,  answer: 'itinerary',     streak: 1 },
    { correct: true,  answer: 'departure',     streak: 2 },
    { correct: true,  answer: 'scenic',        streak: 3 },
    { correct: false, answer: 'acommodation',  streak: 0 },
    { correct: true,  answer: 'souvenir',      streak: 1 },
  ],
};

interface ProductionAnswer {
  outcome: 'genuine' | 'on-task' | 'standout';
  text: string;
}

// Round 2 — Would You Rather (production, no right answer).
const WYR_PROMPTS = [
  'Would you rather explore a new city with no map, or follow a perfect itinerary?',
  'Window seat for the views, or aisle seat for the freedom?',
];

// Would You Rather's real profile is pure participation (no on-task/standout),
// so every entry is 'genuine' — the personality lives in the answer text.
const WYR_MATRIX: Record<string, ProductionAnswer[]> = {
  Mia: [
    { outcome: 'genuine', text: 'No map! Getting lost is how you find the best food. Last summer we found a tiny noodle shop that way.' },
    { outcome: 'genuine', text: 'Window seat — I always photograph the wing at sunset.' },
  ],
  Leo: [
    { outcome: 'genuine', text: 'Itinerary. Less stress.' },
    { outcome: 'genuine', text: 'Window seat, less talking.' },
  ],
  Ava: [
    { outcome: 'genuine', text: 'Can I choose both? A loose itinerary with free afternoons — you need a plan to relax inside of.' },
    { outcome: 'genuine', text: 'Aisle. I drink too much water on flights, it is a strategy.' },
  ],
  Kai: [
    { outcome: 'genuine', text: 'No map, because my phone always dies anyway, so it is not really a choice.' },
    { outcome: 'genuine', text: 'Aisle seat so I can pretend the snack cart is for me personally.' },
  ],
  Noor: [
    { outcome: 'genuine', text: 'Itinerary, but I leave one day completely empty for surprises.' },
    { outcome: 'genuine', text: 'Window. Clouds from above never get old.' },
  ],
};

// Round 3 — Decision Council (production; proposals + defence).
const COUNCIL_PROMPTS = [
  'Class trip, one budget: a week at the beach, or three cities in seven days?',
  'Pick ONE thing every traveller should pack — defend it.',
];

const COUNCIL_MATRIX: Record<string, ProductionAnswer[]> = {
  Mia: [
    { outcome: 'genuine',  text: 'Three cities — more museums, more food, more practice ordering in English.' },
    { outcome: 'genuine',  text: 'A power bank. Dead phone means no tickets, no maps, no photos.' },
  ],
  Leo: [
    { outcome: 'on-task',  text: 'Beach. Cities are loud.' },
    { outcome: 'genuine',  text: 'Earplugs. Hostels are louder than cities.' },
  ],
  Ava: [
    { outcome: 'genuine',  text: 'Cities, but by train not plane — the journey between them is part of the trip.' },
    { outcome: 'standout', text: 'A notebook. Photos show what you saw; a notebook remembers what you thought.' },
  ],
  Kai: [
    { outcome: 'standout', text: 'Beach week. Three cities in seven days is just queueing in three languages. Same money, zero stress, and we actually talk to each other.' },
    { outcome: 'genuine',  text: 'Snacks. Hungry friends make bad decisions, I have seen it.' },
  ],
  Noor: [
    { outcome: 'genuine',  text: 'Beach, and we day-trip to one city so nobody loses the argument completely.' },
    { outcome: 'genuine',  text: 'A reusable water bottle — cheap, green, and airports have refill stations now.' },
  ],
};

export interface SampleScoreRow {
  session_id: string;
  student_id: string;
  client_id: string;
  display_name: string;
  points: number;
  streak_count: number;
  streak_bonus: number;
  is_correct: boolean;
  outcome: string;
  accuracy_status: string;
  counts_for_accuracy: boolean;
  counts_for_leaderboard: boolean;
  scoring_version: number;
  prompt_index: number;
  response_data: Record<string, unknown>;
  created_at: string;
}

/**
 * Builds the full hand-authored score set (5 students × 9 prompts = 45 rows).
 * Every row runs through the real runScoreEngine so points/outcome/accuracy
 * match production scoring exactly. created_at is staggered across the
 * session window so timelines read naturally.
 */
export function buildSampleScores(
  sessionId: string,
  studentIdByName: Record<string, string>,
  sessionStart: Date,
): SampleScoreRow[] {
  const rows: SampleScoreRow[] = [];
  // Rough pacing inside the 45-minute lesson: vocab ~min 5–15,
  // would-you-rather ~min 18–28, council ~min 32–42.
  const moduleOffsetsMin = [5, 18, 32];

  const at = (moduleIdx: number, promptIdx: number, studentIdx: number): string => {
    const minutes = moduleOffsetsMin[moduleIdx] + promptIdx * 2;
    const seconds = 10 + studentIdx * 9; // students answer a few seconds apart
    return new Date(sessionStart.getTime() + minutes * 60_000 + seconds * 1_000).toISOString();
  };

  SAMPLE_STUDENTS.forEach((student, studentIdx) => {
    const studentId = studentIdByName[student.name];
    if (!studentId) return;

    const base = {
      session_id: sessionId,
      student_id: studentId,
      client_id: student.clientId,
      display_name: student.name,
      counts_for_leaderboard: true,
    };

    // Round 1 — Vocab Sprint (accuracy-tracked practice)
    VOCAB_MATRIX[student.name].forEach((entry, i) => {
      const result = runScoreEngine({
        isCorrect: entry.correct,
        profile: SAMPLE_PROFILES['vocab-sprint'],
      });
      rows.push({
        ...base,
        points: result.points,
        streak_count: entry.streak,
        streak_bonus: entry.streak === 5 ? 2 : 0,
        is_correct: result.isCorrect,
        outcome: result.outcome,
        accuracy_status: result.accuracyStatus,
        counts_for_accuracy: result.countsForAccuracy,
        scoring_version: result.scoringVersion,
        prompt_index: i + 1,
        response_data: { gameKey: 'vocab-sprint', sample: true, target: VOCAB_PROMPTS[i], answer: entry.answer },
        created_at: at(0, i, studentIdx),
      });
    });

    // Round 2 — Would You Rather (production, no accuracy)
    WYR_MATRIX[student.name].forEach((entry, i) => {
      const result = runScoreEngine({
        isCorrect: null,
        explicitOutcome: entry.outcome,
        profile: SAMPLE_PROFILES['would-you-rather'],
      });
      rows.push({
        ...base,
        points: result.points,
        streak_count: 0,
        streak_bonus: 0,
        is_correct: result.isCorrect,
        outcome: result.outcome,
        accuracy_status: result.accuracyStatus,
        counts_for_accuracy: result.countsForAccuracy,
        scoring_version: result.scoringVersion,
        prompt_index: i + 1,
        response_data: { activityKey: 'would-you-rather', sample: true, prompt: WYR_PROMPTS[i], answer: entry.text },
        created_at: at(1, i, studentIdx),
      });
    });

    // Round 3 — Decision Council (production, standout-capable)
    COUNCIL_MATRIX[student.name].forEach((entry, i) => {
      const result = runScoreEngine({
        isCorrect: null,
        explicitOutcome: entry.outcome,
        profile: SAMPLE_PROFILES['decision-council'],
      });
      rows.push({
        ...base,
        points: result.points,
        streak_count: 0,
        streak_bonus: 0,
        is_correct: result.isCorrect,
        outcome: result.outcome,
        accuracy_status: result.accuracyStatus,
        counts_for_accuracy: result.countsForAccuracy,
        scoring_version: result.scoringVersion,
        prompt_index: i + 1,
        response_data: { activityKey: 'decision-council', sample: true, prompt: COUNCIL_PROMPTS[i], answer: entry.text },
        created_at: at(2, i, studentIdx),
      });
    });
  });

  return rows;
}

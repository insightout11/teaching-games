import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { difficultyDescriptions } from '@/lib/difficulty';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GAME_KEY = 'flash-quiz';
const SCHEMA_VERSION = 1;
const TIMER_SECONDS = 30;

interface QuizQuestion {
  question: string;
  options: string[]; // exactly 4
  correctIndex: number; // 0–3
  explanation: string;
}

// ─── Travel review mode ────────────────────────────────────────────────────
interface TripStop {
  stageId: string;
  text: string;
  vocab?: string[];
}

const TRIP_STOP_LABEL: Record<string, string> = {
  arrival: 'Arrival',
  'getting-there': 'Getting There',
  attraction: 'Out & About',
  'local-table': 'Local Table',
};

// Category-matched distractor pools for the deterministic recall fallback (never blank).
const TRANSPORT_POOL = ['the bus', 'a taxi', 'the train', 'the metro', 'the tram'];
const DISH_POOL = ['a local soup', 'grilled fish', 'a rice dish', 'a noodle dish', 'a pastry'];
const ATTRACTION_POOL = ['the city museum', 'the old cathedral', 'the market square', 'the riverside park', 'the castle'];
const CITY_POOL = ['Paris', 'Tokyo', 'Rome', 'Madrid', 'Berlin', 'Lisbon', 'Dublin'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mcq(question: string, correct: string, pool: string[], explanation: string): QuizQuestion | null {
  const c = correct.trim();
  if (!c) return null;
  const distractors = pool.filter((d) => d.toLowerCase() !== c.toLowerCase()).slice(0, 3);
  if (distractors.length < 3) return null;
  const options = shuffle([c, ...distractors]);
  return { question, options, correctIndex: options.indexOf(c), explanation };
}

/** Parse the city out of a "…into {City}" / "…in {City}" trip-log line. */
function cityFromStops(stops: TripStop[]): string | null {
  for (const s of stops) {
    const m = s.text.match(/\b in(?:to)? ([A-Z][\w' -]+?)\s*$/);
    if (m) return m[1].trim();
  }
  return null;
}

// Deterministic recall quiz from the trip log — topic-aware fallback when AI generation fails.
function buildTripFallback(stops: TripStop[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const byStage = (id: string) => stops.find((s) => s.stageId === id);
  const anchor = (id: string) => byStage(id)?.vocab?.[0]?.trim();

  const city = cityFromStops(stops);
  if (city) {
    const q = mcq('Which city did we explore on this trip?', city, [city, ...CITY_POOL], 'That’s the city the whole trip took place in.');
    if (q) questions.push(q);
  }
  const transport = anchor('getting-there');
  if (transport) {
    const q = mcq('How did we get into the city?', transport, [transport, ...TRANSPORT_POOL], `We took ${transport} into the city.`);
    if (q) questions.push(q);
  }
  const dish = anchor('local-table');
  if (dish) {
    const q = mcq('What did we eat at the local table?', dish, [dish, ...DISH_POOL], `We ordered ${dish}.`);
    if (q) questions.push(q);
  }
  const attraction = anchor('attraction');
  if (attraction) {
    const q = mcq('Which place did we visit while out and about?', attraction, [attraction, ...ATTRACTION_POOL], `We visited ${attraction}.`);
    if (q) questions.push(q);
  }
  return questions;
}

const schema: AISchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
          explanation: { type: 'string' },
        },
        required: ['question', 'options', 'correctIndex', 'explanation'],
      },
    },
  },
  required: ['questions'],
};

const fallbackQuestions: QuizQuestion[] = [
  {
    question: 'Which sentence uses the present perfect correctly?',
    options: [
      'I have seen that movie yesterday.',
      'I have seen that movie before.',
      'I have seen that movie tomorrow.',
      'I seen that movie before.',
    ],
    correctIndex: 1,
    explanation: 'Present perfect uses "have/has + past participle" for experiences without a specific time.',
  },
  {
    question: 'What does "eloquent" mean?',
    options: [
      'Speaking in a loud voice',
      'Using long, complicated words',
      'Expressing ideas clearly and persuasively',
      'Speaking very quickly',
    ],
    correctIndex: 2,
    explanation: '"Eloquent" means fluent and persuasive in speech or writing.',
  },
  {
    question: 'Choose the correct word: "The news __ surprising."',
    options: ['are', 'were', 'is', 'be'],
    correctIndex: 2,
    explanation: '"News" is an uncountable noun and always takes a singular verb ("is").',
  },
  {
    question: 'Which is a synonym for "abundant"?',
    options: ['Scarce', 'Plentiful', 'Ordinary', 'Expensive'],
    correctIndex: 1,
    explanation: '"Abundant" means existing in large quantities — synonym: plentiful.',
  },
  {
    question: 'What is the past tense of "arise"?',
    options: ['Arised', 'Arosen', 'Arose', 'Arisen'],
    correctIndex: 2,
    explanation: '"Arise" is irregular: arise → arose → arisen.',
  },
];

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  // This will hit the AI. Enforce the free-tier weekly cap.
  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  const { topic, difficulty, count = 10, excludeCacheIds = [], sourceMaterial, trip } = await request.json() as {
    topic: string;
    difficulty: Difficulty;
    count?: number;
    excludeCacheIds?: string[];
    sourceMaterial?: SourceMaterial;
    trip?: { stops: TripStop[] };
  };

  // Travel review mode: a fixed 5-question quiz grounded on the trip the class actually took.
  const tripStops = (trip?.stops ?? []).filter((s) => s?.text?.trim());
  const isTrip = tripStops.length > 0;

  const questionCount = isTrip ? 5 : count === 20 ? 20 : 10;
  const variant = String(questionCount);

  // When a lesson has source material (an article/video) OR is a trip review, ground the quiz
  // in it. Generic topic-only content is never served for grounded lessons — so skip the shared
  // topic cache for both reads and writes (mirrors lesson-plan/generate).
  const sourceContext = await resolveSourceContext(sourceMaterial);
  const skipCache = !!sourceMaterial || isTrip;

  try {
    // 1. Check cache first (skipped when grounding in source material)
    const cached = skipCache
      ? null
      : await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds, variant, SCHEMA_VERSION);
    if (cached) {
      const data = cached.content_json as { questions: QuizQuestion[] };
      return NextResponse.json(
        { questions: data.questions, cacheId: cached.id },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

    // 2. Cache miss — generate via AI
    const randomSeed = Math.random().toString(36).substring(7);

    const tripContext = tripStops
      .map((s) => `- ${TRIP_STOP_LABEL[s.stageId] ?? s.stageId}: ${s.text}`)
      .join('\n');

    const prompt = isTrip
      ? `Write ${questionCount} multiple-choice review questions about a language class's trip.

The class just completed this trip together. Their trip log:
${tripContext}

Difficulty: ${difficultyDescriptions[difficulty]}
Timer per question: ${TIMER_SECONDS} seconds
Random seed (for variety): ${randomSeed}

Make MOSTLY recall questions about what THIS class did (which city, how they got into the city, what they saw, what they ate), plus 1–2 light vocabulary questions about the trip's key words (e.g. "What is {a dish}?", "What is {a transport word}?"). Every question must be about — or answerable from — this specific trip.

REQUIREMENTS:
- Exactly 4 answer options per question (labelled in your mind as 0, 1, 2, 3)
- Exactly 1 correct answer — set correctIndex to that option's number (0–3)
- Distractors must be PLAUSIBLE (other real cities/dishes/transport/places), never obvious fillers
- 1-sentence explanation of WHY the correct answer is right (shown after reveal)
- All ${questionCount} questions must be DIFFERENT — no duplicates

Return JSON with a "questions" array in the shape { question, options[4], correctIndex, explanation }.`
      : `Generate ${questionCount} multiple-choice quiz questions for English language learners.

Topic: "${topic}"
Difficulty: ${difficultyDescriptions[difficulty]}
Timer per question: ${TIMER_SECONDS} seconds
Random seed (for variety): ${randomSeed}
${sourceContext}${sourceContext ? '\nEvery question, option, and explanation MUST be answerable from the source material above — test comprehension of what it actually says, not outside general knowledge.\n' : ''}
QUESTION STYLE — adapt to the topic:
- Grammar topics (tenses, conditionals, articles, etc.) → sentence correction or fill-in-the-blank style
- Vocabulary topics (business, academic, travel, etc.) → definition, synonym, or usage-in-context
- General / cultural topics → comprehension or knowledge questions about the topic
- Mixed topics → vary styles across questions for engagement

REQUIREMENTS:
- Exactly 4 answer options per question (labelled in your mind as 0, 1, 2, 3)
- Exactly 1 correct answer — set correctIndex to that option's number (0–3)
- Distractors must be PLAUSIBLE — a student who hasn't fully studied might pick them
- Never use obviously wrong fillers like "purple elephant"
- 1-sentence explanation of WHY the correct answer is right (shown after reveal)
- Questions should be answerable within ${TIMER_SECONDS} seconds
- All ${questionCount} questions must be DIFFERENT — no duplicates

Return JSON:
{
  "questions": [
    {
      "question": "...",
      "options": ["option0", "option1", "option2", "option3"],
      "correctIndex": 0,
      "explanation": "..."
    },
    ...
  ]
}`;

    const data = await generateJSON<{ questions: QuizQuestion[] }>(prompt, schema, {
      temperature: 1.0,
      taskClass: 'content-generation',
    });

    // Validate
    if (!data.questions || data.questions.length < questionCount * 0.8) {
      throw new Error(`Expected ${questionCount} questions, got ${data.questions?.length ?? 0}`);
    }

    for (const q of data.questions) {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error('Each question must have exactly 4 options');
      }
      if (q.correctIndex < 0 || q.correctIndex > 3) {
        throw new Error('correctIndex must be 0–3');
      }
    }

    // Trim to exact count in case AI over-generates
    const questions = data.questions.slice(0, questionCount);

    // 3. Store in cache — but never cache source-grounded content under the
    // shared topic key, or it would leak into non-source sessions on that topic.
    const cacheId = skipCache
      ? null
      : await storeCachedContent(GAME_KEY, topic, difficulty, { questions }, SCHEMA_VERSION, variant);

    return NextResponse.json(
      { questions, cacheId },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error) {
    console.error('[flash-quiz/generate] error:', error);

    // Trip review: never serve the ungrounded topic cache — build a deterministic recall quiz
    // from the trip log instead (topic-aware fallback, never blank).
    if (isTrip) {
      const tripFallback = buildTripFallback(tripStops);
      return NextResponse.json(
        { questions: tripFallback.length > 0 ? tripFallback : fallbackQuestions.slice(0, questionCount), cacheId: null, degraded: true },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

    // Try emergency cache (ignore excludeIds)
    try {
      const emergency = await getCachedContent(GAME_KEY, topic, difficulty, [], variant, SCHEMA_VERSION);
      if (emergency) {
        const data = emergency.content_json as { questions: QuizQuestion[] };
        return NextResponse.json(
          { questions: data.questions, cacheId: emergency.id, degraded: true },
          { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
        );
      }
    } catch { /* cache also failed */ }

    // Final fallback: generic English questions (topic-neutral but language-relevant)
    return NextResponse.json(
      { questions: fallbackQuestions.slice(0, questionCount), cacheId: null, degraded: true },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  }
}

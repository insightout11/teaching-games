import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth } from '@/lib/auth-credits';
import { difficultyDescriptions } from '@/lib/difficulty';

export const dynamic = 'force-dynamic';

const GAME_KEY = 'flash-quiz';
const SCHEMA_VERSION = 1;
const TIMER_SECONDS = 30;

interface QuizQuestion {
  question: string;
  options: string[]; // exactly 4
  correctIndex: number; // 0–3
  explanation: string;
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
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { topic, difficulty, count = 10, excludeCacheIds = [] } = await request.json() as {
    topic: string;
    difficulty: Difficulty;
    count?: number;
    excludeCacheIds?: string[];
  };

  const questionCount = count === 20 ? 20 : 10;
  const variant = String(questionCount);

  try {
    // 1. Check cache first
    const cached = await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds, variant, SCHEMA_VERSION);
    if (cached) {
      const data = cached.content_json as { questions: QuizQuestion[] };
      return NextResponse.json(
        { questions: data.questions, cacheId: cached.id },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

    // 2. Cache miss — generate via AI
    const randomSeed = Math.random().toString(36).substring(7);

    const prompt = `Generate ${questionCount} multiple-choice quiz questions for English language learners.

Topic: "${topic}"
Difficulty: ${difficultyDescriptions[difficulty]}
Timer per question: ${TIMER_SECONDS} seconds
Random seed (for variety): ${randomSeed}

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

    // 3. Store in cache
    const cacheId = await storeCachedContent(GAME_KEY, topic, difficulty, { questions }, SCHEMA_VERSION, variant);

    return NextResponse.json(
      { questions, cacheId },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error) {
    console.error('[flash-quiz/generate] error:', error);

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

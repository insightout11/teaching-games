import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/lib/difficulty';
import { difficultyDescriptions } from '@/lib/difficulty';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth } from '@/lib/auth-credits';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

export interface ZoneBoardQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const GAME_KEY = 'zone-board';
const SCHEMA_VERSION = 1;

const schema: AISchema = {
  type: 'object',
  properties: {
    question: { type: 'string' },
    options: { type: 'array', items: { type: 'string' } },
    correctIndex: { type: 'integer' },
    explanation: { type: 'string' },
  },
  required: ['question', 'options', 'correctIndex', 'explanation'],
};

const FALLBACK_QUESTIONS: ZoneBoardQuestion[] = [
  {
    question: 'Which word is a synonym for "happy"?',
    options: ['Joyful', 'Angry', 'Tired', 'Confused'],
    correctIndex: 0,
    explanation: '"Joyful" means very happy.',
  },
  {
    question: 'Which sentence uses "their" correctly?',
    options: [
      'Their going to the park.',
      'They left their bags here.',
      'Is that there dog?',
      'There coming later.',
    ],
    correctIndex: 1,
    explanation: '"Their" is a possessive pronoun. "They left their bags here" is correct.',
  },
  {
    question: 'What does "enormous" mean?',
    options: ['Very small', 'Very loud', 'Very fast', 'Very large'],
    correctIndex: 3,
    explanation: '"Enormous" means extremely large.',
  },
  {
    question: 'Which is the correct past tense of "go"?',
    options: ['Goed', 'Went', 'Gone', 'Gon'],
    correctIndex: 1,
    explanation: 'The past tense of "go" is "went".',
  },
  {
    question: 'Which word best completes: "She spoke _____ to the crowd."',
    options: ['Confident', 'Confidently', 'Confidence', 'Confiding'],
    correctIndex: 1,
    explanation: 'An adverb ("confidently") modifies the verb "spoke".',
  },
];

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { topic, difficulty, excludeCacheIds = [], sourceMaterial } = await request.json() as {
    topic: string;
    difficulty: Difficulty;
    excludeCacheIds?: string[];
    sourceMaterial?: SourceMaterial;
  };

  // Ground questions in the lesson's source material when one is attached.
  const sourceContext = await resolveSourceContext(sourceMaterial);
  const skipCache = !!sourceMaterial;

  try {
    const cached = skipCache ? null : await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds, undefined, SCHEMA_VERSION);
    if (cached) {
      return NextResponse.json({
        ...(cached.content_json as ZoneBoardQuestion),
        cacheId: cached.id,
      });
    }

    const prompt = `Generate a multiple-choice language question for an English class activity.
Topic: ${topic}. ${difficultyDescriptions[difficulty]}.
${sourceContext}${sourceContext ? 'The question MUST be answerable from the source material above and test understanding of what it actually says.\n' : ''}
Provide exactly one question with exactly 4 answer options (index 0–3), one clearly correct answer, and a brief one-sentence explanation of why it's correct.

Mix question types across requests: vocabulary meaning, grammar correction, sentence completion, contextual usage, or word choice.
All 4 options must be plausible. Distractors should be genuinely tempting (common mistakes or close alternatives), not obviously wrong.
Keep the question concise (one sentence). Make it directly related to the topic.`;

    const data = await generateJSON<ZoneBoardQuestion>(prompt, schema, { taskClass: 'content-generation' });

    const cacheId = skipCache ? null : await storeCachedContent(GAME_KEY, topic, difficulty, data, SCHEMA_VERSION);

    return NextResponse.json({ ...data, cacheId });
  } catch {
    const fallback = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
    return NextResponse.json({ ...fallback, cacheId: null });
  }
}

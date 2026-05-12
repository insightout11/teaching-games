import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/stores/session-store';
import type { Topic } from '@/stores/session-store';
import { requireAuth } from '@/lib/auth-credits';
import { difficultyDescriptions } from '@/lib/difficulty';

export const dynamic = 'force-dynamic';

interface SpeakingResult { question: string }
interface WrittenResult { question: string; options: string[]; correctIndex: number }
type GenerateResult = SpeakingResult | WrittenResult;

const speakingSchema: AISchema = {
  type: 'object',
  properties: {
    question: { type: 'string' },
  },
  required: ['question'],
};

const writtenSchema: AISchema = {
  type: 'object',
  properties: {
    question:     { type: 'string' },
    options:      { type: 'array', items: { type: 'string' } },
    correctIndex: { type: 'number' },
  },
  required: ['question', 'options', 'correctIndex'],
};

const SPEAKING_ANGLES = [
  'a personal experience or memory related to the topic',
  'a comparison between two aspects, options, or viewpoints',
  'a problem you might face and how you would solve it',
  'the pros and cons of something related to the topic',
  'a prediction or hypothetical future scenario',
  'an opinion you would defend and why',
  'a step-by-step explanation of a process',
  'a recommendation with at least two reasons',
  'what advice you would give someone new to the topic',
  'how the topic affects daily life',
];

function speakingPromptSuffix(): string {
  const angle = SPEAKING_ANGLES[Math.floor(Math.random() * SPEAKING_ANGLES.length)];
  return `The question must focus on: ${angle}.

It must:
- Require 2–3 spoken sentences to answer fully
- Not be answerable with a single yes or no

Return JSON: { "question": "..." }`;
}

const WRITTEN_ANGLES = [
  'vocabulary in context — a fill-in-the-blank with the correct word or phrase',
  'grammar in use — identify the grammatically correct sentence or completion',
  'topic knowledge — a factual question where all 4 options are closely related',
  'meaning — choose the best definition or paraphrase of a word or phrase from the topic',
  'word choice — which word fits the meaning and register of the sentence correctly',
  'cause and effect — what best explains why something happens related to the topic',
  'inference — what can logically be concluded from a short scenario',
  'collocation — which word or phrase naturally pairs with a key term from the topic',
  'error correction — which option correctly fixes or completes a sentence with a common learner mistake',
  'function — choose the sentence that best achieves a communicative goal related to the topic',
];

function writtenPromptSuffix(): string {
  const angle = WRITTEN_ANGLES[Math.floor(Math.random() * WRITTEN_ANGLES.length)];
  return `Question type: ${angle}.

Create a multiple choice question with exactly 4 options at the stated language level.
- The correct answer must genuinely require knowledge at this level — not obvious common sense
- The 3 wrong options must be plausible: things a learner at this level might realistically confuse with the correct answer
- Never use distractors that are trivially false (e.g. "It was invented last year", "It only exists in one country")
- All 4 options should be similar in length and grammatical form

Return JSON:
{
  "question": "...",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctIndex": 0
}
correctIndex is the 0-based index of the correct option (0–3).`;
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { topic, difficulty, qType } = await request.json() as {
    topic: Topic;
    difficulty: Difficulty;
    qType: 'speaking' | 'written';
  };

  try {
    const randomSeed = Math.random().toString(36).substring(7);
    const prompt = `Generate one classroom question about "${topic}" for ESL learners.

Language level: ${difficultyDescriptions[difficulty]}
Random seed: ${randomSeed}

${qType === 'speaking' ? speakingPromptSuffix() : writtenPromptSuffix()}

No preamble, no numbering.`;

    const schema = qType === 'speaking' ? speakingSchema : writtenSchema;
    const data = await generateJSON<GenerateResult>(prompt, schema, {
      temperature: 1.0,
      taskClass: 'content-generation',
    });

    if (!data.question || typeof data.question !== 'string' || data.question.trim().length < 5) {
      throw new Error('Invalid question generated');
    }

    if (qType === 'written') {
      const wr = data as WrittenResult;
      if (!Array.isArray(wr.options) || wr.options.length !== 4) throw new Error('Invalid MC options');
      if (typeof wr.correctIndex !== 'number' || wr.correctIndex < 0 || wr.correctIndex > 3) {
        throw new Error('Invalid correctIndex');
      }
      return NextResponse.json(
        {
          question: data.question.trim(),
          options: wr.options.map((o) => String(o).trim()),
          correctIndex: wr.correctIndex,
        },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

    return NextResponse.json(
      { question: data.question.trim() },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error) {
    console.error('[sector-strike/generate] error:', error);

    if (qType === 'written') {
      return NextResponse.json(
        {
          question: `Which of the following is true about ${topic}?`,
          options: [
            `It is commonly studied and discussed`,
            `It has no real-world applications`,
            `It was invented last year`,
            `It only exists in one country`,
          ],
          correctIndex: 0,
          degraded: true,
        },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

    return NextResponse.json(
      {
        question: `What do you know about ${topic}? Share at least two ideas.`,
        degraded: true,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  }
}

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

const speakingPromptSuffix = `The question must:
- Require 2–3 spoken sentences to answer fully
- Ask for an opinion, description, comparison, or explanation
- Not be answerable with a single yes or no

Return JSON: { "question": "..." }`;

const writtenPromptSuffix = `Create a multiple choice question with exactly 4 options. One must be clearly correct; the others must be plausible distractors related to the topic.

Return JSON:
{
  "question": "...",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctIndex": 0
}
correctIndex is the 0-based index of the correct option (0–3).`;

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

${qType === 'speaking' ? speakingPromptSuffix : writtenPromptSuffix}

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

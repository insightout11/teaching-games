import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/stores/session-store';
import type { Topic } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth } from '@/lib/auth-credits';
import { difficultyDescriptions } from '@/lib/difficulty';

export const dynamic = 'force-dynamic';

const GAME_KEY = 'sector-strike';
const SCHEMA_VERSION = 2;

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

  const { topic, difficulty, qType, seenCacheIds } = await request.json() as {
    topic: Topic;
    difficulty: Difficulty;
    qType: 'speaking' | 'written';
    seenCacheIds?: string[];
  };

  try {
    const cached = await getCachedContent(GAME_KEY, topic, difficulty, seenCacheIds ?? [], qType, SCHEMA_VERSION);
    if (cached) {
      return NextResponse.json(
        { ...cached.content_json, cacheId: cached.id },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

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
      const payload = {
        question: data.question.trim(),
        options: wr.options.map((o) => String(o).trim()),
        correctIndex: wr.correctIndex,
      };
      const cacheId = await storeCachedContent(GAME_KEY, topic, difficulty, payload, SCHEMA_VERSION, qType);
      return NextResponse.json(
        { ...payload, cacheId },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

    const payload = { question: data.question.trim() };
    const cacheId = await storeCachedContent(GAME_KEY, topic, difficulty, payload, SCHEMA_VERSION, qType);
    return NextResponse.json(
      { ...payload, cacheId },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error) {
    console.error('[sector-strike/generate] error:', error);

    try {
      const emergency = await getCachedContent(GAME_KEY, topic, difficulty, [], qType, SCHEMA_VERSION);
      if (emergency) {
        return NextResponse.json(
          { ...emergency.content_json, cacheId: emergency.id, degraded: true },
          { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
        );
      }
    } catch { /* cache also failed */ }

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
          cacheId: null,
          degraded: true,
        },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

    return NextResponse.json(
      {
        question: `What do you know about ${topic}? Share at least two ideas.`,
        cacheId: null,
        degraded: true,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  }
}

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
const SCHEMA_VERSION = 1;

const schema: AISchema = {
  type: 'object',
  properties: {
    question: { type: 'string' },
  },
  required: ['question'],
};

const speakingPromptSuffix = `The question must:
- Require 2–3 spoken sentences to answer fully
- Ask for an opinion, description, comparison, or explanation
- Not be answerable with a single yes or no`;

const writtenPromptSuffix = `The question must:
- Be answerable in 1–2 written sentences
- Have a clear focus that a student can address directly
- Not require spoken output`;

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { topic, difficulty, qType } = await request.json() as {
    topic: Topic;
    difficulty: Difficulty;
    qType: 'speaking' | 'written';
  };

  try {
    const cached = await getCachedContent(GAME_KEY, topic, difficulty, [], qType);
    if (cached) {
      const { question } = cached.content_json as { question: string };
      return NextResponse.json(
        { question, cacheId: cached.id },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

    const randomSeed = Math.random().toString(36).substring(7);
    const prompt = `Generate one classroom question about "${topic}" for ESL learners.

Language level: ${difficultyDescriptions[difficulty]}
Question type: ${qType}
Random seed: ${randomSeed}

${qType === 'speaking' ? speakingPromptSuffix : writtenPromptSuffix}

Return JSON: { "question": "..." }
One question only. No preamble, no numbering.`;

    const data = await generateJSON<{ question: string }>(prompt, schema, {
      temperature: 1.0,
      taskClass: 'content-generation',
    });

    if (!data.question || typeof data.question !== 'string' || data.question.trim().length < 5) {
      throw new Error('Invalid question generated');
    }

    const cacheId = await storeCachedContent(
      GAME_KEY,
      topic,
      difficulty,
      { question: data.question.trim() },
      SCHEMA_VERSION,
      qType,
    );

    return NextResponse.json(
      { question: data.question.trim(), cacheId },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error) {
    console.error('[sector-strike/generate] error:', error);

    try {
      const emergency = await getCachedContent(GAME_KEY, topic, difficulty, [], qType);
      if (emergency) {
        const { question } = emergency.content_json as { question: string };
        return NextResponse.json(
          { question, cacheId: emergency.id, degraded: true },
          { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
        );
      }
    } catch { /* cache also failed */ }

    const fallback =
      qType === 'speaking'
        ? `What do you know about ${topic}? Share at least two ideas.`
        : `Write one sentence that describes something important about ${topic}.`;

    return NextResponse.json(
      { question: fallback, cacheId: null, degraded: true },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-credits';
import type { Difficulty } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { storySprintStarterFallback } from '@/lib/fallback-content';

const GAME_KEY = 'story-sprint';
const SCHEMA_VERSION = 1;

const difficultyLevels: Record<Difficulty, string> = {
  'Beginner': 'A1 beginner — use simple words and short sentences',
  'Easy': 'A2 elementary — use basic vocabulary and simple structure',
  'Intermediate': 'B1/B2 intermediate — use varied vocabulary and engaging detail',
  'Advanced': 'C1 advanced — use sophisticated language and vivid imagery',
  'Expert': 'C2/Native expert — use masterful prose with rich detail',
};

const schema: AISchema = {
  type: 'object',
  properties: {
    starterSentence: { type: 'string' },
  },
  required: ['starterSentence'],
};

export async function POST(request: NextRequest) {
  const { topic, difficulty, excludeCacheIds = [] } = await request.json() as {
    topic: string;
    difficulty: Difficulty;
    excludeCacheIds?: string[];
  };

  try {
    // 1. Check cache first
    const cached = await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds);
    if (cached) {
      return NextResponse.json({ ...cached.content_json, cacheId: cached.id });
    }

    // 2. Cache miss — generate via AI
    const prompt = `Generate an engaging opening sentence for a collaborative story about "${topic}".
The sentence should hook readers and give students a clear direction to continue.
Write at ${difficultyLevels[difficulty]} level.
Keep it to exactly ONE sentence (15-30 words). Do not end the story — leave it open for continuation.`;

    const parsed = await generateJSON<{ starterSentence: string }>(prompt, schema, { taskClass: 'content-generation' });

    // 3. Store in cache for future sessions
    const cacheId = await storeCachedContent(GAME_KEY, topic, difficulty, parsed, SCHEMA_VERSION);

    return NextResponse.json({ ...parsed, cacheId });
  } catch (error) {
    console.error('Starter generation error:', error);
    try {
      const emergency = await getCachedContent(GAME_KEY, topic, difficulty);
      if (emergency) {
        return NextResponse.json({ ...emergency.content_json, cacheId: emergency.id, degraded: true });
      }
    } catch { /* cache also failed */ }
    return NextResponse.json({
      ...storySprintStarterFallback(topic),
      cacheId: null,
      degraded: true,
    });
  }
}

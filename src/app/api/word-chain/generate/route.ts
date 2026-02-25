import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';

const GAME_KEY = 'word-chain';
const SCHEMA_VERSION = 1;

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very common, simple words.',
  'Easy': 'Easy (A2) level. Use simple, everyday words.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common vocabulary.',
  'Advanced': 'Advanced (C1) level. Use more sophisticated words.',
  'Expert': 'Expert (C2/Native) level. Use advanced vocabulary.'
};

const schema: AISchema = {
  type: 'object',
  properties: {
    startingWord: { type: 'string' },
    hint: { type: 'string' }
  },
  required: ['startingWord', 'hint']
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty, excludeCacheIds = [] } = await request.json() as {
      topic: Topic;
      difficulty: Difficulty;
      excludeCacheIds?: string[];
    };

    // 1. Check cache first
    const cached = await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds);
    if (cached) {
      return NextResponse.json({ ...cached.content_json, cacheId: cached.id });
    }

    // 2. Cache miss — generate via AI
    const prompt = `Generate a starting word for a word association chain game at ${difficultyPrompts[difficulty]}
Topic: ${topic}.

Choose a starting word that:
1. Has MANY possible associations (at least 10+ related concepts)
2. Is appropriate for ${difficulty} level
3. Relates to the ${topic} topic
4. Is a concrete noun or common concept (easier to associate)

Also provide a short hint about the type of associations expected (max 8 words).

Good starting words have rich associations: ocean, music, family, city, food, technology, nature, etc.`;

    const data = await generateJSON<{ startingWord: string; hint: string }>(prompt, schema, { taskClass: 'content-generation' });

    // 3. Store in cache for future sessions
    const cacheId = await storeCachedContent(GAME_KEY, topic, difficulty, data, SCHEMA_VERSION);

    return NextResponse.json({ ...data, cacheId });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate starting word' },
      { status: 500 }
    );
  }
}

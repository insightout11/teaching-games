import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic';

const GAME_KEY = 'synonym-showdown';
const SCHEMA_VERSION = 1;

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very common, basic words.',
  'Easy': 'Easy (A2) level. Use simple, everyday vocabulary.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common vocabulary.',
  'Advanced': 'Advanced (C1) level. Use sophisticated vocabulary.',
  'Expert': 'Expert (C2/Native) level. Use nuanced, academic vocabulary.'
};

const schema: AISchema = {
  type: 'object',
  properties: {
    targetWord: { type: 'string' },
    contextSentence: { type: 'string' },
    hint: { type: 'string' }
  },
  required: ['targetWord', 'contextSentence', 'hint']
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty, seenItems = [], excludeCacheIds = [] } = await request.json() as {
      topic: Topic;
      difficulty: Difficulty;
      seenItems?: string[];       // targetWords seen this session — AI avoids repeating them
      excludeCacheIds?: string[]; // cache entry IDs already served this session
    };

    // 1. Check cache first (zero AI latency when hit)
    const cached = await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds);
    if (cached) {
      return NextResponse.json(
        { ...cached.content_json, cacheId: cached.id },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

    // 2. Cache miss — build exclusion hint for AI prompt
    const exclusionNote = seenItems.length > 0
      ? `\nIMPORTANT: Do NOT use these target words that were recently shown this session: ${seenItems.join(', ')}. Choose a different word.\n`
      : '';

    const prompt = `Generate a synonym challenge for ${difficultyPrompts[difficulty]}
Topic: ${topic}.
${exclusionNote}
Create:
1. A target word that has MANY possible synonyms (at least 5-10 valid alternatives)
2. A context sentence using that word, showing its meaning clearly
3. A short hint about the CONTEXT or FEELING, NOT listing synonyms (max 8 words)

Requirements:
- Choose a DIFFERENT word each time - be creative and varied!
- Choose a word with rich synonym options (adjectives and verbs work best)
- The context should make the word's specific meaning clear
- Avoid words with only 1-2 synonyms
- For ${difficulty} level, the word should be appropriately challenging
- CRITICAL: The hint must NEVER include actual synonyms! Instead, hint at the emotion, context, or part of speech.
  BAD hint: "Synonyms for 'start' or 'activate'" (gives away answers!)
  GOOD hint: "Think about actions with machines"
  GOOD hint: "Consider formal alternatives"
  GOOD hint: "How would you describe this feeling?"

Good target words have many alternatives: happy, big, said, walk, good, bad, nice, important, beautiful, fast, etc.`;

    const data = await generateJSON<{ targetWord: string; contextSentence: string; hint: string }>(prompt, schema, { temperature: 1.2, taskClass: 'content-generation' });

    // 3. Store in cache for future sessions
    const cacheId = await storeCachedContent(GAME_KEY, topic, difficulty, data, SCHEMA_VERSION);

    return NextResponse.json(
      { ...data, cacheId },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { sentenceScrambleFallback } from '@/lib/fallback-content';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

export const dynamic = 'force-dynamic';

const GAME_KEY = 'sentence-scramble';
const SCHEMA_VERSION = 1;

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use 4-5 very common words per sentence.',
  'Easy': 'Easy (A2) level. Use 5-6 simple, everyday words per sentence.',
  'Intermediate': 'Intermediate (B1/B2) level. Use 7-9 words per sentence with varied structure.',
  'Advanced': 'Advanced (C1) level. Use 9-12 words per sentence with complex grammar.',
  'Expert': 'Expert (C2/Native) level. Use 10-14 words per sentence with sophisticated structures.',
};

const schema: AISchema = {
  type: 'object',
  properties: {
    sentences: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['sentences'],
};

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const { topic, difficulty, excludeCacheIds = [], sourceMaterial } = await request.json() as {
    topic: Topic;
    difficulty: Difficulty;
    excludeCacheIds?: string[];
    sourceMaterial?: SourceMaterial;
  };

  // Ground the sentences in the lesson's source material when one is attached.
  const sourceContext = await resolveSourceContext(sourceMaterial);
  const skipCache = !!sourceMaterial;

  try {
    // 1. Check cache first (skipped when grounding in source material)
    const cached = skipCache ? null : await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds);
    if (cached) {
      return NextResponse.json(
        { ...cached.content_json, cacheId: cached.id },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

    // Cache miss — this will hit the AI. Enforce the free-tier weekly cap.
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    // 2. Cache miss — generate via AI
    const randomSeed = Math.random().toString(36).substring(7);

    const prompt = `Generate 10 sentences for a "Sentence Scramble" language learning game.

Difficulty: ${difficultyPrompts[difficulty]}
Topic: ${topic}
Random seed: ${randomSeed}
${sourceContext}${sourceContext ? 'Base the sentences on facts, ideas, and vocabulary from the source material above so they reinforce the lesson content.\n' : ''}
Requirements:
- Each sentence MUST relate to the topic "${topic}"
- Each sentence must be grammatically complete and properly punctuated
- Vary sentence structures (declarative, questions, conditionals, etc.)
- Do NOT repeat sentence patterns or openings
- Each sentence should be self-contained and make sense on its own
- Use natural, authentic language — not textbook-stilted
- Generate DIFFERENT sentences each time — be creative!

For sentences where more than one word order is grammatically valid (e.g. adverbs of frequency like "often", "usually", "always" that can appear before or after the main verb), include those alternatives in "sentenceAlternatives" — a map from the canonical sentence to an array of alternative valid orderings. Only include entries where genuine alternatives exist; omit sentences that have only one correct order.
Example: { "She always drinks coffee in the morning.": ["She drinks coffee in the morning always.", "Always she drinks coffee in the morning."] }`;

    const data = await generateJSON<{ sentences: string[] }>(prompt, schema, { temperature: 1.2, taskClass: 'content-generation' });

    // 3. Store in cache for future sessions (never cache source-grounded content)
    const cacheId = skipCache ? null : await storeCachedContent(GAME_KEY, topic, difficulty, data, SCHEMA_VERSION);

    return NextResponse.json(
      { ...data, cacheId },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error) {
    console.error('Sentence scramble generate error:', error);
    try {
      const emergency = await getCachedContent(GAME_KEY, topic, difficulty);
      if (emergency) {
        return NextResponse.json(
          { ...emergency.content_json, cacheId: emergency.id, degraded: true },
          { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
        );
      }
    } catch { /* cache also failed */ }
    return NextResponse.json({
      ...sentenceScrambleFallback(topic),
      cacheId: null,
      degraded: true,
    });
  }
}

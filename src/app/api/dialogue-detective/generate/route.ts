import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth } from '@/lib/auth-credits';
import { dialogueDetectiveFallback } from '@/lib/fallback-content';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

const GAME_KEY = 'dialogue-detective';
const SCHEMA_VERSION = 1;

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very simple, short dialogue.',
  'Easy': 'Easy (A2) level. Use simple everyday conversation.',
  'Intermediate': 'Intermediate (B1/B2) level. Use natural conversation.',
  'Advanced': 'Advanced (C1) level. Use nuanced, contextual dialogue.',
  'Expert': 'Expert (C2/Native) level. Use sophisticated, idiomatic conversation.'
};

const schema: AISchema = {
  type: 'object',
  properties: {
    speakerA_before: { type: 'string' },
    speakerA_after: { type: 'string' },
    context: { type: 'string' },
    goal: { type: 'string' }
  },
  required: ['speakerA_before', 'speakerA_after', 'context', 'goal']
};

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { topic, difficulty, excludeCacheIds = [], sourceMaterial } = await request.json() as {
    topic: Topic;
    difficulty: Difficulty;
    excludeCacheIds?: string[];
    sourceMaterial?: SourceMaterial;
  };

  // Ground the dialogue's setting/topic in the lesson's source material when attached.
  const sourceContext = await resolveSourceContext(sourceMaterial);
  const skipCache = !!sourceMaterial;

  try {
    // 1. Check cache first (skipped when grounding in source material)
    const cached = skipCache ? null : await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds);
    if (cached) {
      return NextResponse.json({ ...cached.content_json, cacheId: cached.id });
    }

    // 2. Cache miss — generate via AI
    const prompt = `Generate a dialogue puzzle for ${difficultyPrompts[difficulty]}
Topic: ${topic}.
${sourceContext}${sourceContext ? 'Set the conversation in a context drawn from the source material above, using its situations and vocabulary.\n' : ''}
Create a 3-line conversation where:
- Speaker A says something (line 1)
- Speaker B responds (line 2) - THIS IS THE BLANK the student fills in
- Speaker A replies to B's response (line 3)

The student must figure out what B said that would:
1. Make sense as a response to line 1
2. Naturally lead to line 3

Provide:
- speakerA_before: What A says first
- speakerA_after: What A says after B's response
- context: Brief setting (e.g., "At a restaurant", "Job interview")
- goal: What B needs to accomplish (e.g., "Ask for directions", "Decline politely")

Requirements:
- The conversation should be natural and realistic
- B's response should be inferable from context
- There should be multiple valid ways to fill the blank
- The dialogue should relate to ${topic}
- Appropriate complexity for ${difficulty} level`;

    const data = await generateJSON<{ speakerA_before: string; speakerA_after: string; context: string; goal: string }>(prompt, schema, { taskClass: 'content-generation' });

    const result = {
      speakerA_before: data.speakerA_before,
      speakerA_after: data.speakerA_after,
      context: data.context,
      goal: data.goal,
    };

    // 3. Store in cache for future sessions (never cache source-grounded content)
    const cacheId = skipCache ? null : await storeCachedContent(GAME_KEY, topic, difficulty, result, SCHEMA_VERSION);

    return NextResponse.json({ ...result, cacheId });
  } catch (error) {
    console.error('Generate error:', error);
    try {
      const emergency = await getCachedContent(GAME_KEY, topic, difficulty);
      if (emergency) {
        return NextResponse.json({ ...emergency.content_json, cacheId: emergency.id, degraded: true });
      }
    } catch { /* cache also failed */ }
    return NextResponse.json({
      ...dialogueDetectiveFallback(topic),
      cacheId: null,
      degraded: true,
    });
  }
}

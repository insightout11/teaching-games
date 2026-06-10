import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import { GrammarTarget } from '@/games/grammar-boss/types';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import { grammarBossFallback } from '@/lib/fallback-content';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

const GAME_KEY = 'grammar-boss';
const SCHEMA_VERSION = 1;

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very simple sentence structures.',
  'Easy': 'Easy (A2) level. Use simple but functional sentence patterns.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common sentence structures.',
  'Advanced': 'Advanced (C1) level. Use complex, nuanced sentence structures.',
  'Expert': 'Expert (C2/Native) level. Use sophisticated, academic structures.'
};

const schema: AISchema = {
  type: 'object',
  properties: {
    task: { type: 'string' },
    exampleSentence: { type: 'string' }
  },
  required: ['task', 'exampleSentence']
};

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuthForGeneration({ requestHasProModules: true });
  if (authError) return authError;

  const { grammarTarget, topic, difficulty, excludeCacheIds = [], sourceMaterial } = await request.json() as {
    grammarTarget: GrammarTarget;
    topic: Topic;
    difficulty: Difficulty;
    excludeCacheIds?: string[];
    sourceMaterial?: SourceMaterial;
  };

  // Ground the speaking task in the lesson's source material when one is attached.
  const sourceContext = await resolveSourceContext(sourceMaterial);
  const skipCache = !!sourceMaterial;

  try {
    // 1. Check cache first — variant = grammarTarget to scope cache per grammar structure
    const cached = skipCache ? null : await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds, grammarTarget);
    if (cached) {
      return NextResponse.json({ ...cached.content_json, cacheId: cached.id });
    }

    // 2. Cache miss — generate via AI
    const prompt = `Generate a short speaking challenge for an English learner at ${difficultyPrompts[difficulty]}
Topic: ${topic}. The task MUST be directly about this topic — do not use a generic or unrelated scenario.
Target Grammar: ${grammarTarget}.
${sourceContext}${sourceContext ? 'Base the speaking task and example sentence on the situations and content of the source material above.\n' : ''}

Provide:
1. A concise, engaging speaking task (1-2 sentences) appropriate for a ${difficulty} level student that naturally requires the target grammar (${grammarTarget}).
2. A perfect example sentence using the target grammar correctly, tailored to the ${difficulty} level complexity.

The task should prompt the student to speak about the given topic while using the specified grammar structure.`;

    const data = await generateJSON<{ task: string; exampleSentence: string }>(prompt, schema, { taskClass: 'content-generation' });

    const result = {
      task: data.task || 'Speak about your recent experiences.',
      exampleSentence: data.exampleSentence || 'I have been working on this project for three months.'
    };

    // 3. Store in cache — variant = grammarTarget (never cache source-grounded content)
    const cacheId = skipCache ? null : await storeCachedContent(GAME_KEY, topic, difficulty, result, SCHEMA_VERSION, grammarTarget);

    return NextResponse.json({ ...result, cacheId });
  } catch (error) {
    console.error('Generate error:', error);
    try {
      const emergency = await getCachedContent(GAME_KEY, topic, difficulty, undefined, grammarTarget);
      if (emergency) {
        return NextResponse.json({ ...emergency.content_json, cacheId: emergency.id, degraded: true });
      }
    } catch { /* cache also failed */ }
    return NextResponse.json({
      ...grammarBossFallback(topic),
      cacheId: null,
      degraded: true,
    });
  }
}

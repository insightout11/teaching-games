import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { errorHunterFallback } from '@/lib/fallback-content';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

export const maxDuration = 60;

const GAME_KEY = 'error-hunter';
const SCHEMA_VERSION = 1;

const difficultyConfig: Record<Difficulty, { errors: number; description: string }> = {
  'Beginner': { errors: 2, description: 'Beginner (A1) level. Use very simple sentences with obvious spelling/grammar errors.' },
  'Easy': { errors: 3, description: 'Easy (A2) level. Use simple sentences with basic grammar errors.' },
  'Intermediate': { errors: 4, description: 'Intermediate (B1/B2) level. Use standard sentences with grammar and word choice errors.' },
  'Advanced': { errors: 4, description: 'Advanced (C1) level. Use complex sentences with subtle grammar errors.' },
  'Expert': { errors: 5, description: 'Expert (C2/Native) level. Use sophisticated sentences with nuanced errors.' }
};

const schema: AISchema = {
  type: 'object',
  properties: {
    paragraph: { type: 'string' },
    errorCount: { type: 'integer' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          position: { type: 'integer' },
          word: { type: 'string' },
          errorType: { type: 'string' },
          correction: { type: 'string' }
        },
        required: ['position', 'word', 'errorType', 'correction']
      }
    }
  },
  required: ['paragraph', 'errorCount', 'errors']
};

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const { topic, difficulty, excludeCacheIds = [], grammarTarget, sourceMaterial } = await request.json() as {
    topic: Topic;
    difficulty: Difficulty;
    excludeCacheIds?: string[];
    grammarTarget?: string;
    sourceMaterial?: SourceMaterial;
  };

  // Ground the paragraph in the lesson's source material when one is attached.
  const sourceContext = await resolveSourceContext(sourceMaterial);
  const skipCache = !!sourceMaterial || !!grammarTarget;

  try {
    // 1. Check cache — skip when grammarTarget or source material is set (live content needed)
    if (!skipCache) {
      const cached = await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds);
      if (cached) {
        const c = cached.content_json as { paragraph: string; errorCount: number; _errors: unknown[] };
        return NextResponse.json({
          paragraph: c.paragraph,
          errorCount: c.errorCount,
          _errors: c._errors,
          cacheId: cached.id,
        });
      }
    }

    // Cache miss — this will hit the AI. Enforce the free-tier weekly cap.
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    // 2. Cache miss — generate via AI
    const config = difficultyConfig[difficulty];

    const grammarFocusBlock = grammarTarget
      ? `GRAMMAR FOCUS: All errors MUST be ${grammarTarget} errors. Do not include spelling errors or other error types — only errors related to ${grammarTarget}.`
      : `Error types to include (mix them):
- Spelling errors (e.g., "recieve" instead of "receive")
- Subject-verb agreement (e.g., "he go" instead of "he goes")
- Wrong tense (e.g., "Yesterday I go" instead of "Yesterday I went")
- Wrong word form (e.g., "beautiful" instead of "beautifully")
- Article errors (e.g., "a apple" instead of "an apple")
- Preposition errors (e.g., "good in" instead of "good at")`;

    const prompt = `Generate a paragraph with exactly ${config.errors} intentional errors for ${config.description}
Topic: ${topic}.
${sourceContext}${sourceContext ? 'Base the paragraph on facts and ideas from the source material above so students proofread content from the lesson.\n' : ''}
Create a 3-4 sentence paragraph about ${topic} that contains exactly ${config.errors} errors.

${grammarFocusBlock}

Requirements:
- Include exactly ${config.errors} errors, spread across the paragraph
- Each error should be a single word that needs fixing
- The paragraph should make sense (errors aside)
- Position is the word index (0-based) in the paragraph
- Include the incorrect word and the correct version

Return the paragraph with errors embedded, plus an array of error details.`;

    const data = await generateJSON<{ paragraph: string; errorCount: number; errors: Array<{ position: number; word: string; errorType: string; correction: string }> }>(prompt, schema, { taskClass: 'content-generation' });

    const result = {
      paragraph: data.paragraph,
      errorCount: data.errorCount,
      _errors: data.errors, // Stored for evaluation
    };

    // 3. Store in cache for future sessions — never cache grammar-targeted or
    // source-grounded content under the shared topic key.
    const cacheId = skipCache ? null : await storeCachedContent(GAME_KEY, topic, difficulty, result, SCHEMA_VERSION);

    return NextResponse.json({ ...result, cacheId });
  } catch (error) {
    console.error('Generate error:', error);
    try {
      const emergency = await getCachedContent(GAME_KEY, topic, difficulty);
      if (emergency) {
        const c = emergency.content_json as { paragraph: string; errorCount: number; _errors: unknown[] };
        return NextResponse.json({
          paragraph: c.paragraph, errorCount: c.errorCount, _errors: c._errors,
          cacheId: emergency.id, degraded: true,
        });
      }
    } catch { /* cache also failed */ }
    return NextResponse.json({
      ...errorHunterFallback(topic),
      cacheId: null,
      degraded: true,
    });
  }
}

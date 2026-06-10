import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { synonymShowdownFallback } from '@/lib/fallback-content';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

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
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const { topic, difficulty, seenItems = [], excludeCacheIds = [], seenSynonyms = [], sourceMaterial } = await request.json() as {
    topic: Topic;
    difficulty: Difficulty;
    seenItems?: string[];       // targetWords seen this session — AI avoids repeating them
    excludeCacheIds?: string[]; // cache entry IDs already served this session
    seenSynonyms?: string[];    // valid synonyms students already used — AI avoids same cluster
    sourceMaterial?: SourceMaterial;
  };

  // Ground the challenge in the lesson's source material when one is attached.
  // Source-grounded content is never served from (or written to) the shared
  // topic cache, so it can't leak into non-source sessions on the same topic.
  const sourceContext = await resolveSourceContext(sourceMaterial);
  const skipCache = !!sourceMaterial;

  try {
    // 1. Check cache first (zero AI latency when hit)
    const cached = skipCache ? null : await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds);
    // Skip cached entry if its targetWord was already shown (prevents synonymous words from cache)
    if (cached && !seenItems.includes((cached.content_json.targetWord ?? '').toLowerCase())) {
      return NextResponse.json(
        { ...cached.content_json, cacheId: cached.id },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
      );
    }

    // Cache miss — this will hit the AI. Enforce the free-tier weekly cap.
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    // 2. Cache miss (or cached word was semantically used) — build exclusion hint for AI prompt
    const seenSynonymsNote = seenSynonyms.length > 0
      ? ` Students have already used these synonym answers this session: ${seenSynonyms.join(', ')}. Pick a word where NONE of these are valid synonyms.`
      : '';
    const exclusionNote = seenItems.length > 0
      ? `\nIMPORTANT: These target words were already shown this session: ${seenItems.join(', ')}. Do NOT use them, and do NOT choose a word that is a near-synonym or belongs to the same vocabulary cluster — students need a COMPLETELY DIFFERENT set of answers.${seenSynonymsNote}\n`
      : '';

    const prompt = `Generate a synonym challenge for ${difficultyPrompts[difficulty]}
Topic: ${topic}.
${sourceContext}${sourceContext ? 'Choose a target word that ACTUALLY APPEARS in the source material above (a meaningful content word from it), so the challenge reinforces the lesson.\n' : ''}${exclusionNote}
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

    // 3. Store in cache for future sessions (never cache source-grounded content)
    const cacheId = skipCache ? null : await storeCachedContent(GAME_KEY, topic, difficulty, data, SCHEMA_VERSION);

    return NextResponse.json(
      { ...data, cacheId },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch (error) {
    console.error('Generate error:', error);
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
      ...synonymShowdownFallback(topic),
      cacheId: null,
      degraded: true,
    });
  }
}

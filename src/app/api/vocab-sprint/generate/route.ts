import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic, Tone } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { vocabSprintFallback } from '@/lib/fallback-content';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

export interface GameSentence {
  sentence: string;
  weakWord: string;
  hint: string;
  level: 'easy' | 'medium' | 'hard';
  targetWord?: string;
}

const GAME_KEY = 'vocab-sprint';
const SCHEMA_VERSION = 2;

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very short, extremely simple sentences (4-6 words). Focus on basic everyday objects and actions.',
  'Easy': 'Easy (A2) level. Use simple sentences about familiar topics. Vocabulary should be basic but functional.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common but slightly simple vocabulary in standard sentences.',
  'Advanced': 'Advanced (C1) level. Use complex sentence structures and natural idioms.',
  'Expert': 'Expert (C2/Native) level. Use very sophisticated, nuanced, and academic language.'
};

const toneInstructions: Record<Tone, string> = {
  'Neutral': 'Maintain a balanced, standard tone.',
  'Casual': 'Use a relaxed, conversational, and everyday tone.',
  'Formal': 'Use strict, serious, and highly polite language.',
  'Humorous': 'Include a touch of wit, irony, or lighthearted fun.',
  'Professional': 'Focus on corporate, clear, and efficient communication.',
  'Kid-friendly': 'Use engaging, simple-to-understand but imaginative language suitable for children.'
};

const schema: AISchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      sentence: { type: 'string' },
      weakWord: { type: 'string' },
      hint: { type: 'string' },
      level: { type: 'string' },
      targetWord: { type: 'string' }
    },
    required: ['sentence', 'weakWord', 'hint', 'level', 'targetWord']
  }
};

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const { difficulty, topic, tone, seenItems = [], excludeCacheIds = [], keyVocabWords, sourceMaterial } = await request.json() as {
    difficulty: Difficulty;
    topic: Topic;
    tone: Tone;
    seenItems?: string[];
    excludeCacheIds?: string[];
    keyVocabWords?: string[]; // Vocab Radar output — feeds hard round targets
    sourceMaterial?: SourceMaterial;
  };

  // Ground the sentences in the lesson's source material when attached.
  const sourceContext = await resolveSourceContext(sourceMaterial);
  // Source-grounded content is lesson-specific — never serve or store it from the shared cache.
  const skipCache = !!sourceMaterial;

  try {
    // When vocab words are provided the hard rounds are session-specific — skip cache
    if (!keyVocabWords?.length && !skipCache) {
      const cached = await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds, undefined, SCHEMA_VERSION);
      if (cached) {
        return NextResponse.json({
          sentences: cached.content_json as GameSentence[],
          cacheId: cached.id,
        });
      }
    }

    // Cache miss — this will hit the AI. Enforce the free-tier weekly cap.
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    const exclusionNote = seenItems.length > 0
      ? `\nIMPORTANT: Do NOT use these weak words that were recently shown this session: ${seenItems.join(', ')}. Choose different words.\n`
      : '';

    const hardRoundInstructions = keyVocabWords?.length
      ? `Use EXACTLY these vocabulary words as the targetWord for your 2 hard sentences (one word per sentence): ${keyVocabWords.slice(0, 2).join(', ')}.`
      : 'Choose 2 challenging topic-specific vocabulary terms appropriate for this difficulty level.';

    const prompt = `Generate exactly 6 English sentences for vocabulary practice at ${difficultyPrompts[difficulty]}
Topic: ${topic}.
Tone: ${toneInstructions[tone]}
${sourceContext}${sourceContext ? 'Every sentence must be set in the situations, scenarios, and vocabulary of the source material above — not generic unrelated content.\n' : ''}${exclusionNote}
DISTRIBUTE EXACTLY: 2 easy + 2 medium + 2 hard sentences (level field must be "easy", "medium", or "hard").

--- EASY (2 sentences) ---
Each sentence contains ONE generic weak word (the "weakWord") for the student to replace with a stronger synonym.
Choose weak words from: good, bad, big, small, nice, interesting, important, happy, sad, great, amazing, terrible, beautiful, old, new, fast, slow, hard, easy, fun, boring, cool, weird, strange, busy, loud, quiet, hot, cold, said, went, got, think, look, make, do, take, give, show, change, walk, run, eat, see.
Every sentence must use a DIFFERENT weak word. Prioritise verbs and adjectives.
Set targetWord to "" for easy sentences.

--- MEDIUM (2 sentences) ---
Each sentence uses a topic-adjacent phrase that is imprecise or informal (the "weakWord") which the student replaces with more precise vocabulary.
Example: "The factory puts out a lot of gas every year." → weakWord: "puts out" → better: "emits"
Set targetWord to "" for medium sentences.

--- HARD (2 sentences) ---
Each sentence describes a key vocabulary concept in plain everyday language. The "weakWord" is the descriptive phrase embedded in the sentence. The student must recall and type the PRECISE vocabulary term.
${hardRoundInstructions}
Example: "We need to cut down our total effect on the climate from energy use." → weakWord: "total effect on the climate from energy use" → targetWord: "carbon footprint"
Set targetWord to the exact precise term the student should produce.
Hint for hard sentences: give a brief clue without giving away the answer (max 10 words).

Return exactly 6 objects as a JSON array ordered: 2 easy, 2 medium, 2 hard.`;

    const sentences = await generateJSON<GameSentence[]>(prompt, schema, { taskClass: 'content-generation' });

    // Normalise level values and ensure targetWord is present
    const normalised = sentences.map(s => ({
      ...s,
      level: (['easy', 'medium', 'hard'].includes(s.level) ? s.level : 'easy') as GameSentence['level'],
      targetWord: s.targetWord || undefined,
    }));

    // Only cache when no vocab words were used and not source-grounded (those results are session-specific)
    const cacheId = (keyVocabWords?.length || skipCache)
      ? null
      : await storeCachedContent(GAME_KEY, topic, difficulty, normalised, SCHEMA_VERSION);

    return NextResponse.json({ sentences: normalised, cacheId });
  } catch (error) {
    console.error('Generate error:', error);
    try {
      const emergency = await getCachedContent(GAME_KEY, topic, difficulty, undefined, undefined, SCHEMA_VERSION);
      if (emergency) {
        return NextResponse.json({
          sentences: emergency.content_json as GameSentence[],
          cacheId: emergency.id,
          degraded: true,
        });
      }
    } catch { /* cache also failed */ }
    return NextResponse.json({
      sentences: vocabSprintFallback(topic),
      cacheId: null,
      degraded: true,
    });
  }
}

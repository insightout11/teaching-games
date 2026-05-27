import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { difficultyDescriptions } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';
import type { SourceVocabItem } from '@/activities/types';

export const dynamic = 'force-dynamic';

// POST /api/session/reference-materials
// Teacher-authenticated. Generates vocabulary and useful expressions for the
// student reference panel based on the session's topic + difficulty.
// Called fire-and-forget after any session settings change.
// Writes reference_vocab + reference_expressions to the sessions row.

interface VocabItem {
  word: string;
  definition: string;
}

interface ExpressionItem {
  phrase: string;
  example: string;
}

const vocabSchema: AISchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      word: { type: 'string' },
      definition: { type: 'string' },
    },
    required: ['word', 'definition'],
  },
};

const expressionsSchema: AISchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      phrase: { type: 'string' },
      example: { type: 'string' },
    },
    required: ['phrase', 'example'],
  },
};

export async function POST(request: Request) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const { sessionId, sourceVocab } = body ?? {} as { sessionId?: string; sourceVocab?: SourceVocabItem[] };

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Canonical write path: if sourceVocab is provided, write it directly and return (idempotent)
  if (Array.isArray(sourceVocab) && sourceVocab.length > 0) {
    await supabase
      .from('sessions')
      .update({ reference_vocab: sourceVocab.map((v) => ({ word: v.term, definition: v.meaning })) })
      .eq('id', sessionId);
    return NextResponse.json({ ok: true });
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('topic, difficulty, custom_topic, status, reference_vocab')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Idempotency: skip if canonical vocab already written
  if (session.reference_vocab) {
    return NextResponse.json({ ok: true });
  }

  const topic = (session.custom_topic as string | null) || (session.topic as string) || 'General';
  const difficulty = (session.difficulty as string) || 'Intermediate';
  const diffDesc = difficultyDescriptions[difficulty as Difficulty] ?? difficultyDescriptions['Intermediate'];

  try {
    const vocabPrompt = `Generate exactly 7 key vocabulary words for a ${difficulty} English language class studying the topic: "${topic}".

Return a JSON array of exactly 7 objects. Each object has:
- "word": the vocabulary word or short phrase
- "definition": a clear, simple definition appropriate for ${diffDesc} learners (1 sentence, no jargon)

Focus on words students will encounter or need when discussing "${topic}". Include a mix of nouns, verbs, and adjectives where natural.`;

    const expressionsPrompt = `Generate exactly 6 useful English expressions for discussing "${topic}" in a ${difficulty} class.

Return a JSON array of exactly 6 objects. Each object has:
- "phrase": a natural expression or sentence stem (e.g., "In my opinion...", "That reminds me of...")
- "example": one short example sentence using the phrase in the context of "${topic}"

Focus on expressions that help students participate in discussion, give opinions, ask follow-up questions, or agree/disagree. Match the complexity to ${diffDesc} level.`;

    const [vocab, expressions] = await Promise.all([
      generateJSON<VocabItem[]>(vocabPrompt, vocabSchema, { taskClass: 'content-generation' }),
      generateJSON<ExpressionItem[]>(expressionsPrompt, expressionsSchema, { taskClass: 'content-generation' }),
    ]);

    await supabase
      .from('sessions')
      .update({ reference_vocab: vocab, reference_expressions: expressions })
      .eq('id', sessionId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

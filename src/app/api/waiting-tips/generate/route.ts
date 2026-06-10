import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import { createServiceClient } from '@/lib/supabase/service';
import { difficultyDescriptions } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';
import { isSessionStale } from '@/lib/session-freshness';

export const dynamic = 'force-dynamic';

// POST /api/waiting-tips/generate
// Public endpoint (students call this). Accepts sessionId, looks up topic+difficulty
// from the DB (never trusts client input for content shaping), then generates or
// returns cached topic-aware tips for the waiting screen.

const GAME_KEY = 'waiting-tips';

interface WaitingTip {
  category: string;
  text: string;
}

const schema: AISchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      category: { type: 'string' },
      text: { type: 'string' },
    },
    required: ['category', 'text'],
  },
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { sessionId } = body ?? {};

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ tips: [] }, { status: 400 });
  }

  // Validate UUID to prevent injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    return NextResponse.json({ tips: [] }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Look up topic and difficulty from the DB (not trusted from client)
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('topic, difficulty, custom_topic, status, started_at')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session || session.status !== 'active' || isSessionStale(session.started_at)) {
    return NextResponse.json({ tips: [] });
  }

  const topic = (session.custom_topic as string | null) || (session.topic as string) || 'General';
  const difficulty = (session.difficulty as string) || 'Intermediate';
  const diffDesc = difficultyDescriptions[difficulty as Difficulty] ?? difficultyDescriptions['Intermediate'];

  // Check cache first (schemaVersion 2 = includes grammar tip as item 6)
  const cached = await getCachedContent(GAME_KEY, topic, difficulty, undefined, undefined, 2);
  if (cached) {
    return NextResponse.json({ tips: cached.content_json as WaitingTip[] });
  }

  // Cache miss — generate via AI
  try {
    const prompt = `Generate exactly 6 items for an English class waiting screen. Topic: "${topic}". Student level: ${diffDesc}

Return a JSON array of exactly 6 objects with "category" and "text" fields:
- Items 1-3: vocabulary. category = "${topic} Vocab". text = "Word (part of speech) — short definition at this level. Example: brief example sentence."
- Item 4: interesting fact. category = "Did you know?". text = one interesting fact about "${topic}" in English or the wider world, appropriate for this level.
- Item 5: useful expression. category = "Useful Phrase". text = "Expression or phrase related to ${topic}" — what it means + a short example sentence.
- Item 6: grammar tip. category = "Grammar Tip". text = one grammar point appropriate for this exact student level. For A1/Beginner: basic sentence structure, subject pronouns, simple present tense. For A2/Easy: present continuous, simple past, question formation. For B1-B2/Intermediate: present perfect, conditionals, relative clauses. For C1/Advanced: subjunctive, inversion, advanced passives. Keep explanation to 1-2 sentences with a short example.

CRITICAL: All language must match the student level described above. Keep text concise (1-2 sentences max per item). No complex vocabulary for Beginner/Easy levels.`;

    const tips = await generateJSON<WaitingTip[]>(prompt, schema, { taskClass: 'content-generation' });

    // Store in cache with schemaVersion 2 (fire-and-forget result)
    void storeCachedContent(GAME_KEY, topic, difficulty, tips, 2);

    return NextResponse.json({ tips });
  } catch {
    return NextResponse.json({ tips: [] });
  }
}

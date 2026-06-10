import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { difficultyDescriptions } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';

export const dynamic = 'force-dynamic';

// POST /api/demo/student-answers
//
// Generates in-character answers for the five demo-crew students so a teacher
// test-driving a module sees responses that actually fit the prompt, the
// topic, and the class level — for ANY module they choose to launch. This is
// what makes the demo a real test drive instead of bots typing "Good point".
//
// Teacher-authed (the simulator runs on the teacher's own session view) and
// counted against the free-tier AI cap like every other generation call.

const PERSONAS = [
  { name: 'Mia',  voice: 'enthusiastic and detailed; often adds a tiny personal anecdote' },
  { name: 'Leo',  voice: 'extremely terse; 2–6 words, dry, but correct' },
  { name: 'Ava',  voice: 'curious and thoughtful; sometimes answers with a question back or a "both, because…"' },
  { name: 'Kai',  voice: 'funny and a little off-the-wall, but always actually on-topic' },
  { name: 'Noor', voice: 'steady and practical; balanced, sensible answers' },
] as const;

const schema: AISchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      text: { type: 'string' },
    },
    required: ['name', 'text'],
  },
};

interface AnswersRequest {
  sessionId: string;
  prompt: string;
  gameKey?: string | null;
  inputType?: string | null;
}

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  const body = await request.json().catch(() => null) as AnswersRequest | null;
  const sessionId = body?.sessionId;
  const prompt = typeof body?.prompt === 'string' ? body.prompt.slice(0, 600).trim() : '';

  if (!sessionId || !prompt) {
    return NextResponse.json({ error: 'sessionId and prompt are required' }, { status: 400 });
  }

  const ownership = await verifyTeacherOwnsSession(sessionId, teacher.id, { requireActive: true });
  if (ownership.error) return ownership.error;

  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  // Topic and difficulty come from the DB, never the client.
  const service = createServiceClient();
  const { data: session } = await service
    .from('sessions')
    .select('topic, custom_topic, difficulty')
    .eq('id', sessionId)
    .maybeSingle();

  const topic = (session?.custom_topic || session?.topic || 'General') as string;
  const difficulty = (session?.difficulty || 'Intermediate') as Difficulty;
  const languageRule = difficultyDescriptions[difficulty] ?? difficultyDescriptions['Intermediate'];

  const personaBlock = PERSONAS
    .map((p) => `- ${p.name}: ${p.voice}`)
    .join('\n');

  const aiPrompt = `You are simulating five ESL students answering a live classroom prompt so a teacher can preview this activity.

LANGUAGE RULE for all five answers: ${languageRule}

Class topic: ${topic}
Activity: ${body?.gameKey ?? 'classroom activity'}
Input type: ${body?.inputType ?? 'text'}

The live prompt shown to students:
"${prompt}"

The five students and their voices:
${personaBlock}

Write ONE answer per student, in their voice, that genuinely responds to the prompt. Keep each answer short (Leo: 2–6 words; everyone else: 1–2 sentences, under 30 words). The answers must read like real students of this level — minor imperfections are fine, gibberish is not. Return a JSON array of { "name", "text" }.`;

  try {
    const answers = await generateJSON<Array<{ name: string; text: string }>>(aiPrompt, schema);

    // Keep only known personas, dedupe by name, require non-empty text.
    const byName = new Map<string, string>();
    for (const a of answers ?? []) {
      const persona = PERSONAS.find((p) => p.name === a?.name);
      if (persona && typeof a.text === 'string' && a.text.trim() && !byName.has(persona.name)) {
        byName.set(persona.name, a.text.trim().slice(0, 240));
      }
    }

    if (byName.size === 0) {
      return NextResponse.json({ error: 'No usable answers generated' }, { status: 502 });
    }

    return NextResponse.json({
      answers: Array.from(byName.entries()).map(([name, text]) => ({ name, text })),
    });
  } catch (err) {
    console.error('[api/demo/student-answers] generation error:', err);
    // The simulator falls back to its local pools on any non-200.
    return NextResponse.json({ error: 'Failed to generate demo answers' }, { status: 502 });
  }
}

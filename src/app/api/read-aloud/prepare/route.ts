import { NextResponse } from 'next/server';
import { generateJSON, type AISchema } from '@/lib/ai';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { difficultyDescriptions, type Difficulty } from '@/lib/difficulty';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

/**
 * POST /api/read-aloud/prepare
 * Makes the class version of a text for Read it together: rewritten at the
 * class's level (same facts, same order, short paragraphs), plus a kid-safety
 * check for news and web articles. The original stays available in the UI.
 */
const schema: AISchema = {
  type: 'object',
  properties: {
    classText: { type: 'string' },
    safe: { type: 'boolean' },
    safetyNote: { type: 'string' },
  },
  required: ['classText', 'safe', 'safetyNote'],
};

export async function POST(request: Request) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 200) : '';
  const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 9000) : '';
  if (text.length < 40) return NextResponse.json({ error: 'text is required' }, { status: 400 });
  const difficulty = (typeof body?.difficulty === 'string' && body.difficulty in difficultyDescriptions ? body.difficulty : 'Intermediate') as Difficulty;

  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  try {
    const raw = await generateJSON<{ classText: string; safe: boolean; safetyNote: string }>(
      `LANGUAGE RULE: write the class version in simple, natural English for ${difficulty} learners (${difficultyDescriptions[difficulty]}).

A live English class (kids or teens) will read this aloud together, one paragraph per student.
Title: "${title}"
Text:
"""${text}"""

1. "classText": rewrite it for this level. Keep every important fact and the original order; do not
   add facts. Short sentences, paragraphs of 2-4 sentences, separated by a blank line. Around the same
   length or shorter (max ~450 words).
2. "safe": false if the text has graphic violence, sexual content, self-harm, hate, or distressing
   details unsuitable for a kids/teens class; otherwise true.
3. "safetyNote": if not safe, one sentence the teacher sees explaining why; otherwise "".`,
      schema,
      { taskClass: 'content-generation' },
    );
    const classText = typeof raw?.classText === 'string' ? raw.classText.trim().slice(0, 6000) : '';
    if (classText.length < 40) return NextResponse.json({ error: 'Could not prepare the text' }, { status: 502 });
    return NextResponse.json({
      classText,
      safe: raw.safe !== false,
      safetyNote: typeof raw.safetyNote === 'string' ? raw.safetyNote.trim().slice(0, 240) : '',
    });
  } catch {
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 });
  }
}

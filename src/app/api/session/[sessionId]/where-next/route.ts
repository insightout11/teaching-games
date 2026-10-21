import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { cleanNextTopics, NEXT_TOPICS_SCHEMA, nextTopicsPrompt } from '@/lib/live-room/where-next';
import { lensById, lensPromptNote, lensSeedsNote } from '@/lib/lens';

export const dynamic = 'force-dynamic';

/**
 * "Where next?" for a topic briefed without it (a ready-bank topic, which is instant and free).
 * One small, cheap AI call; it never blocks the topic itself.
 */
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null) as { title?: unknown; covered?: unknown; lens?: unknown } | null;
  const lens = lensById(typeof body?.lens === 'string' ? body.lens : null);
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 200) : '';
  const covered = (Array.isArray(body?.covered) ? body.covered : [])
    .filter((c): c is string => typeof c === 'string').map((c) => c.slice(0, 120)).slice(0, 20);
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;

  const next = await generateJSON<{ nextTopics: unknown }>(
    `A live English class (kids or teens) is talking about "${title}". Suggest where the conversation could go next.\n${lensPromptNote(lens)}${lensSeedsNote(lens)}${nextTopicsPrompt(title, covered)}`,
    { type: 'object', properties: { nextTopics: NEXT_TOPICS_SCHEMA }, required: ['nextTopics'] },
    { taskClass: 'writing' },
  ).catch(() => null);
  return NextResponse.json({ nextTopics: cleanNextTopics(next?.nextTopics, [title, ...covered]) });
}

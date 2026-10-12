import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { difficultyDescriptions, type Difficulty } from '@/lib/difficulty';
import { sanitizeLessonMemory } from '@/lib/lesson-memory';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Topics for the Spinner's wheel, so a teacher never has to type a list mid-lesson.
 *  - around: sub-topics of what the room is talking about now (written live for that exact topic)
 *  - new:    fresh topics for this class's age and level
 *  - ours:   topics this class has talked about in earlier lessons (from the class's own record, no AI)
 * Up to 8, each short enough to read on a wheel slice. No stand-in list: when nothing can be made the wheel
 * stays empty and the teacher is told.
 */
const WHEEL_SIZE = 8;
const schema: AISchema = { type: 'object', properties: { topics: { type: 'array', items: { type: 'string' } } }, required: ['topics'] };

const tidy = (value: unknown): string => (typeof value === 'string' ? value.replace(/["“”.]/g, '').replace(/\s+/g, ' ').trim() : '');

function unique(topics: string[], avoid: string[] = []): string[] {
  const seen = new Set(avoid.map((t) => t.toLowerCase()));
  const out: string[] = [];
  for (const topic of topics) {
    const key = topic.toLowerCase();
    if (!topic || topic.length > 28 || seen.has(key)) continue;
    seen.add(key);
    out.push(topic);
  }
  return out.slice(0, WHEEL_SIZE);
}

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null) as { flavour?: string; topic?: string; avoid?: unknown } | null;
  const flavour = body?.flavour === 'new' || body?.flavour === 'ours' ? body.flavour : 'around';
  const topic = tidy(body?.topic).slice(0, 120);
  const avoid = (Array.isArray(body?.avoid) ? body.avoid : []).map(tidy).filter(Boolean).slice(0, 24);

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;

  const service = createServiceClient();
  const { data: session } = await service.from('sessions').select('difficulty, class_id, started_at, classes(junior)').eq('id', params.sessionId).maybeSingle();

  if (flavour === 'ours') {
    // The class's own earlier lessons, newest first. Read from the record; nothing is invented.
    if (!session?.class_id) return NextResponse.json({ topics: [] });
    const { data: earlier } = await service
      .from('sessions')
      .select('id')
      .eq('class_id', session.class_id)
      .lt('started_at', session.started_at)
      .order('started_at', { ascending: false })
      .limit(12);
    const ids = ((earlier ?? []) as Array<{ id: string }>).map((row) => row.id);
    if (!ids.length) return NextResponse.json({ topics: [] });
    const { data: rows } = await service.from('session_memory').select('session_id, payload').in('session_id', ids);
    const byId = new Map(((rows ?? []) as Array<{ session_id: string; payload: unknown }>).map((row) => [row.session_id, row.payload]));
    const titles = ids.flatMap((id) => sanitizeLessonMemory(byId.get(id) ?? null)?.topics.map((entry) => tidy(entry.title)) ?? []);
    return NextResponse.json({ topics: unique(titles, avoid) });
  }

  if (flavour === 'around' && !topic) return NextResponse.json({ error: 'Set a topic first, or choose "Something new".' }, { status: 400 });

  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  const difficulty = ((session?.difficulty as string | undefined) ?? 'Intermediate') as Difficulty;
  const junior = Boolean((session?.classes as { junior?: boolean } | null)?.junior);
  const who = junior ? 'young children (ages 5-9)' : 'kids and teenagers';
  const prompt = `Write ${WHEEL_SIZE + 2} short topics for a classroom spinner wheel. The wheel picks one and the class talks about it, so each must be something ${who} have something to SAY about.

${flavour === 'around'
    ? `The class is talking about: "${topic}". Every item is a different part, angle or example OF THAT EXACT TOPIC (for "Minecraft": mobs, building a house, survival mode, favourite block). Do not drift to other subjects.`
    : `Give fresh, varied topics this age group enjoys talking about: a mix of everyday life, things they love, and "what if" ideas. No two from the same area.${topic ? ` Not about "${topic}": the class has just done that.` : ''}`}

LANGUAGE RULE: ${difficultyDescriptions[difficulty] ?? difficultyDescriptions.Intermediate}
Rules:
- Each topic is 1-3 words, at most 22 characters, with no numbering and no punctuation except an apostrophe where the word needs one. It must fit on a slice of a wheel.
- A thing to talk about, never a question and never a full sentence.${junior ? '\n- Single, concrete, picture-friendly words a small child knows (animals, food, toys, places).' : ''}
- Kid-safe, kind, nothing about politics, religion, violence or romance.
${avoid.length ? `- Do NOT repeat any of these, which are already on the wheel: ${avoid.join(', ')}.` : ''}
Return { "topics": [...] }.`;

  try {
    const parsed = await generateJSON<{ topics?: unknown[] }>(prompt, schema);
    const topics = unique((parsed.topics ?? []).map(tidy), avoid);
    if (topics.length < 3) return NextResponse.json({ error: 'Could not think of topics just now. Try again.' }, { status: 502 });
    return NextResponse.json({ topics });
  } catch (error) {
    console.error('[spinner-topics] failed:', error);
    return NextResponse.json({ error: 'Could not think of topics just now. Try again.' }, { status: 502 });
  }
}

import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { verifyTeacherOwnsSession } from '@/lib/session-ownership';
import { createServiceClient } from '@/lib/supabase/service';
import { difficultyDescriptions, type Difficulty } from '@/lib/difficulty';
import { broadcastInputSpecFromServer } from '@/lib/supabase/realtime-broadcast';
import { inputSpecChannelName, SESSION_REFRESH_EVENT } from '@/lib/input-spec';
import {
  normalizeReferenceExpressions,
  normalizeReferenceVocab,
  PHRASEBOOK_FIELDS_PROMPT,
  PHRASEBOOK_ITEM_SCHEMA,
  withPhraseSource,
} from '@/lib/reference-materials';
import { findTopicBriefing, topicBriefingLevel } from '@/lib/topic-briefings';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Live Room Focus: whatever the class is talking about right now (a typed
 * topic, a student's question, a Talk prompt, a pasted paragraph). One cheap AI
 * call writes a short briefing plus the phones' reference vocabulary and
 * expressions, and the session's topic, so phones follow the Focus through the
 * existing student reference panel.
 */
const schema: AISchema = {
  type: 'object',
  properties: {
    briefing: { type: 'string' },
    facts: { type: 'array', items: { type: 'string' } },
    angles: { type: 'array', items: { type: 'string' } },
    vocab: {
      type: 'array',
      items: PHRASEBOOK_ITEM_SCHEMA,
    },
    expressions: {
      type: 'array',
      items: { type: 'object', properties: { phrase: { type: 'string' }, example: { type: 'string' } }, required: ['phrase', 'example'] },
    },
  },
  required: ['briefing', 'facts', 'angles', 'vocab', 'expressions'],
};

interface FocusBrief {
  briefing: string;
  facts: string[];
  angles: string[];
  vocab: unknown;
  expressions: unknown;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strings = (v: unknown, n: number, max: number) =>
  (Array.isArray(v) ? v : []).map((s) => clean(s, max)).filter(Boolean).slice(0, n);

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null);
  const title = clean(body?.title, 200);
  const text = clean(body?.text, 4000);
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;

  const service = createServiceClient();
  const { data: session } = await service.from('sessions').select('difficulty').eq('id', params.sessionId).maybeSingle();
  const difficulty = ((session?.difficulty as string | undefined) ?? 'Intermediate') as Difficulty;
  const level = difficultyDescriptions[difficulty] ?? difficultyDescriptions.Intermediate;

  // A topic from the ready bank (no material attached): instant, no AI call.
  const banked = text ? null : findTopicBriefing(title);
  const bankedLevel = banked ? topicBriefingLevel(banked, difficulty) : null;

  if (!bankedLevel) {
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;
  }

  const prompt = `LANGUAGE RULE: write everything in simple, natural English for ${difficulty} learners (${level}).

A live English class (kids or teens) is now talking about: "${title}"
${text ? `Material the class is looking at:\n"""${text}"""\n` : ''}
Prepare the teacher and students:
- "briefing": 3-4 sentences a teacher could read out that give the class real substance on this (facts, not fluff). If material is given, summarise it.
- "facts": 4 short, interesting, accurate facts about it.
- "angles": 3 open questions or opinions the class could argue about.
- "vocab": exactly 7 words or short phrases students need to talk about THIS.
${PHRASEBOOK_FIELDS_PROMPT}
- "expressions": exactly 6 useful sentence stems for discussing it, each with a short example about this topic.`;

  let brief: FocusBrief;
  try {
    brief = bankedLevel ? (bankedLevel as FocusBrief) : await generateJSON<FocusBrief>(prompt, schema, { taskClass: 'content-generation' });
  } catch {
    // The topic still changes (phones show it); the reference panel keeps its previous words.
    await service.from('sessions').update({ custom_topic: title.slice(0, 120) }).eq('id', params.sessionId);
    return NextResponse.json({ error: 'Briefing failed' }, { status: 502 });
  }

  const vocab = withPhraseSource(normalizeReferenceVocab(brief.vocab), 'topic');
  const expressions = normalizeReferenceExpressions(brief.expressions);
  await service
    .from('sessions')
    .update({
      custom_topic: title.slice(0, 120),
      ...(vocab.length ? { reference_vocab: vocab } : {}),
      ...(expressions.length ? { reference_expressions: expressions } : {}),
    })
    .eq('id', params.sessionId);
  // Phones fetch the new topic + words now, not on their next minute poll.
  await broadcastInputSpecFromServer(inputSpecChannelName(params.sessionId), SESSION_REFRESH_EVENT, { at: Date.now() }).catch(() => null);

  return NextResponse.json({
    briefing: clean(brief.briefing, 1200),
    facts: strings(brief.facts, 5, 240),
    angles: strings(brief.angles, 4, 240),
    vocab,
  });
}

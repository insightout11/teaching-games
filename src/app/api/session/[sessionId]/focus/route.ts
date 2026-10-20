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
import { lensById, lensPromptNote } from '@/lib/lens';
import { stickerLabel } from '@/lib/stickers';
import { lookupWikipedia, type WikiReference } from '@/lib/sources/wikipedia';
import { depthPromptNote, type TopicDepth } from '@/lib/topic-depth';
import { cleanNextTopics, NEXT_TOPICS_SCHEMA, nextTopicsPrompt } from '@/lib/live-room/where-next';
import { cardsFromFacts, cleanFactCards, FACT_CARDS_SCHEMA, factCardsPrompt } from '@/lib/live-room/fact-cards';

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
    nextTopics: NEXT_TOPICS_SCHEMA,
    cards: FACT_CARDS_SCHEMA,
  },
  required: ['briefing', 'facts', 'angles', 'vocab', 'expressions', 'nextTopics', 'cards'],
};

interface FocusBrief {
  briefing: string;
  facts: string[];
  angles: string[];
  vocab: unknown;
  expressions: unknown;
  nextTopics?: unknown;
  cards?: unknown;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strings = (v: unknown, n: number, max: number) =>
  (Array.isArray(v) ? v : []).map((s) => clean(s, max)).filter(Boolean).slice(0, n);

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => null);
  const title = clean(body?.title, 200);
  const text = clean(body?.text, 4000);
  const depth: TopicDepth = body?.depth === 'deep' ? 'deep' : 'big';
  // A topic from the flight (a place below the plane): where it is, so the facts are about the right place.
  const where = clean(body?.where, 80);
  // Topics already covered this lesson, so "Where next?" never sends the class back round in circles.
  const covered = strings(body?.covered, 20, 120);
  // The class lens (films, music, a kid lens...): every card through that angle; ready-made cards are lens-free
  const lens = lensById(clean(body?.lens, 40));
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const { teacher, error: authError } = await requireAuth();
  if (authError) return authError;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await verifyTeacherOwnsSession(params.sessionId, teacher.id);
  if (owned.error) return owned.error;

  const service = createServiceClient();
  const { data: session } = await service.from('sessions').select('difficulty, classes(junior)').eq('id', params.sessionId).maybeSingle();
  const difficulty = ((session?.difficulty as string | undefined) ?? 'Intermediate') as Difficulty;
  const level = difficultyDescriptions[difficulty] ?? difficultyDescriptions.Intermediate;
  const junior = (session as { classes?: { junior?: boolean } | null } | null)?.classes?.junior === true;

  // A topic from the ready bank (no material attached): instant, no AI call.
  const banked = text || lens ? null : findTopicBriefing(title);
  const bankedLevel = banked ? topicBriefingLevel(banked, difficulty) : null;

  if (!bankedLevel) {
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;
  }

  // A named film, book, singer, famous person...: real facts from Wikipedia, so the class talks about the real thing.
  const reference: WikiReference | null = bankedLevel || text.length >= 400 ? null : await lookupWikipedia(title, where || undefined);
  const material = reference ? `${text ? `${text}\n\n` : ''}From Wikipedia (${reference.title}):\n${reference.text}` : text;

  const prompt = `LANGUAGE RULE: write everything in simple, natural English for ${difficulty} learners (${level}).

A live English class (kids or teens) is now talking about: "${title}"${where ? ` (the one in ${where}: the class is flying over it)` : ''}
${lensPromptNote(lens)}${material ? `Material the class is looking at:\n"""${material}"""\n` : ''}${reference?.ending ? 'This is a story: never give away its ending.\n' : ''}${depthPromptNote(depth)}
Prepare the teacher and students:
- "briefing": 3-4 sentences a teacher could read out that give the class real substance on this (facts, not fluff). If material is given, summarise it.
- "facts": 4 short, interesting, accurate facts about it.
- "angles": 3 open questions or opinions the class could argue about${depth === 'deep' ? ', about the subject itself (its works, people and events by name)' : ''}.
- "vocab": exactly 7 words or short phrases students need to talk about THIS.
${PHRASEBOOK_FIELDS_PROMPT}
- "expressions": exactly 6 useful sentence stems for discussing it, each with a short example about this topic.
${factCardsPrompt(junior)}
${nextTopicsPrompt(title, covered)}`;

  let brief: FocusBrief;
  try {
    brief = bankedLevel ? (bankedLevel as FocusBrief) : await generateJSON<FocusBrief>(prompt, schema, { taskClass: 'writing' });
    // A ready-bank topic stays instant: its "Where next?" comes from /where-next afterwards.
  } catch {
    // The topic still changes (phones show it); the reference panel keeps its previous words.
    await service.from('sessions').update({ custom_topic: title.slice(0, 120) }).eq('id', params.sessionId);
    return NextResponse.json({ error: 'Briefing failed' }, { status: 502 });
  }

  // Junior classes on a banked topic: the phones' words are picture words (Codex round 22), said and pointed at.
  const pictureVocab = junior && banked?.pictureWords?.length
    ? banked.pictureWords.map((id) => {
        const word = stickerLabel(id);
        return { word, definition: '', starter: `Point to the picture and say “${word}”.` };
      })
    : null;
  const vocab = withPhraseSource(normalizeReferenceVocab(pictureVocab ?? brief.vocab), 'topic');
  const expressions = normalizeReferenceExpressions(brief.expressions);
  await service
    .from('sessions')
    .update({
      custom_topic: title.slice(0, 120),
      ...(vocab.length ? { reference_vocab: vocab } : {}),
      ...(expressions.length ? { reference_expressions: expressions } : {}),
    })
    .eq('id', params.sessionId);
  // The facts board on phones too (students on one device can read the facts while they answer). Public: facts only.
  const cards = (() => { const c = cleanFactCards(bankedLevel?.cards ?? brief.cards); return c.length >= 3 ? c : cardsFromFacts(strings(brief.facts, 5, 240), strings(brief.angles, 4, 240)); })();
  try {
    await service.from('session_private_state').upsert(
      { session_id: params.sessionId, key: 'facts', payload: { title: title.slice(0, 120), cards: cards.map((c) => ({ headline: c.headline, detail: c.detail })) }, updated_at: new Date().toISOString() },
      { onConflict: 'session_id,key' },
    );
  } catch {
    // phones simply show no facts
  }
  // Phones fetch the new topic + words now, not on their next minute poll.
  await broadcastInputSpecFromServer(inputSpecChannelName(params.sessionId), SESSION_REFRESH_EVENT, { at: Date.now() }).catch(() => null);

  return NextResponse.json({
    briefing: clean(brief.briefing, 1200),
    facts: strings(brief.facts, 5, 240),
    angles: strings(brief.angles, 4, 240),
    vocab,
    nextTopics: cleanNextTopics(brief.nextTopics, [title, ...covered]),
    // The facts board: the model's cards, or (a ready-bank topic) its facts as cards.
    cards,
    ...(reference ? { reference } : {}),
  });
}

import { NextResponse } from 'next/server';
import { generateJSON, type AISchema } from '@/lib/ai';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { difficultyDescriptions, type Difficulty } from '@/lib/difficulty';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Class Board AI helpers (one cheap call each):
 *  - zones:  a board built for the current topic (title, prompt, 2–4 sections)
 *  - polish: gentle corrections of students' sentences (only the ones that need it)
 *  - themes: groups the cards into named themes
 */
type Item = { id: string; text: string };

const zonesSchema: AISchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    prompt: { type: 'string' },
    zones: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, description: { type: 'string' } }, required: ['label', 'description'] } },
  },
  required: ['title', 'prompt', 'zones'],
};
const polishSchema: AISchema = {
  type: 'array',
  items: { type: 'object', properties: { id: { type: 'string' }, corrected: { type: 'string' } }, required: ['id', 'corrected'] },
};
const themesSchema: AISchema = {
  type: 'array',
  items: { type: 'object', properties: { label: { type: 'string' }, ids: { type: 'array', items: { type: 'string' } } }, required: ['label', 'ids'] },
};

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

function readItems(raw: unknown): Item[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((m): m is Item => !!m && typeof (m as Item).id === 'string' && typeof (m as Item).text === 'string')
    .slice(0, 60)
    .map((m) => ({ id: m.id, text: m.text.slice(0, 280) }));
}

export async function POST(request: Request) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const action = body?.action;
  const difficulty = (typeof body?.difficulty === 'string' && body.difficulty in difficultyDescriptions ? body.difficulty : 'Intermediate') as Difficulty;
  const level = difficultyDescriptions[difficulty];

  if (!['zones', 'polish', 'themes', 'questions', 'mistakes', 'pick', 'summary'].includes(action)) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
  const items = readItems(body?.items);
  const topic = clean(body?.topic, 200);
  if (action === 'zones' && !topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  if (action === 'questions' && !topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  if (action !== 'zones' && action !== 'questions' && items.length === 0) return NextResponse.json(action === 'polish' ? { fixes: [] } : action === 'themes' ? { themes: [] } : {});

  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  try {
    if (action === 'zones') {
      const raw = await generateJSON<{ title: string; prompt: string; zones: Array<{ label: string; description: string }> }>(
        `LANGUAGE RULE: simple English for ${difficulty} learners (${level}).
Design a class board for a live English class (kids or teens) about: "${topic}".
Return a short "title", a one-line "prompt" telling students what to add, and 2 to 4 "zones"
(sections) that make students think, e.g. For / Against, Before / During / After, Facts / Questions / Opinions.
Each zone: a 1–3 word "label" and a short "description".`,
        zonesSchema,
        { taskClass: 'content-generation' },
      );
      const zones = (Array.isArray(raw?.zones) ? raw.zones : [])
        .map((z) => ({ label: clean(z?.label, 30), description: clean(z?.description, 90) }))
        .filter((z) => z.label)
        .slice(0, 4);
      if (zones.length < 2) return NextResponse.json({ error: 'Could not design a board' }, { status: 502 });
      return NextResponse.json({ title: clean(raw.title, 60) || topic, prompt: clean(raw.prompt, 140), zones });
    }

    // Question ideas for the board, each with the layout that suits it (a comparison: a T-chart; ranking: a ranked board)
    if (action === 'questions') {
      const layouts = typeof body?.layouts === 'string' ? body.layouts.slice(0, 800) : '';
      const context = clean(body?.context, 600);
      const raw = await generateJSON<Array<{ question: string; layout: string }>>(
        `LANGUAGE RULE: simple English for ${difficulty} learners (${level}).
A live English class (kids or teens) is talking about "${topic}".${context ? ` Context: ${context}` : ''}
Write 3 open questions every student can answer in one or two sentences on their phone (different kinds: an opinion, a comparison or choice, something from their own life). No pair work.
For each, pick the best board "layout" key from: ${layouts || 'open-board'}.
Return [{ "question", "layout" }].`,
        { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, layout: { type: 'string' } }, required: ['question', 'layout'] } },
        { taskClass: 'content-generation' },
      );
      const ideas = (Array.isArray(raw) ? raw : []).map((q) => ({ question: clean(q?.question, 160), layout: clean(q?.layout, 40) })).filter((q) => q.question).slice(0, 3);
      return NextResponse.json({ ideas });
    }

    // A mistake several students made, for a quick whole-class fix (never naming anyone)
    if (action === 'mistakes') {
      const raw = await generateJSON<Array<{ wrong: string; right: string; count: number }>>(
        `These are ${difficulty} English learners' answers on a class board. Find up to 2 mistakes that MORE THAN ONE answer makes (the same pattern). Ignore one-off slips.
Return [{ "wrong": the typical wrong phrase, "right": the corrected phrase, "count": how many answers have it }]. Return [] if there is no shared mistake.
${items.map((i) => `[${i.id}] ${i.text}`).join('\n')}`,
        { type: 'array', items: { type: 'object', properties: { wrong: { type: 'string' }, right: { type: 'string' }, count: { type: 'number' } }, required: ['wrong', 'right', 'count'] } },
        { taskClass: 'content-generation' },
      );
      const mistakes = (Array.isArray(raw) ? raw : []).map((m) => ({ wrong: clean(m?.wrong, 80), right: clean(m?.right, 80), count: Math.max(2, Math.round(Number(m?.count) || 2)) })).filter((m) => m.wrong && m.right && m.wrong !== m.right).slice(0, 2);
      return NextResponse.json({ mistakes });
    }

    // Answers worth hearing aloud (interesting, different from the rest): for the teacher's private window only
    if (action === 'pick') {
      const raw = await generateJSON<Array<{ id: string; why: string }>>(
        `A teacher will call on a few students to say their class-board answer aloud. Pick the 3 answers most worth hearing: interesting, different from the others, or a good start for a discussion. Return [{ "id", "why" (max 10 words) }].
${items.map((i) => `[${i.id}] ${i.text}`).join('\n')}`,
        { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, why: { type: 'string' } }, required: ['id', 'why'] } },
        { taskClass: 'content-generation' },
      );
      const known = new Set(items.map((i) => i.id));
      const picks = (Array.isArray(raw) ? raw : []).filter((p) => typeof p?.id === 'string' && known.has(p.id)).map((p) => ({ id: p.id, why: clean(p.why, 80) })).slice(0, 3);
      return NextResponse.json({ picks });
    }

    // One line for the class logbook: what the class thought
    if (action === 'summary') {
      const raw = await generateJSON<{ summary: string }>(
        `Summarise in ONE short sentence (max 25 words) what this class thought, from their board answers${topic ? ` about "${topic}"` : ''}. Start with "The class". No names.
${items.map((i) => `- ${i.text}`).join('\n')}`,
        { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'] },
        { taskClass: 'content-generation' },
      );
      return NextResponse.json({ summary: clean(raw?.summary, 220) });
    }

    if (action === 'polish') {
      const raw = await generateJSON<Array<{ id: string; corrected: string }>>(
        `You help an English teacher give gentle feedback to ${difficulty} learners.
Correct grammar, spelling and word choice in each student sentence, keeping their meaning and voice.
Only include sentences that need a change. Return [{ "id", "corrected" }].
${items.map((i) => `[${i.id}] ${i.text}`).join('\n')}`,
        polishSchema,
        { taskClass: 'content-generation' },
      );
      const byId = new Map(items.map((i) => [i.id, i.text]));
      const fixes = (Array.isArray(raw) ? raw : [])
        .map((f) => ({ id: f?.id, corrected: clean(f?.corrected, 300) }))
        .filter((f): f is { id: string; corrected: string } => typeof f.id === 'string' && byId.has(f.id) && !!f.corrected && f.corrected !== byId.get(f.id)?.trim());
      return NextResponse.json({ fixes });
    }

    const raw = await generateJSON<Array<{ label: string; ids: string[] }>>(
      `Group these class board cards into 2 to 5 themes. Every card belongs to exactly one theme.
Each theme: a short "label" (1–3 words) and the card "ids".
${items.map((i) => `[${i.id}] ${i.text}`).join('\n')}`,
      themesSchema,
      { taskClass: 'content-generation' },
    );
    const known = new Set(items.map((i) => i.id));
    const used = new Set<string>();
    const themes = (Array.isArray(raw) ? raw : [])
      .map((t) => ({
        label: clean(t?.label, 30),
        ids: (Array.isArray(t?.ids) ? t.ids : []).filter((id) => known.has(id) && !used.has(id) && (used.add(id), true)),
      }))
      .filter((t) => t.label && t.ids.length)
      .slice(0, 5);
    // Anything the AI left out joins the last theme, so no card goes missing.
    const missing = items.map((i) => i.id).filter((id) => !used.has(id));
    if (missing.length && themes.length) themes[themes.length - 1].ids.push(...missing);
    return NextResponse.json({ themes });
  } catch {
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 });
  }
}

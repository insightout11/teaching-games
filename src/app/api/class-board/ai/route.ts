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

  if (action !== 'zones' && action !== 'polish' && action !== 'themes') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
  const items = readItems(body?.items);
  const topic = clean(body?.topic, 200);
  if (action === 'zones' && !topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  if (action !== 'zones' && items.length === 0) return NextResponse.json(action === 'polish' ? { fixes: [] } : { themes: [] });

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

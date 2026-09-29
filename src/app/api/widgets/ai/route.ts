import { NextResponse } from 'next/server';
import { generateJSON, type AISchema } from '@/lib/ai';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { difficultyDescriptions, type Difficulty } from '@/lib/difficulty';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Widget AI helpers (one cheap call each):
 *  - poll:        a poll question + 2–5 options for the current topic
 *  - cloudPrompt: a one-word-answer prompt for the Word Cloud
 *  - cloudTidy:   merge spelling variants/plurals and flag unkind words
 */
const pollSchema: AISchema = {
  type: 'object',
  properties: { question: { type: 'string' }, options: { type: 'array', items: { type: 'string' } } },
  required: ['question', 'options'],
};
const promptSchema: AISchema = { type: 'object', properties: { prompt: { type: 'string' } }, required: ['prompt'] };
const tidySchema: AISchema = {
  type: 'object',
  properties: {
    merge: { type: 'array', items: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } }, required: ['from', 'to'] } },
    blocked: { type: 'array', items: { type: 'string' } },
  },
  required: ['merge', 'blocked'],
};

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

export async function POST(request: Request) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (action !== 'poll' && action !== 'cloudPrompt' && action !== 'cloudTidy') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
  const difficulty = (typeof body?.difficulty === 'string' && body.difficulty in difficultyDescriptions ? body.difficulty : 'Intermediate') as Difficulty;
  const level = difficultyDescriptions[difficulty];
  const topic = clean(body?.topic, 200);
  const words: string[] = (Array.isArray(body?.words) ? body.words : []).map((w: unknown) => clean(w, 40).toLowerCase()).filter(Boolean).slice(0, 120);
  if (action !== 'cloudTidy' && !topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  if (action === 'cloudTidy' && !words.length) return NextResponse.json({ merge: [], blocked: [] });

  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  try {
    if (action === 'poll') {
      const raw = await generateJSON<{ question: string; options: string[] }>(
        `LANGUAGE RULE: simple English for ${difficulty} learners (${level}).
Write one quick poll for a live English class (kids or teens) about: "${topic}".
A fun or thought-provoking "question" and 2 to 5 short "options" (1–4 words each). No right answer needed.`,
        pollSchema,
        { taskClass: 'content-generation' },
      );
      const options = (Array.isArray(raw?.options) ? raw.options : []).map((o) => clean(o, 40)).filter(Boolean).slice(0, 5);
      if (!clean(raw?.question, 160) || options.length < 2) return NextResponse.json({ error: 'Could not write a poll' }, { status: 502 });
      return NextResponse.json({ question: clean(raw.question, 160), options });
    }
    if (action === 'cloudPrompt') {
      const raw = await generateJSON<{ prompt: string }>(
        `LANGUAGE RULE: simple English for ${difficulty} learners (${level}).
Write one Word Cloud prompt for a live English class about: "${topic}". Students answer with ONE word,
e.g. "One word for how rivers make you feel". Return { "prompt" }.`,
        promptSchema,
        { taskClass: 'content-generation' },
      );
      const prompt = clean(raw?.prompt, 120);
      return prompt ? NextResponse.json({ prompt }) : NextResponse.json({ error: 'Could not write a prompt' }, { status: 502 });
    }
    const raw = await generateJSON<{ merge: Array<{ from: string; to: string }>; blocked: string[] }>(
      `These are one-word answers from students in a class Word Cloud:
${Array.from(new Set(words)).join(', ')}
1. "merge": map misspellings, plurals and near-duplicates to one tidy word (e.g. "rivers"→"river", "beautifull"→"beautiful"). Only real variants.
2. "blocked": any rude, unkind or inappropriate words for a kids' class.`,
      tidySchema,
      { taskClass: 'content-generation' },
    );
    const known = new Set(words);
    const merge = (Array.isArray(raw?.merge) ? raw.merge : [])
      .map((m) => ({ from: clean(m?.from, 40).toLowerCase(), to: clean(m?.to, 40).toLowerCase() }))
      .filter((m) => m.from && m.to && m.from !== m.to && known.has(m.from));
    const blocked = (Array.isArray(raw?.blocked) ? raw.blocked : []).map((b) => clean(b, 40).toLowerCase()).filter((b) => known.has(b));
    return NextResponse.json({ merge, blocked });
  } catch {
    return NextResponse.json({ error: 'AI unavailable' }, { status: 502 });
  }
}

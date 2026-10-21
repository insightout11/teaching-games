import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { lookupWikipedia } from '@/lib/sources/wikipedia';
import { generateJSON } from '@/lib/ai';

export const dynamic = 'force-dynamic';

const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');

/**
 * The answer key for a question the teacher asks the class (Oct 2026). Private: the room sends it only to the teacher's
 * private window until the teacher reveals it. Grounded in the topic's Wikipedia article when there is one.
 */
export async function POST(request: Request) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const question = clean(body?.question, 200);
  if (question.length < 4) return NextResponse.json({ error: 'question is required' }, { status: 400 });
  const fact = clean(body?.fact, 500);
  const topic = clean(body?.topic, 120);
  const junior = body?.junior === true;

  // Choices for a class vote on an open question: three or four short options, one of them right when there is a fact
  if (body?.mode === 'choices') {
    const out = await generateJSON<{ options?: unknown }>(
      `A live English class (${junior ? 'young children' : 'kids or teens'}) votes on phones on: "${question}"${topic ? ` (topic: ${topic})` : ''}${fact ? `\nThe fact on screen: ${fact}` : ''}\nWrite "options": 3 or 4 short answer choices (at most 5 words each, ${junior ? 'very easy words' : 'simple words'}). If the question has a true answer, one choice is right and the others are believable but wrong. If it is an opinion question, give real different opinions.`,
      { type: 'object', properties: { options: { type: 'array', items: { type: 'string' } } }, required: ['options'] },
      { taskClass: 'writing' },
    ).catch(() => null);
    const options = Array.from(new Set((Array.isArray(out?.options) ? out!.options : []).filter((o): o is string => typeof o === 'string').map((o) => o.replace(/[?.!]+$/, '').trim().slice(0, 40)).filter(Boolean))).slice(0, 4);
    if (options.length < 2) return NextResponse.json({ error: 'No choices yet' }, { status: 503 });
    return NextResponse.json({ options });
  }
  const ref = topic ? await lookupWikipedia(topic).catch(() => null) : null;
  const reference = ref ? ref.text.slice(0, 3000) : '';
  const out = await generateJSON<{ answer?: unknown; open?: unknown }>(
    `A teacher of a live English class (${junior ? 'young children' : 'kids or teens'}) asked the class: "${question}"${topic ? ` The topic is ${topic}.` : ''}${fact ? `\nThe fact on screen: ${fact}` : ''}${reference ? `\nReference (Wikipedia, "${ref!.title}"):\n${reference}` : ''}\n\nWrite "answer": the answer the teacher can share after the class has guessed, in 2 or 3 short sentences of ${junior ? 'very easy' : 'simple'} English. Be true and specific; use the reference where it helps. If the question is an opinion question with no single answer, give two or three good example answers instead and set "open" to true. If you are not sure of a fact, leave it out.`,
    { type: 'object', properties: { answer: { type: 'string' }, open: { type: 'boolean' } }, required: ['answer'] },
    { taskClass: 'writing' },
  ).catch(() => null);
  const answer = clean(out?.answer, 600);
  if (!answer) return NextResponse.json({ error: 'No answer yet' }, { status: 503 });
  return NextResponse.json({ answer, open: out?.open === true, source: ref ? { title: ref.title, url: ref.url } : null }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
}

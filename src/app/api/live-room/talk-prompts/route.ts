import { NextResponse } from 'next/server';
import { generateJSON, type AISchema } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-credits';
import { difficultyDescriptions, type Difficulty } from '@/lib/difficulty';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Live Room Talk view: three quick discussion prompts (each with two
 * follow-ups) of the kind the teacher tapped, on the topic of the moment.
 */
const TALK_KINDS = ['warmup', 'deeper', 'opinion', 'wyr', 'story', 'debate', 'journey'] as const;
type TalkKind = (typeof TALK_KINDS)[number];

const KIND_BRIEF: Record<TalkKind, string> = {
  warmup: 'easy, friendly warm-up questions anyone can answer in a sentence',
  deeper: 'questions that push the conversation deeper: why, how, what if, examples from their own life',
  opinion: 'questions asking for a clear opinion and a reason',
  wyr: '"Would you rather…?" questions with two fun, balanced options',
  story: 'prompts that invite a short personal story ("Tell us about a time…")',
  debate: 'debatable statements the class can agree or disagree with, phrased as a claim',
  journey: 'questions inspired by the class flight (what the plane is flying over and the city it is landing in)',
};

const schema: AISchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
      followUps: { type: 'array', items: { type: 'string' } },
    },
    required: ['prompt', 'followUps'],
  },
};

interface TalkPrompt { prompt: string; followUps: string[] }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const kind = TALK_KINDS.includes(body?.kind) ? (body.kind as TalkKind) : null;
  if (!kind) return NextResponse.json({ error: 'Unknown prompt kind' }, { status: 400 });
  const topic = typeof body?.topic === 'string' && body.topic.trim() ? body.topic.trim().slice(0, 160) : 'everyday life';
  const context = typeof body?.context === 'string' ? body.context.trim().slice(0, 600) : '';
  const difficulty = (typeof body?.difficulty === 'string' ? body.difficulty : 'Intermediate') as Difficulty;

  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const level = difficultyDescriptions[difficulty] ?? difficultyDescriptions.Intermediate;
  const prompt = `LANGUAGE RULE: Write for English learners. ${level}
You are helping a teacher run a live conversation class for kids and teens.
Write exactly 3 ${KIND_BRIEF[kind]}.
Topic: "${topic}".${context ? `\nContext: ${context}` : ''}
Each item: "prompt" (one question or statement, max 18 words, natural and specific, never generic) and "followUps" (exactly 2 short follow-up questions to keep the talk going).
Keep everything classroom-safe. Return a JSON array of 3 objects.`;

  try {
    const items = await generateJSON<TalkPrompt[]>(prompt, schema, { temperature: 0.9 });
    const prompts = (Array.isArray(items) ? items : [])
      .filter((p) => p && typeof p.prompt === 'string' && p.prompt.trim())
      .slice(0, 3)
      .map((p) => ({ prompt: p.prompt.trim(), followUps: (p.followUps ?? []).filter((f) => typeof f === 'string').slice(0, 2) }));
    return NextResponse.json({ prompts });
  } catch {
    return NextResponse.json({ error: 'Could not write prompts right now' }, { status: 502 });
  }
}

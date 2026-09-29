import { NextResponse } from 'next/server';
import { generateJSON, type AISchema } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-credits';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Groups students' waiting messages that ask or say the same thing, so the
 * teacher sees "3 students wonder why cities flood" in the private inbox.
 * Messages never reach other students before the teacher chooses to show them.
 */
const schema: AISchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      label: { type: 'string' },
      ids: { type: 'array', items: { type: 'string' } },
    },
    required: ['label', 'ids'],
  },
};

interface MessageGroup { label: string; ids: string[] }

export async function POST(request: Request) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m: unknown): m is { id: string; text: string } => !!m && typeof (m as { id?: unknown }).id === 'string' && typeof (m as { text?: unknown }).text === 'string')
    .slice(0, 40)
    .map((m: { id: string; text: string }) => ({ id: m.id, text: m.text.slice(0, 300) }));
  if (messages.length < 2) return NextResponse.json({ groups: [] });

  const prompt = `Students in a live English class sent these messages to their teacher:
${messages.map((m: { id: string; text: string }) => `- [${m.id}] ${m.text}`).join('\n')}

Find messages that ask or say essentially the same thing. Return ONLY groups of 2 or more
messages, each with a short label (under 8 words, e.g. "Why do cities flood?") and the ids.
A message belongs to at most one group. Leave unique messages out.`;

  try {
    const raw = await generateJSON<MessageGroup[]>(prompt, schema, { taskClass: 'content-generation' });
    const known = new Set(messages.map((m: { id: string }) => m.id));
    const used = new Set<string>();
    const groups = (Array.isArray(raw) ? raw : [])
      .map((g) => ({
        label: typeof g?.label === 'string' ? g.label.trim().slice(0, 80) : '',
        ids: (Array.isArray(g?.ids) ? g.ids : []).filter((id) => known.has(id) && !used.has(id) && (used.add(id), true)),
      }))
      .filter((g) => g.label && g.ids.length >= 2);
    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ groups: [] });
  }
}

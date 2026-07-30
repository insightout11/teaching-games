import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { difficultyDescriptions } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

export const maxDuration = 60;

const schema: AISchema = {
  type: 'object',
  properties: {
    secret: { type: 'string' },
    category: { type: 'string', enum: ['person', 'place', 'thing', 'concept'] },
  },
  required: ['secret', 'category'],
};

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  // This will hit the AI. Enforce the free-tier weekly cap.
  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  try {
    const { topic, difficulty, sourceMaterial } = await request.json() as { topic: string; difficulty: Difficulty; sourceMaterial?: SourceMaterial };

    // Draw the secret from the lesson's source material when one is attached.
    const sourceContext = await resolveSourceContext(sourceMaterial);

    const prompt = `Choose a secret for a classroom 20 Questions game about "${topic}".
Difficulty: ${difficultyDescriptions[difficulty]}
${sourceContext}${sourceContext ? 'Pick the secret from the source material above so guessing reinforces the lesson.\n' : ''}
The secret MUST be specifically related to "${topic}" — a real person, place, thing, or well-known concept from that subject — so guessing it reinforces the lesson. Do NOT drift to a generic famous landmark, animal, or everyday object that is unrelated to "${topic}".
Rules:
- Well-known enough that students studying "${topic}" can deduce it with yes/no questions.
- Never pick the topic word itself — pick a specific example from within it.
- If "${topic}" is abstract (e.g. a field of study), anchor on something concrete within it: a key figure, a famous study or experiment, a named effect or phenomenon, a tool, or a widely-known term.
- Lower levels: the most familiar item within the topic. Higher levels: something more specific or nuanced.
- 1-4 words.

Return JSON with "secret" and "category" (person/place/thing/concept).`;

    const result = await generateJSON<{ secret: string; category: string }>(prompt, schema, { temperature: 0.8 });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Pick secret error:', error);
    return NextResponse.json({ error: 'Failed to pick secret' }, { status: 500 });
  }
}

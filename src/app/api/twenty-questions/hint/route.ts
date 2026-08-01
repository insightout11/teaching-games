import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';

export const maxDuration = 60;

interface HintRequest {
  secret: string;
  topic?: string;
  tone?: string;
  questionsHistory?: { question: string; answer: string }[];
  existingHints?: string[];
}

const schema: AISchema = {
  type: 'object',
  properties: {
    hint: {
      type: 'string',
      description: 'A spoiler-free clue about the secret',
    },
  },
  required: ['hint'],
};

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  try {
    const { secret, topic, tone, questionsHistory = [], existingHints = [] } =
      (await request.json()) as HintRequest;

    if (!secret) {
      return NextResponse.json({ error: 'Secret is required' }, { status: 400 });
    }

    // This will hit the AI. Enforce the free-tier weekly cap.
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    const historyText =
      questionsHistory.length > 0
        ? `\n\nQuestions the class has already asked:\n${questionsHistory.map((h) => `Q: ${h.question} -> ${h.answer}`).join('\n')}`
        : '';

    const hintsText =
      existingHints.length > 0
        ? `\n\nHints already given (make this one DIFFERENT and a little more revealing):\n${existingHints.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
        : '';

    const toneInstruction =
      tone === 'kid-friendly'
        ? 'Use simple, kid-friendly language.'
        : 'Keep it concise and clear.';

    const prompt = `You are the host of a classroom 20 Questions game. The secret is: "${secret}"${topic ? ` (topic: ${topic})` : ''}.

The class is stuck and needs a HINT. Give ONE helpful clue that nudges them toward the secret WITHOUT giving it away.

Rules:
- NEVER name the secret, spell it, rhyme it, or make it a one-word guess.
- Point at a property, category, function, era, place, or association — something that narrows the field.
- Don't contradict any yes/no/maybe answers already given.
- If earlier hints exist, make this one add NEW information and be slightly more revealing.
- One sentence, max 20 words. ${toneInstruction}${historyText}${hintsText}

Return JSON with a "hint" string.`;

    const result = await generateJSON<{ hint: string }>(prompt, schema, {
      temperature: 0.7,
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('Twenty Questions hint error:', error);
    return NextResponse.json({ error: 'Failed to generate hint' }, { status: 500 });
  }
}

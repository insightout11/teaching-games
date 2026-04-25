import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { difficultyDescriptions } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/difficulty';

const schema: AISchema = {
  type: 'object',
  properties: {
    secret: { type: 'string' },
    category: { type: 'string', enum: ['person', 'place', 'thing', 'concept'] },
  },
  required: ['secret', 'category'],
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json() as { topic: string; difficulty: Difficulty };

    const prompt = `You are choosing a secret for a classroom 20 Questions game.
Topic: ${topic}
Difficulty: ${difficultyDescriptions[difficulty]}

Pick ONE specific, interesting thing, person, place, or concept closely related to this topic that students can deduce with yes/no questions.
Rules:
- Must be well-known enough that students can guess it
- Should be concrete (not abstract ideas like "freedom")
- For Beginner/Easy: choose something very familiar (e.g. a well-known animal, everyday object, famous landmark)
- For Advanced/Expert: choose something more specific and nuanced
- Do NOT pick the topic word itself

Return JSON with "secret" (the chosen word/phrase, 1-4 words max) and "category" (person/place/thing/concept).`;

    const result = await generateJSON<{ secret: string; category: string }>(prompt, schema, { temperature: 0.8 });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Pick secret error:', error);
    return NextResponse.json({ error: 'Failed to pick secret' }, { status: 500 });
  }
}

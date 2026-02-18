import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/stores/session-store';

const difficultyLevels: Record<Difficulty, string> = {
  'Beginner': 'A1 beginner — use simple words and short sentences',
  'Easy': 'A2 elementary — use basic vocabulary and simple structure',
  'Intermediate': 'B1/B2 intermediate — use varied vocabulary and engaging detail',
  'Advanced': 'C1 advanced — use sophisticated language and vivid imagery',
  'Expert': 'C2/Native expert — use masterful prose with rich detail',
};

const schema: AISchema = {
  type: 'object',
  properties: {
    starterSentence: { type: 'string' },
  },
  required: ['starterSentence'],
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json() as {
      topic: string;
      difficulty: Difficulty;
    };

    const prompt = `Generate an engaging opening sentence for a collaborative story about "${topic}".
The sentence should hook readers and give students a clear direction to continue.
Write at ${difficultyLevels[difficulty]} level.
Keep it to exactly ONE sentence (15-30 words). Do not end the story — leave it open for continuation.`;

    const parsed = await generateJSON<{ starterSentence: string }>(prompt, schema, { taskClass: 'content-generation' });
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Starter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate starter sentence' },
      { status: 500 }
    );
  }
}

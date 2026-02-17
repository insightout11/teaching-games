import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';

export const dynamic = 'force-dynamic';

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very common, basic words with obvious connections.',
  'Easy': 'Easy (A2) level. Use simple words with fairly clear connections.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common vocabulary with moderate connections.',
  'Advanced': 'Advanced (C1) level. Use sophisticated vocabulary with subtle connections.',
  'Expert': 'Expert (C2/Native) level. Use nuanced vocabulary with obscure or creative connections.'
};

const schema: AISchema = {
  type: 'object',
  properties: {
    word1: { type: 'string' },
    word2: { type: 'string' },
    category: { type: 'string' },
    hint: { type: 'string' }
  },
  required: ['word1', 'word2', 'category', 'hint']
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json() as {
      topic: Topic;
      difficulty: Difficulty;
    };

    const randomSeed = Math.random().toString(36).substring(7);

    const prompt = `Generate a "What's the Link?" word pair challenge for ${difficultyPrompts[difficulty]}
Topic: ${topic}.
Random seed: ${randomSeed}

Create two words that share a hidden connection. The student must figure out what links them.

Requirements:
1. word1 and word2: Two words that seem unrelated at first but share a connection
2. category: The hidden connection (e.g., "Both are keyboard keys", "Both are types of clouds", "Both can follow the word 'fire'")
3. hint: A subtle clue that doesn't give away the answer (max 10 words)

Examples by difficulty:
- Beginner: "APPLE" + "BANANA" → "Both are fruits"
- Easy: "SHIFT" + "TAB" → "Both are keyboard keys"
- Intermediate: "APPLE" + "SAMSUNG" → "Both are tech companies"
- Advanced: "SPRING" + "FALL" → "Both are seasons AND verbs of movement"
- Expert: "MERCURY" + "MARS" → "Both are planets AND Roman gods"

Guidelines:
- The connection should be discoverable through vocabulary knowledge and reasoning
- Avoid overly obscure trivia that requires specialized knowledge
- For ${difficulty} level, adjust how obvious the connection is
- Make sure BOTH words clearly fit the category
- The words should appear unrelated at first glance
- Be creative and varied - choose different types of connections each time

Good connection types:
- Category membership (both are X)
- Compound words (both can precede/follow a word)
- Multiple meanings (both have dual meanings)
- Properties (both are colors, both have 4 letters)
- Cultural/thematic (both relate to X)`;

    const data = await generateJSON<{ word1: string; word2: string; category: string; hint: string }>(prompt, schema, { temperature: 1.2 });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}

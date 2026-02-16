import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty, Topic } from '@/stores/session-store';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use 4-5 very common words per sentence.',
  'Easy': 'Easy (A2) level. Use 5-6 simple, everyday words per sentence.',
  'Intermediate': 'Intermediate (B1/B2) level. Use 7-9 words per sentence with varied structure.',
  'Advanced': 'Advanced (C1) level. Use 9-12 words per sentence with complex grammar.',
  'Expert': 'Expert (C2/Native) level. Use 10-14 words per sentence with sophisticated structures.',
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json() as {
      topic: Topic;
      difficulty: Difficulty;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            sentences: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
          required: ['sentences'],
        },
        temperature: 1.2,
      },
    });

    const randomSeed = Math.random().toString(36).substring(7);

    const prompt = `Generate 10 sentences for a "Sentence Scramble" language learning game.

Difficulty: ${difficultyPrompts[difficulty]}
Topic: ${topic}
Random seed: ${randomSeed}

Requirements:
- Each sentence MUST relate to the topic "${topic}"
- Each sentence must be grammatically complete and properly punctuated
- Vary sentence structures (declarative, questions, conditionals, etc.)
- Do NOT repeat sentence patterns or openings
- Each sentence should be self-contained and make sense on its own
- Use natural, authentic language — not textbook-stilted
- Generate DIFFERENT sentences each time — be creative!`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Sentence scramble generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sentences' },
      { status: 500 }
    );
  }
}

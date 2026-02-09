import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty, Topic } from '@/stores/session-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very common, simple words.',
  'Easy': 'Easy (A2) level. Use simple, everyday words.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common vocabulary.',
  'Advanced': 'Advanced (C1) level. Use more sophisticated words.',
  'Expert': 'Expert (C2/Native) level. Use advanced vocabulary.'
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
            startingWord: { type: SchemaType.STRING },
            hint: { type: SchemaType.STRING }
          },
          required: ['startingWord', 'hint']
        }
      }
    });

    const prompt = `Generate a starting word for a word association chain game at ${difficultyPrompts[difficulty]}
Topic: ${topic}.

Choose a starting word that:
1. Has MANY possible associations (at least 10+ related concepts)
2. Is appropriate for ${difficulty} level
3. Relates to the ${topic} topic
4. Is a concrete noun or common concept (easier to associate)

Also provide a short hint about the type of associations expected (max 8 words).

Good starting words have rich associations: ocean, music, family, city, food, technology, nature, etc.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate starting word' },
      { status: 500 }
    );
  }
}

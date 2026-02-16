import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty } from '@/stores/session-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const difficultyLevels: Record<Difficulty, string> = {
  'Beginner': 'A1 beginner — use simple words and short sentences',
  'Easy': 'A2 elementary — use basic vocabulary and simple structure',
  'Intermediate': 'B1/B2 intermediate — use varied vocabulary and engaging detail',
  'Advanced': 'C1 advanced — use sophisticated language and vivid imagery',
  'Expert': 'C2/Native expert — use masterful prose with rich detail',
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json() as {
      topic: string;
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
            starterSentence: { type: SchemaType.STRING },
          },
          required: ['starterSentence'],
        },
      },
    });

    const prompt = `Generate an engaging opening sentence for a collaborative story about "${topic}".
The sentence should hook readers and give students a clear direction to continue.
Write at ${difficultyLevels[difficulty]} level.
Keep it to exactly ONE sentence (15-30 words). Do not end the story — leave it open for continuation.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Starter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate starter sentence' },
      { status: 500 }
    );
  }
}

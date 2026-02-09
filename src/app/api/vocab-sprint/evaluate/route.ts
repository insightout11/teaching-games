import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty } from '@/stores/session-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface EvaluationResult {
  score: number;
  comment: string;
  isValid: boolean;
  suggestions: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { originalSentence, weakWord, replacement, difficulty } = await request.json() as {
      originalSentence: string;
      weakWord: string;
      replacement: string;
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
            score: { type: SchemaType.INTEGER },
            comment: { type: SchemaType.STRING },
            isValid: { type: SchemaType.BOOLEAN },
            suggestions: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            }
          },
          required: ['score', 'comment', 'isValid', 'suggestions']
        }
      }
    });

    const prompt = `Original Sentence: "${originalSentence}"
Weak word targeted: "${weakWord}"
Student's suggested replacement: "${replacement}"
Context Difficulty: ${difficulty}

Task: Evaluate the replacement word based on how well it fits the context and upgrades the language at a ${difficulty} level.
- Score 1 to 10.
- 3-4 superior alternatives for a score of 10.
- Short, energetic comment (max 10 words).`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const evaluation: EvaluationResult = JSON.parse(text);
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate replacement' },
      { status: 500 }
    );
  }
}

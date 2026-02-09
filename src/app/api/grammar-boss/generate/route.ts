import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import { GrammarTarget } from '@/games/grammar-boss/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very simple sentence structures.',
  'Easy': 'Easy (A2) level. Use simple but functional sentence patterns.',
  'Intermediate': 'Intermediate (B1/B2) level. Use common sentence structures.',
  'Advanced': 'Advanced (C1) level. Use complex, nuanced sentence structures.',
  'Expert': 'Expert (C2/Native) level. Use sophisticated, academic structures.'
};

export async function POST(request: NextRequest) {
  try {
    const { grammarTarget, topic, difficulty } = await request.json() as {
      grammarTarget: GrammarTarget;
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
            task: { type: SchemaType.STRING },
            exampleSentence: { type: SchemaType.STRING }
          },
          required: ['task', 'exampleSentence']
        }
      }
    });

    const prompt = `Generate a short speaking challenge for an English learner at ${difficultyPrompts[difficulty]}
Topic: ${topic}.
Target Grammar: ${grammarTarget}.

Provide:
1. A concise, engaging speaking task (1-2 sentences) appropriate for a ${difficulty} level student that naturally requires the target grammar (${grammarTarget}).
2. A perfect example sentence using the target grammar correctly, tailored to the ${difficulty} level complexity.

The task should prompt the student to speak about the given topic while using the specified grammar structure.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const data = JSON.parse(text);
    return NextResponse.json({
      task: data.task || 'Speak about your recent experiences.',
      exampleSentence: data.exampleSentence || 'I have been working on this project for three months.'
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}

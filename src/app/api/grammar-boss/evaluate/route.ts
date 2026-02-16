import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty } from '@/stores/session-store';
import { GrammarTarget } from '@/games/grammar-boss/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1)',
  'Easy': 'Easy (A2)',
  'Intermediate': 'Intermediate (B1/B2)',
  'Advanced': 'Advanced (C1)',
  'Expert': 'Expert (C2/Native)'
};

export async function POST(request: NextRequest) {
  try {
    const { sentence, grammarTarget, task, difficulty } = await request.json() as {
      sentence: string;
      grammarTarget: GrammarTarget;
      task: string;
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
            grammarScore: { type: SchemaType.INTEGER },
            fluencyScore: { type: SchemaType.INTEGER },
            correctedSentence: { type: SchemaType.STRING },
            feedback: { type: SchemaType.STRING }
          },
          required: ['grammarScore', 'fluencyScore', 'correctedSentence', 'feedback']
        }
      }
    });

    const prompt = `Act as a Friendly Peer.
Evaluate the following student sentence for grammar accuracy and fluency.
Level: ${difficultyPrompts[difficulty]}
Student Sentence: "${sentence}"
Target Grammar: ${grammarTarget}
Context/Task: ${task}

Requirements:
1. Grammar Score (1-10): Score relative to ${difficulty} level expectations. Focus on whether the target grammar (${grammarTarget}) is used correctly.
2. Fluency Score (1-10): How natural and idiomatic the student sounds.
3. Corrected Version: A natural, polished version of the sentence appropriate for ${difficulty} level.
4. Feedback: Use a Friendly Peer tone. Keep it motivational and professional (max 3 sentences).`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const evaluation = JSON.parse(text);
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate sentence' },
      { status: 500 }
    );
  }
}

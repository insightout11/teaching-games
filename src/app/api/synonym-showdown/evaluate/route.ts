import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty } from '@/stores/session-store';

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
    const { targetWord, contextSentence, synonym, difficulty } = await request.json() as {
      targetWord: string;
      contextSentence: string;
      synonym: string;
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
            isValid: { type: SchemaType.BOOLEAN },
            score: { type: SchemaType.INTEGER },
            quality: { type: SchemaType.STRING },
            feedback: { type: SchemaType.STRING }
          },
          required: ['isValid', 'score', 'quality', 'feedback']
        }
      }
    });

    const prompt = `Evaluate if this synonym is valid for a ${difficultyPrompts[difficulty]} level English learner.

Target word: "${targetWord}"
Context: "${contextSentence}"
Submitted synonym: "${synonym}"

Evaluate:
1. isValid: Does "${synonym}" work as a synonym for "${targetWord}" in this context? Be reasonably accepting.
2. score: 1-10 based on how good the synonym is (contextual fit + sophistication)
3. quality: "basic" (common/simple), "good" (appropriate), or "excellent" (sophisticated/precise)
4. feedback: Very brief feedback (max 10 words) - encouraging if valid, gentle correction if not

Rules:
- Accept informal/slang synonyms at lower difficulty levels
- The synonym must make sense in the given context
- Reward more sophisticated or precise synonyms with higher scores
- Be lenient - if it's close enough, accept it`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const evaluation = JSON.parse(text);
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate synonym' },
      { status: 500 }
    );
  }
}

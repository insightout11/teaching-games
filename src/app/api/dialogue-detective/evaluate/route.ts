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
    const { speakerA_before, speakerA_after, response, goal, difficulty } = await request.json() as {
      speakerA_before: string;
      speakerA_after: string;
      response: string;
      goal: string;
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
            contextFit: { type: SchemaType.INTEGER },
            naturalness: { type: SchemaType.INTEGER },
            leadIn: { type: SchemaType.INTEGER },
            creativityBonus: { type: SchemaType.INTEGER },
            feedback: { type: SchemaType.STRING },
            exampleResponse: { type: SchemaType.STRING }
          },
          required: ['contextFit', 'naturalness', 'leadIn', 'creativityBonus', 'feedback', 'exampleResponse']
        }
      }
    });

    const prompt = `Evaluate this dialogue response for a ${difficultyPrompts[difficulty]} level English learner.

Conversation:
A: "${speakerA_before}"
B: "${response}" ← Student's answer
A: "${speakerA_after}"

B's goal was: ${goal}

Score each criterion (1-10):
1. contextFit: Does B's response make sense after A's first line?
2. naturalness: Does it sound like natural English conversation?
3. leadIn: Does it logically lead to A's second response?
4. creativityBonus: 0-2 bonus points for creative/funny responses that still work

Also provide:
- feedback: Brief feedback (2-3 sentences) on what worked and what could improve
- exampleResponse: One example of a response that would work perfectly

Be flexible - there are many valid ways to fill this blank. Focus on whether the conversation flows naturally.`;

    const result = await model.generateContent(prompt);
    const response_data = result.response;
    const text = response_data.text();

    const evaluation = JSON.parse(text);

    // Calculate overall score
    const baseScore = Math.round(
      (evaluation.contextFit * 0.35) +
      (evaluation.naturalness * 0.3) +
      (evaluation.leadIn * 0.35)
    );
    const finalScore = Math.min(10, baseScore + evaluation.creativityBonus);

    return NextResponse.json({
      ...evaluation,
      score: finalScore
    });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate response' },
      { status: 500 }
    );
  }
}

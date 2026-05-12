import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-credits';
import type { Difficulty } from '@/stores/session-store';

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1)',
  'Easy': 'Easy (A2)',
  'Intermediate': 'Intermediate (B1/B2)',
  'Advanced': 'Advanced (C1)',
  'Expert': 'Expert (C2/Native)'
};

const schema: AISchema = {
  type: 'object',
  properties: {
    contextFit: { type: 'integer' },
    naturalness: { type: 'integer' },
    leadIn: { type: 'integer' },
    creativityBonus: { type: 'integer' },
    feedback: { type: 'string' },
    exampleResponse: { type: 'string' }
  },
  required: ['contextFit', 'naturalness', 'leadIn', 'creativityBonus', 'feedback', 'exampleResponse']
};

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { speakerA_before, speakerA_after, response, goal, difficulty } = await request.json() as {
      speakerA_before: string;
      speakerA_after: string;
      response: string;
      goal: string;
      difficulty: Difficulty;
    };

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

    const evaluation = await generateJSON<{
      contextFit: number;
      naturalness: number;
      leadIn: number;
      creativityBonus: number;
      feedback: string;
      exampleResponse: string;
    }>(prompt, schema, { taskClass: 'evaluation' });

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

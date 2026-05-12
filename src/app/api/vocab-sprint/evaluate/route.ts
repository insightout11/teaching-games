import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-credits';
import type { Difficulty } from '@/stores/session-store';

export interface EvaluationResult {
  score: number;
  comment: string;
  isValid: boolean;
  suggestions: string[];
}

const schema: AISchema = {
  type: 'object',
  properties: {
    score: { type: 'integer' },
    comment: { type: 'string' },
    isValid: { type: 'boolean' },
    suggestions: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['score', 'comment', 'isValid', 'suggestions']
};

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { originalSentence, weakWord, replacement, difficulty, level, targetWord } = await request.json() as {
      originalSentence: string;
      weakWord: string;
      replacement: string;
      difficulty: Difficulty;
      level?: 'easy' | 'medium' | 'hard';
      targetWord?: string;
    };

    const prompt = level === 'hard' && targetWord
      ? `Original sentence: "${originalSentence}"
Descriptive phrase: "${weakWord}"
Expected precise term: "${targetWord}"
Student's answer: "${replacement}"
Difficulty: ${difficulty}

Task: The student must recall the exact vocabulary term described by the phrase.
- Score 10 if the student produced "${targetWord}" or a very close equivalent.
- Score 6–9 for related terms that show understanding but lack precision.
- Score 1–5 for wrong or unrelated answers.
- Short, energetic comment (max 10 words).
- For score < 10: suggestions should include "${targetWord}" as the first item plus 1–2 related terms.`
      : `Original Sentence: "${originalSentence}"
Weak word targeted: "${weakWord}"
Student's suggested replacement: "${replacement}"
Context Difficulty: ${difficulty}

Task: Evaluate the replacement word based on how well it fits the context and upgrades the language at a ${difficulty} level.
- Score 1 to 10.
- 3-4 superior alternatives for a score of 10.
- Short, energetic comment (max 10 words).`;

    const evaluation = await generateJSON<EvaluationResult>(prompt, schema, { taskClass: 'evaluation' });
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate replacement' },
      { status: 500 }
    );
  }
}

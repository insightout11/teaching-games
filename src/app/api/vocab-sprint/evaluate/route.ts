import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
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
  try {
    const { originalSentence, weakWord, replacement, difficulty } = await request.json() as {
      originalSentence: string;
      weakWord: string;
      replacement: string;
      difficulty: Difficulty;
    };

    const prompt = `Original Sentence: "${originalSentence}"
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

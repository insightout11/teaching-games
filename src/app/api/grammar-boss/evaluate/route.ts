import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import type { Difficulty } from '@/stores/session-store';
import { GrammarTarget } from '@/games/grammar-boss/types';

export const maxDuration = 60;

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
    grammarScore: { type: 'integer' },
    fluencyScore: { type: 'integer' },
    correctedSentence: { type: 'string' },
    feedback: { type: 'string' }
  },
  required: ['grammarScore', 'fluencyScore', 'correctedSentence', 'feedback']
};

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuthForGeneration();
  if (authError) return authError;

  try {
    const { sentence, grammarTarget, task, difficulty } = await request.json() as {
      sentence: string;
      grammarTarget: GrammarTarget;
      task: string;
      difficulty: Difficulty;
    };

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

    const evaluation = await generateJSON<{ grammarScore: number; fluencyScore: number; correctedSentence: string; feedback: string }>(prompt, schema, { taskClass: 'evaluation' });
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate sentence' },
      { status: 500 }
    );
  }
}

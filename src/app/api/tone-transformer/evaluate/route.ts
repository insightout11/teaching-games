import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/stores/session-store';
import { TargetTone, TONE_DESCRIPTIONS } from '@/games/tone-transformer/types';

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
    toneMatch: { type: 'integer' },
    meaningPreserved: { type: 'integer' },
    grammarScore: { type: 'integer' },
    feedback: { type: 'string' },
    alternatives: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['toneMatch', 'meaningPreserved', 'grammarScore', 'feedback', 'alternatives']
};

export async function POST(request: NextRequest) {
  try {
    const { originalSentence, rewrittenSentence, targetTone, difficulty } = await request.json() as {
      originalSentence: string;
      rewrittenSentence: string;
      targetTone: TargetTone;
      difficulty: Difficulty;
    };

    const toneDescription = TONE_DESCRIPTIONS[targetTone];

    const prompt = `Evaluate this tone transformation attempt by a ${difficultyPrompts[difficulty]} level English learner.

Original sentence: "${originalSentence}"
Target tone: ${targetTone} (${toneDescription})
Student's rewrite: "${rewrittenSentence}"

Score each criterion from 1-10:
1. Tone Match: How well does the rewrite match the target ${targetTone} tone?
2. Meaning Preserved: Does the rewrite keep the original message intact? (10 = perfect, 1 = completely different meaning)
3. Grammar Score: Is the sentence grammatically correct for ${difficulty} level?

Also provide:
- Feedback: Brief, encouraging feedback (2-3 sentences max) highlighting what worked and one tip for improvement
- Alternatives: 2 example rewrites that nail the ${targetTone} tone perfectly

Be appropriately lenient for ${difficulty} level - focus on whether they achieved the tone shift.`;

    const evaluation = await generateJSON<{
      toneMatch: number;
      meaningPreserved: number;
      grammarScore: number;
      feedback: string;
      alternatives: string[];
    }>(prompt, schema, { taskClass: 'evaluation' });

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (evaluation.toneMatch * 0.5) +
      (evaluation.meaningPreserved * 0.3) +
      (evaluation.grammarScore * 0.2)
    );

    return NextResponse.json({
      ...evaluation,
      score: overallScore
    });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate sentence' },
      { status: 500 }
    );
  }
}

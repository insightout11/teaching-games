import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
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
    isValid: { type: 'boolean' },
    score: { type: 'integer' },
    quality: { type: 'string' },
    feedback: { type: 'string' }
  },
  required: ['isValid', 'score', 'quality', 'feedback']
};

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  // This will hit the AI. Enforce the free-tier weekly cap.
  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  try {
    const { targetWord, contextSentence, synonym, difficulty } = await request.json() as {
      targetWord: string;
      contextSentence: string;
      synonym: string;
      difficulty: Difficulty;
    };

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

    const evaluation = await generateJSON<{ isValid: boolean; score: number; quality: string; feedback: string }>(prompt, schema, { taskClass: 'evaluation' });
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate synonym' },
      { status: 500 }
    );
  }
}

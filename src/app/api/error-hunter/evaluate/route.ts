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
    totalErrors: { type: 'integer' },
    found: { type: 'integer' },
    correctFixes: { type: 'integer' },
    falsePositives: { type: 'integer' },
    score: { type: 'integer' },
    feedback: { type: 'string' },
    solutions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          position: { type: 'integer' },
          word: { type: 'string' },
          errorType: { type: 'string' },
          correction: { type: 'string' },
          context: { type: 'string' }
        },
        required: ['position', 'word', 'errorType', 'correction', 'context']
      }
    }
  },
  required: ['totalErrors', 'found', 'correctFixes', 'falsePositives', 'score', 'feedback', 'solutions']
};

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  // This will hit the AI. Enforce the free-tier weekly cap.
  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  try {
    const { paragraph, corrections, difficulty } = await request.json() as {
      paragraph: string;
      corrections: Array<{ position: number; original: string; correction: string }>;
      difficulty: Difficulty;
    };

    const correctionsText = corrections.length > 0
      ? corrections.map(c => `- Position ${c.position}: "${c.original}" → "${c.correction}"`).join('\n')
      : 'No corrections submitted';

    const prompt = `Evaluate error corrections for a ${difficultyPrompts[difficulty]} level English learner.

Original paragraph with errors:
"${paragraph}"

Student's corrections:
${correctionsText}

Analyze the paragraph and the student's corrections:
1. Find ALL actual errors in the paragraph
2. Check which errors the student found correctly
3. Check if their corrections are valid (accept any reasonable fix)
4. Identify false positives (marking correct text as wrong)

Scoring (1-10):
- 10: Found all errors with correct fixes
- 7-9: Found most errors with mostly correct fixes
- 4-6: Found some errors, some correct fixes
- 1-3: Missed most errors or many wrong fixes

Provide:
- totalErrors: Actual number of errors in the paragraph
- found: How many real errors the student identified
- correctFixes: How many fixes were correct
- falsePositives: How many non-errors were marked
- score: Overall score (1-10)
- feedback: Brief feedback (2-3 sentences) - what they caught, what they missed
- solutions: Array of ALL actual errors with correct fixes. For each error include a "context" field: a 4-6 word excerpt from the paragraph surrounding the error word (e.g. "player he had ever seen"), so teachers can identify exactly which word is wrong when the same word appears multiple times.

IMPORTANT: Double-check each solution — only flag words that are genuinely incorrect. Do not mark grammatically correct words as errors.`;

    const evaluation = await generateJSON<{
      totalErrors: number;
      found: number;
      correctFixes: number;
      falsePositives: number;
      score: number;
      feedback: string;
      solutions: Array<{ position: number; word: string; errorType: string; correction: string; context: string }>;
    }>(prompt, schema, { taskClass: 'evaluation' });
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate corrections' },
      { status: 500 }
    );
  }
}

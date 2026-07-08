import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import type { Difficulty } from '@/stores/session-store';
import type { SentenceEvaluationResult } from '@/games/grid-rush/types';

export const maxDuration = 60;

const WORD_COUNT_CAP_THRESHOLD = 8;  // sentences under this word count are capped at 2

const difficultyLabels: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1)',
  'Easy': 'Easy (A2)',
  'Intermediate': 'Intermediate (B1/B2)',
  'Advanced': 'Advanced (C1)',
  'Expert': 'Expert (C2/Native)',
};

const schema: AISchema = {
  type: 'object',
  properties: {
    score: { type: 'integer' },
    feedback: { type: 'string' },
  },
  required: ['score', 'feedback'],
};

export async function POST(request: NextRequest) {
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  try {
    const { sentence, studentWords, topic, difficulty } = await request.json() as {
      sentence: string;
      studentWords: string[];   // lowercase words the student found in Round 1
      topic: string;
      difficulty: Difficulty;
    };

    const trimmed = (sentence ?? '').trim();

    // 1. Word presence check (sync, no AI)
    const sentenceLower = trimmed.toLowerCase();
    const wordsFound = studentWords.filter((w) => {
      // Check as whole word or as part of word (flexible — student may have used plural, etc.)
      return sentenceLower.includes(w.toLowerCase());
    });
    const meetsMinWords = wordsFound.length >= 2;

    if (!meetsMinWords) {
      return NextResponse.json<SentenceEvaluationResult>({
        score: 0,
        feedback: 'You need to use at least 2 of your Round 1 words in your sentence.',
        wordsFound,
        meetsMinWords: false,
      });
    }

    // 2. Word count check — cap score at 2 if sentence is too short
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const isTooShort = wordCount < WORD_COUNT_CAP_THRESHOLD;

    // Past the cheap checks — this will hit the AI. Enforce the free-tier weekly cap.
    const limited = await checkAndRecordAiUsage(teacher);
    if (limited) return limited;

    // 3. AI evaluation
    const prompt = `You are evaluating a sentence written by a ${difficultyLabels[difficulty]} level English learner.
Topic: ${topic}
Student's Round 1 words (they must use 2+): ${studentWords.join(', ')}
Words found in sentence: ${wordsFound.join(', ')}
Sentence: "${trimmed}"

Score the sentence from 1 to 5 using these strict criteria:
- 5: Grammatically correct, coherent, natural phrasing, words used meaningfully in context, relevant to topic
- 4: Mostly correct with minor errors, words used appropriately
- 3: Understandable but noticeable grammar issues or slightly unnatural phrasing
- 2: Significant grammar problems or words used incorrectly/awkwardly
- 1: Barely coherent, words crammed in without meaningful context

IMPORTANT RULES:
- A score of 5 requires genuine grammatical correctness AND natural expression. Do NOT give 5 for anything with errors.
- Penalise sentences that are nonsense filler or that merely list words without forming a real thought.
- Be appropriately lenient for the difficulty level (${difficultyLabels[difficulty]}).
- Provide encouraging but honest feedback (max 20 words).`;

    const result = await generateJSON<{ score: number; feedback: string }>(
      prompt,
      schema,
      { taskClass: 'evaluation' },
    );

    // Clamp score to 1-5
    let score = Math.max(1, Math.min(5, Math.round(result.score)));

    // Apply soft minimum length cap
    if (isTooShort && score > 2) {
      score = 2;
    }

    return NextResponse.json<SentenceEvaluationResult>({
      score,
      feedback: result.feedback,
      wordsFound,
      meetsMinWords: true,
    });
  } catch (error) {
    console.error('[grid-rush/evaluate-sentence] error:', error);
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}

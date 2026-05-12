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
    isCorrect: { type: 'boolean' },
    score: { type: 'integer' },
    quality: { type: 'string' },
    feedback: { type: 'string' },
    actualConnection: { type: 'string' }
  },
  required: ['isCorrect', 'score', 'quality', 'feedback', 'actualConnection']
};

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { word1, word2, category, guess, difficulty } = await request.json() as {
      word1: string;
      word2: string;
      category: string;
      guess: string;
      difficulty: Difficulty;
    };

    const prompt = `Evaluate a student's guess for the connection between two words.
Difficulty level: ${difficultyPrompts[difficulty]}

Word 1: "${word1}"
Word 2: "${word2}"
Intended connection: "${category}"
Student's guess: "${guess}"

Evaluate the student's answer:

1. isCorrect: Is the guess a VALID connection? Accept ANY legitimate connection, not just the intended one!
2. score: 1-10 points based on:
   - 0: Completely wrong or too vague ("both are words", "both exist", "I've heard of both")
   - 1-3: Weak connection that's technically true but trivial
   - 4-6: Valid connection that works
   - 7-8: Good connection that shows understanding
   - 9-10: Excellent or creative connection (matches intended OR finds a clever alternative)
3. quality:
   - "wrong": Invalid or meaninglessly vague connection
   - "partial": Weak but technically valid connection
   - "correct": Good, valid connection
   - "creative": Found the intended connection OR discovered an equally good/better one
4. feedback: Brief encouraging feedback (max 15 words)
5. actualConnection: Always return the intended connection "${category}" so the student can learn

IMPORTANT RULES:
- Be GENEROUS - accept any reasonable connection that legitimately links both words
- If the student's connection is DIFFERENT but VALID, give full credit!
- Reject only truly meaningless connections ("both are English words", "both have letters")
- The goal is to reward creative thinking, not just matching the expected answer
- A creative alternative connection can score 10/10

Examples of what to ACCEPT:
- If words are "APPLE" and "SAMSUNG", accept "tech companies", "phone makers", "Korean company and American fruit", etc.
- If words are "SHIFT" and "TAB", accept "keyboard keys", "both used in typing", "computer buttons", etc.

Examples of what to REJECT:
- "Both are words"
- "I know both of these"
- "They both have vowels"`;

    const evaluation = await generateJSON<{
      isCorrect: boolean;
      score: number;
      quality: string;
      feedback: string;
      actualConnection: string;
    }>(prompt, schema, { taskClass: 'evaluation' });
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    );
  }
}

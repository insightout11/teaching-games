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

const baseSchema: AISchema = {
  type: 'object',
  properties: {
    isValid: { type: 'boolean' },
    connectionStrength: { type: 'string' },
    score: { type: 'integer' },
    feedback: { type: 'string' },
  },
  required: ['isValid', 'connectionStrength', 'score', 'feedback']
};

const bonusSchema: AISchema = {
  type: 'object',
  properties: {
    isValid: { type: 'boolean' },
    connectionStrength: { type: 'string' },
    score: { type: 'integer' },
    feedback: { type: 'string' },
    bonusAchieved: { type: 'boolean' },
  },
  required: ['isValid', 'connectionStrength', 'score', 'feedback', 'bonusAchieved']
};

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { previousWord, newWord, chainHistory, difficulty, bonusChallenge } = await request.json() as {
      previousWord: string;
      newWord: string;
      chainHistory: string[];
      difficulty: Difficulty;
      bonusChallenge?: { type: 'topic' | 'syllable' | 'letter' | 'vocabulary'; description: string; letter?: string };
    };

    // Check for repeats client-side too, but double-check here
    const lowerNew = newWord.toLowerCase().trim();
    const lowerHistory = chainHistory.map(w => w.toLowerCase());
    if (lowerHistory.includes(lowerNew)) {
      return NextResponse.json({
        isValid: false,
        connectionStrength: 'weak',
        score: 0,
        feedback: 'This word was already used in the chain!',
        chainLength: chainHistory.length
      });
    }

    const needsBonusCheck = bonusChallenge && (bonusChallenge.type === 'topic' || bonusChallenge.type === 'vocabulary');

    const prompt = `Evaluate this word association for a ${difficultyPrompts[difficulty]} level English learner.

Previous word: "${previousWord}"
New word: "${newWord}"
Chain so far: ${chainHistory.join(' → ')}

Is "${newWord}" DIRECTLY connected to "${previousWord}"?

Evaluate:
1. isValid: Is there a CLEAR, DIRECT connection? The link must be obvious and explainable in a few words.
2. connectionStrength: "weak" (tenuous link), "moderate" (clear category/theme link), "strong" (direct obvious relationship), "creative" (unexpected but clever connection)
3. score: 1-10 based on connection quality. 1-3 = weak but valid, 4-6 = solid connection, 7-9 = strong/obvious, 10 = perfect/creative
4. feedback: Very brief (max 12 words) - explain the connection or why it doesn't work

STRICT RULES - Be critical:
- REJECT vague or forced connections (e.g., "both are things" or "both can be described")
- REJECT if you have to stretch to explain the link
- ACCEPT: synonyms, antonyms, same category (animals, foods, etc.), cause-effect, part-whole, compound words, rhymes, common phrases
- The connection must be something most people would immediately understand
- When in doubt, mark as INVALID - this is a challenge game, not a free-for-all${
      needsBonusCheck
        ? `\n\nBONUS CHALLENGE: ${bonusChallenge.description}
5. bonusAchieved: true/false - Did the word "${newWord}" meet this bonus challenge?${
          bonusChallenge.type === 'topic'
            ? ' Check if the word clearly relates to the topic.'
            : ' Check if the word is advanced, uncommon, or sophisticated for this level.'
        }`
        : ''
    }`;

    const evaluation = await generateJSON<{
      isValid: boolean;
      connectionStrength: string;
      score: number;
      feedback: string;
      bonusAchieved?: boolean;
    }>(prompt, needsBonusCheck ? bonusSchema : baseSchema, { taskClass: 'evaluation' });

    return NextResponse.json({
      ...evaluation,
      bonusAchieved: evaluation.bonusAchieved ?? false,
      chainLength: evaluation.isValid ? chainHistory.length + 1 : chainHistory.length
    });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate word' },
      { status: 500 }
    );
  }
}

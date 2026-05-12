import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-credits';
import type { WordValidationResult } from '@/games/grid-rush/types';

const wordCheckSchema: AISchema = {
  type: 'object',
  properties: {
    isWord: { type: 'boolean' },
  },
  required: ['isWord'],
};

function letterCheck(word: string, letters: string[]): boolean {
  const pool = new Set(letters.map((l) => l.toUpperCase()));
  return word.toUpperCase().split('').every((ch) => pool.has(ch));
}

function computePoints(word: string, hasBonusLetter: boolean, isTopicWord: boolean): number {
  const len = word.length;
  const base = len <= 4 ? 1 : len === 5 ? 2 : 3;
  return base + (hasBonusLetter ? 1 : 0) + (isTopicWord ? 2 : 0);
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { word, letters, bonusLetter, topicWords } = await request.json() as {
      word: string;
      letters: string[];
      bonusLetter: string;
      topicWords: string[];
    };

    const normalized = (word ?? '').toLowerCase().trim();

    // 1. Length check
    if (normalized.length < 3) {
      return NextResponse.json<WordValidationResult>({
        isValid: false, isTopicWord: false, hasBonusLetter: false, points: 0,
        reason: 'Too short (minimum 3 letters)',
      });
    }

    // 2. Letter check — every char in word must exist somewhere in the grid
    if (!letterCheck(normalized, letters)) {
      return NextResponse.json<WordValidationResult>({
        isValid: false, isTopicWord: false, hasBonusLetter: false, points: 0,
        reason: 'Uses letters not available in the grid',
      });
    }

    // 3. Real English word check (AI)
    const wordCheck = await generateJSON<{ isWord: boolean }>(
      `Is "${normalized}" a standard real English word (not a proper noun, not an abbreviation)? Answer with {isWord: true} if yes, {isWord: false} if no.`,
      wordCheckSchema,
      { taskClass: 'evaluation' },
    );

    if (!wordCheck.isWord) {
      return NextResponse.json<WordValidationResult>({
        isValid: false, isTopicWord: false, hasBonusLetter: false, points: 0,
        reason: 'Not a recognised English word',
      });
    }

    // 4. Bonus letter check
    const hasBonusLetter = normalized.includes(bonusLetter.toLowerCase());

    // 5. Topic word check — exact match only (MVP: no secondary AI check)
    const isTopicWord = topicWords.map((w) => w.toLowerCase()).includes(normalized);

    // 6. Compute points
    const points = computePoints(normalized, hasBonusLetter, isTopicWord);

    return NextResponse.json<WordValidationResult>({
      isValid: true, isTopicWord, hasBonusLetter, points,
    });
  } catch (error) {
    console.error('[grid-rush/validate-word] error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}

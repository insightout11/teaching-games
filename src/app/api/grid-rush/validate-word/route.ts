import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { WordValidationResult } from '@/games/grid-rush/types';

const wordCheckSchema: AISchema = {
  type: 'object',
  properties: {
    isWord: { type: 'boolean' },
  },
  required: ['isWord'],
};

/**
 * Checks if the letters of `word` can be formed from the available `letters` pool.
 * Each letter in the pool may be used at most once per word.
 */
function multisetCheck(word: string, letters: string[]): boolean {
  const pool = letters.map((l) => l.toUpperCase());
  const chars = word.toUpperCase().split('');
  for (const ch of chars) {
    const idx = pool.indexOf(ch);
    if (idx === -1) return false;
    pool.splice(idx, 1);
  }
  return true;
}

function computePoints(word: string, hasBonusLetter: boolean, isTopicWord: boolean): number {
  const len = word.length;
  const base = len <= 4 ? 1 : len === 5 ? 2 : 3;
  return base + (hasBonusLetter ? 1 : 0) + (isTopicWord ? 2 : 0);
}

export async function POST(request: NextRequest) {
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

    // 2. Multiset check — must be doable from grid letters
    if (!multisetCheck(normalized, letters)) {
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

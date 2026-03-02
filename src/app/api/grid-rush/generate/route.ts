import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import { getCachedContent, storeCachedContent } from '@/lib/content-cache';
import type { GridContent } from '@/games/grid-rush/types';

const GAME_KEY = 'grid-rush';
const SCHEMA_VERSION = 1;

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) — use common 3-5 letter words, mostly simple consonants and short vowels',
  'Easy': 'Easy (A2) — a good mix of 3-6 letter everyday words',
  'Intermediate': 'Intermediate (B1/B2) — include some longer words (6-7 letters) and less common vocabulary',
  'Advanced': 'Advanced (C1) — favor letters that enable sophisticated vocabulary',
  'Expert': 'Expert (C2/Native) — prioritize letters enabling academic and nuanced vocabulary',
};

const schema: AISchema = {
  type: 'object',
  properties: {
    letters: { type: 'array', items: { type: 'string' } },
    bonusLetter: { type: 'string' },
    bonusIndex: { type: 'integer' },
    topicWords: { type: 'array', items: { type: 'string' } },
  },
  required: ['letters', 'bonusLetter', 'bonusIndex', 'topicWords'],
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty, excludeCacheIds = [] } = await request.json() as {
      topic: Topic;
      difficulty: Difficulty;
      excludeCacheIds?: string[];
    };

    // 1. Cache-first
    const cached = await getCachedContent(GAME_KEY, topic, difficulty, excludeCacheIds);
    if (cached) {
      return NextResponse.json({ grid: cached.content_json as GridContent, cacheId: cached.id });
    }

    // 2. Generate via AI
    const prompt = `Generate a 3x3 letter grid for a word-building race game for ${difficultyPrompts[difficulty]}.
Topic: ${topic}

REQUIREMENTS:
1. Provide exactly 9 uppercase single letters in a flat array called "letters" (indices 0-8).
2. Choose a good vowel/consonant balance: aim for 3-4 vowels (A,E,I,O,U) and 5-6 consonants.
3. The letters should allow students to form many real English words of 3+ letters (each grid letter used at most once per word).
4. Choose letters that pair well with the topic "${topic}" — students who know topic vocabulary will have an advantage.
5. Choose one letter as the bonus letter ("bonusLetter") and its position 0-8 ("bonusIndex").
6. Provide 3-6 "topicWords": real English words related to "${topic}" that students might think to form. Use lowercase. These do NOT need to all be exactly formable from the letters — they serve as reference for the topic-word bonus.

Example for topic "ocean" with letters [S,E,A,R,T,I,N,O,C]:
{
  "letters": ["S","E","A","R","T","I","N","O","C"],
  "bonusLetter": "C",
  "bonusIndex": 8,
  "topicWords": ["ocean","coast","tide","coral","orca","rain","stone"]
}

Avoid letters that rarely combine: Q, X, Z (use sparingly). Prioritize letters like S, T, R, N, L, E, A, I, O.`;

    const grid = await generateJSON<GridContent>(prompt, schema, { taskClass: 'content-generation' });

    // Validate and sanitize
    if (!Array.isArray(grid.letters) || grid.letters.length !== 9) {
      throw new Error('Invalid grid: must have exactly 9 letters');
    }
    grid.letters = grid.letters.map((l: string) => String(l).toUpperCase().trim().charAt(0));
    grid.bonusLetter = String(grid.bonusLetter).toUpperCase().trim().charAt(0);
    grid.bonusIndex = Math.max(0, Math.min(8, Math.floor(Number(grid.bonusIndex))));
    grid.topicWords = (grid.topicWords || []).map((w: string) => String(w).toLowerCase().trim()).filter(Boolean);

    // 3. Cache for future sessions (fire-and-forget)
    const cacheId = await storeCachedContent(GAME_KEY, topic, difficulty, grid, SCHEMA_VERSION);

    return NextResponse.json({ grid, cacheId });
  } catch (error) {
    console.error('[grid-rush/generate] error:', error);
    return NextResponse.json({ error: 'Failed to generate grid' }, { status: 500 });
  }
}

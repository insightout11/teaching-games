import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';
import type { GridContent } from '@/games/grid-rush/types';
import { requireAuth, checkAndRecordAiUsage } from '@/lib/auth-credits';
import { gridRushFallback } from '@/lib/fallback-content';
import { resolveSourceContext } from '@/lib/source-context';
import type { SourceMaterial } from '@/types/source-material';

export const maxDuration = 60;

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) — words of 3-5 letters, simple consonants and short vowels',
  'Easy': 'Easy (A2) — everyday words of 3-6 letters',
  'Intermediate': 'Intermediate (B1/B2) — some longer words (6-7 letters) and less common vocabulary',
  'Advanced': 'Advanced (C1) — sophisticated vocabulary, 5-8 letter words',
  'Expert': 'Expert (C2/Native) — academic and nuanced vocabulary',
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
  const { teacher, error: authError } = await requireAuth();
  if (authError || !teacher) return authError!;

  // This will hit the AI. Enforce the free-tier weekly cap.
  const limited = await checkAndRecordAiUsage(teacher);
  if (limited) return limited;

  const { topic, difficulty, sourceMaterial } = await request.json() as {
    topic: Topic;
    difficulty: Difficulty;
    sourceMaterial?: SourceMaterial;
  };

  // Ground the topic words (and letter bias) in the lesson's source material when attached.
  const sourceContext = await resolveSourceContext(sourceMaterial);

  try {
    // Always generate fresh — no cache. Grid-rush needs variety every game.
    const prompt = `Generate a 3x3 letter grid for a word-building race game.
Difficulty: ${difficultyPrompts[difficulty]}
Topic: ${topic}
${sourceContext}${sourceContext ? 'Draw the "topicWords" from key vocabulary in the source material above, and bias the letters toward those words.\n' : ''}
REQUIREMENTS:
1. Provide exactly 9 uppercase single letters in a flat array called "letters" (indices 0-8).
2. Choose a good vowel/consonant balance: 3-4 vowels (A,E,I,O,U) and 5-6 consonants.
3. CRITICAL: Base your letter selection on the actual vocabulary of the topic "${topic}". Extract letters that appear frequently in real words from that domain — not just the most common English letters. Every game should feel different.
4. The letters should allow students to form many real English words of 3+ letters (each letter used at most once per word).
5. Choose one letter as the bonus letter ("bonusLetter") and its 0-8 grid position ("bonusIndex"). Pick a letter that rewards topic knowledge.
6. Provide 4-6 "topicWords": real English words from the "${topic}" domain that a student who knows the topic might think to form. Lowercase. These are reference words for the topic-word bonus — they do NOT need to be formable from your exact letters.

Avoid Q, X, Z unless the topic genuinely uses them. Do NOT default to generic high-frequency English letters — make the grid reflect the topic.`;

    const grid = await generateJSON<GridContent>(prompt, schema, { taskClass: 'content-generation' });

    // Validate and sanitize
    if (!Array.isArray(grid.letters) || grid.letters.length !== 9) {
      throw new Error('Invalid grid: must have exactly 9 letters');
    }
    grid.letters = grid.letters.map((l: string) => String(l).toUpperCase().trim().charAt(0));
    grid.bonusLetter = String(grid.bonusLetter).toUpperCase().trim().charAt(0);
    grid.topicWords = (grid.topicWords || []).map((w: string) => String(w).toLowerCase().trim()).filter(Boolean);

    // Shuffle letters so the AI can't accidentally spell out a topic word in sequence
    for (let i = grid.letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [grid.letters[i], grid.letters[j]] = [grid.letters[j], grid.letters[i]];
    }
    // Recompute bonusIndex after shuffle (first occurrence of bonusLetter)
    const newBonusIdx = grid.letters.indexOf(grid.bonusLetter);
    grid.bonusIndex = newBonusIdx !== -1 ? newBonusIdx : Math.floor(Math.random() * 9);

    return NextResponse.json({ grid });
  } catch (error) {
    console.error('[grid-rush/generate] error:', error);
    // No cache for grid-rush — straight to deterministic fallback
    return NextResponse.json({ grid: gridRushFallback(topic), degraded: true });
  }
}

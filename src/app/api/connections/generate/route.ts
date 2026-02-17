import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';

export const dynamic = 'force-dynamic';

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': `Beginner (A1) level:
- All 4 groups should have very obvious, straightforward connections
- Use basic vocabulary (common nouns, simple adjectives)
- Categories like: fruits, colors, animals, numbers, family members
- No wordplay or double meanings`,
  'Easy': `Easy (A2) level:
- Groups should be clear with common vocabulary
- Categories like: kitchen items, sports, weather words, school subjects
- Connections are obvious once you look for them
- Minimal red herrings`,
  'Intermediate': `Intermediate (B1/B2) level:
- Mix of obvious and moderate difficulty connections
- Include some red herrings (words that could fit multiple categories)
- Categories can be more specific: types of fabric, musical instruments, etc.
- Some thinking required but not tricky`,
  'Advanced': `Advanced (C1) level:
- Subtle connections that require thinking
- More abstract categories possible
- Include deliberate red herrings
- Categories like: things that can be "broken", words with silent letters`,
  'Expert': `Expert (C2/Native) level:
- Include wordplay, puns, or double meanings
- Categories can be tricky (e.g., "words that follow 'black'")
- Multiple plausible groupings that only have one correct answer
- Cultural references or idiomatic connections allowed`
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const schema: AISchema = {
  type: 'object',
  properties: {
    groups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          words: {
            type: 'array',
            items: { type: 'string' }
          },
          difficulty: { type: 'string' },
          color: { type: 'string' }
        },
        required: ['category', 'words', 'difficulty', 'color']
      }
    }
  },
  required: ['groups']
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json() as {
      topic: Topic;
      difficulty: Difficulty;
    };

    const randomSeed = Math.random().toString(36).substring(7);

    const prompt = `Generate a Connections puzzle (like NYT Connections) for ESL learners.
Topic: ${topic}
${difficultyPrompts[difficulty]}
Random seed: ${randomSeed}

Create exactly 4 groups of 4 words each (16 words total). Each word must be a single word (no phrases).

CRITICAL REQUIREMENTS:
1. Each group must have EXACTLY 4 words
2. All 16 words must be UNIQUE - no word can appear in multiple groups
3. Words should be related to the topic when possible
4. Each group needs a clear, guessable connection

Group structure (in order of difficulty within the puzzle):
- Group 1 (Yellow/easy): Most obvious connection - should be findable first
- Group 2 (Green/medium): Clear but requires a bit more thinking
- Group 3 (Blue/hard): Subtle connection that's harder to spot
- Group 4 (Purple/tricky): Requires lateral thinking or is the "leftover" harder group

Return JSON with this exact structure:
{
  "groups": [
    { "category": "Clear category name", "words": ["WORD1", "WORD2", "WORD3", "WORD4"], "difficulty": "easy", "color": "yellow" },
    { "category": "Category name", "words": ["WORD5", "WORD6", "WORD7", "WORD8"], "difficulty": "medium", "color": "green" },
    { "category": "Category name", "words": ["WORD9", "WORD10", "WORD11", "WORD12"], "difficulty": "hard", "color": "blue" },
    { "category": "Category name", "words": ["WORD13", "WORD14", "WORD15", "WORD16"], "difficulty": "tricky", "color": "purple" }
  ]
}

IMPORTANT: Words should be in UPPERCASE. Category names should be clear and concise (e.g., "Types of bread", "Words that can follow 'fire'").`;

    const data = await generateJSON<{ groups: Array<{ category: string; words: string[]; difficulty: string; color: string }> }>(prompt, schema, { temperature: 1.0 });

    // Validate the response
    if (!data.groups || data.groups.length !== 4) {
      throw new Error('Invalid response: must have exactly 4 groups');
    }

    for (const group of data.groups) {
      if (!group.words || group.words.length !== 4) {
        throw new Error('Invalid response: each group must have exactly 4 words');
      }
      // Ensure words are uppercase
      group.words = group.words.map((w: string) => w.toUpperCase());
    }

    // Check for duplicate words
    const allWords = data.groups.flatMap((g) => g.words);
    const uniqueWords = new Set(allWords);
    if (uniqueWords.size !== 16) {
      throw new Error('Invalid response: words must be unique across all groups');
    }

    // Shuffle all words for the grid
    const shuffledWords = shuffleArray(allWords);

    return NextResponse.json({
      words: shuffledWords,
      groups: data.groups
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}

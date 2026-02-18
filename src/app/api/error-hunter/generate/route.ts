import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';

const difficultyConfig: Record<Difficulty, { errors: number; description: string }> = {
  'Beginner': { errors: 2, description: 'Beginner (A1) level. Use very simple sentences with obvious spelling/grammar errors.' },
  'Easy': { errors: 3, description: 'Easy (A2) level. Use simple sentences with basic grammar errors.' },
  'Intermediate': { errors: 4, description: 'Intermediate (B1/B2) level. Use standard sentences with grammar and word choice errors.' },
  'Advanced': { errors: 4, description: 'Advanced (C1) level. Use complex sentences with subtle grammar errors.' },
  'Expert': { errors: 5, description: 'Expert (C2/Native) level. Use sophisticated sentences with nuanced errors.' }
};

const schema: AISchema = {
  type: 'object',
  properties: {
    paragraph: { type: 'string' },
    errorCount: { type: 'integer' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          position: { type: 'integer' },
          word: { type: 'string' },
          errorType: { type: 'string' },
          correction: { type: 'string' }
        },
        required: ['position', 'word', 'errorType', 'correction']
      }
    }
  },
  required: ['paragraph', 'errorCount', 'errors']
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json() as {
      topic: Topic;
      difficulty: Difficulty;
    };

    const config = difficultyConfig[difficulty];

    const prompt = `Generate a paragraph with exactly ${config.errors} intentional errors for ${config.description}
Topic: ${topic}.

Create a 3-4 sentence paragraph about ${topic} that contains exactly ${config.errors} errors.

Error types to include (mix them):
- Spelling errors (e.g., "recieve" instead of "receive")
- Subject-verb agreement (e.g., "he go" instead of "he goes")
- Wrong tense (e.g., "Yesterday I go" instead of "Yesterday I went")
- Wrong word form (e.g., "beautiful" instead of "beautifully")
- Article errors (e.g., "a apple" instead of "an apple")
- Preposition errors (e.g., "good in" instead of "good at")

Requirements:
- Include exactly ${config.errors} errors, spread across the paragraph
- Each error should be a single word that needs fixing
- The paragraph should make sense (errors aside)
- Position is the word index (0-based) in the paragraph
- Include the incorrect word and the correct version

Return the paragraph with errors embedded, plus an array of error details.`;

    const data = await generateJSON<{ paragraph: string; errorCount: number; errors: Array<{ position: number; word: string; errorType: string; correction: string }> }>(prompt, schema, { taskClass: 'content-generation' });
    return NextResponse.json({
      paragraph: data.paragraph,
      errorCount: data.errorCount,
      // Don't send errors to client - they'll discover them!
      _errors: data.errors // Stored for evaluation
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}

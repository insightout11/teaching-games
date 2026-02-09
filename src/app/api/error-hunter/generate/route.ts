import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty, Topic } from '@/stores/session-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const difficultyConfig: Record<Difficulty, { errors: number; description: string }> = {
  'Beginner': { errors: 2, description: 'Beginner (A1) level. Use very simple sentences with obvious spelling/grammar errors.' },
  'Easy': { errors: 3, description: 'Easy (A2) level. Use simple sentences with basic grammar errors.' },
  'Intermediate': { errors: 4, description: 'Intermediate (B1/B2) level. Use standard sentences with grammar and word choice errors.' },
  'Advanced': { errors: 4, description: 'Advanced (C1) level. Use complex sentences with subtle grammar errors.' },
  'Expert': { errors: 5, description: 'Expert (C2/Native) level. Use sophisticated sentences with nuanced errors.' }
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json() as {
      topic: Topic;
      difficulty: Difficulty;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const config = difficultyConfig[difficulty];

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            paragraph: { type: SchemaType.STRING },
            errorCount: { type: SchemaType.INTEGER },
            errors: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  position: { type: SchemaType.INTEGER },
                  word: { type: SchemaType.STRING },
                  errorType: { type: SchemaType.STRING },
                  correction: { type: SchemaType.STRING }
                },
                required: ['position', 'word', 'errorType', 'correction']
              }
            }
          },
          required: ['paragraph', 'errorCount', 'errors']
        }
      }
    });

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

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const data = JSON.parse(text);
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

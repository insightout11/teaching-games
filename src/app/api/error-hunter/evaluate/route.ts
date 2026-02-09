import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty } from '@/stores/session-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1)',
  'Easy': 'Easy (A2)',
  'Intermediate': 'Intermediate (B1/B2)',
  'Advanced': 'Advanced (C1)',
  'Expert': 'Expert (C2/Native)'
};

export async function POST(request: NextRequest) {
  try {
    const { paragraph, corrections, difficulty } = await request.json() as {
      paragraph: string;
      corrections: Array<{ position: number; original: string; correction: string }>;
      difficulty: Difficulty;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            totalErrors: { type: SchemaType.INTEGER },
            found: { type: SchemaType.INTEGER },
            correctFixes: { type: SchemaType.INTEGER },
            falsePositives: { type: SchemaType.INTEGER },
            score: { type: SchemaType.INTEGER },
            feedback: { type: SchemaType.STRING },
            solutions: {
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
          required: ['totalErrors', 'found', 'correctFixes', 'falsePositives', 'score', 'feedback', 'solutions']
        }
      }
    });

    const correctionsText = corrections.length > 0
      ? corrections.map(c => `- Position ${c.position}: "${c.original}" → "${c.correction}"`).join('\n')
      : 'No corrections submitted';

    const prompt = `Evaluate error corrections for a ${difficultyPrompts[difficulty]} level English learner.

Original paragraph with errors:
"${paragraph}"

Student's corrections:
${correctionsText}

Analyze the paragraph and the student's corrections:
1. Find ALL actual errors in the paragraph
2. Check which errors the student found correctly
3. Check if their corrections are valid (accept any reasonable fix)
4. Identify false positives (marking correct text as wrong)

Scoring (1-10):
- 10: Found all errors with correct fixes
- 7-9: Found most errors with mostly correct fixes
- 4-6: Found some errors, some correct fixes
- 1-3: Missed most errors or many wrong fixes

Provide:
- totalErrors: Actual number of errors in the paragraph
- found: How many real errors the student identified
- correctFixes: How many fixes were correct
- falsePositives: How many non-errors were marked
- score: Overall score (1-10)
- feedback: Brief feedback (2-3 sentences) - what they caught, what they missed
- solutions: Array of ALL actual errors with correct fixes`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const evaluation = JSON.parse(text);
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate corrections' },
      { status: 500 }
    );
  }
}

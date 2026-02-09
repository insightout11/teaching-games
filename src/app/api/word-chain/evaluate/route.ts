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
    const { previousWord, newWord, chainHistory, difficulty } = await request.json() as {
      previousWord: string;
      newWord: string;
      chainHistory: string[];
      difficulty: Difficulty;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

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

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            isValid: { type: SchemaType.BOOLEAN },
            connectionStrength: { type: SchemaType.STRING },
            score: { type: SchemaType.INTEGER },
            feedback: { type: SchemaType.STRING }
          },
          required: ['isValid', 'connectionStrength', 'score', 'feedback']
        }
      }
    });

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
- When in doubt, mark as INVALID - this is a challenge game, not a free-for-all`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const evaluation = JSON.parse(text);
    return NextResponse.json({
      ...evaluation,
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

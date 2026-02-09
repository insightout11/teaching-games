import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty } from '@/stores/session-store';
import { TargetTone, TONE_DESCRIPTIONS } from '@/games/tone-transformer/types';

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
    const { originalSentence, rewrittenSentence, targetTone, difficulty } = await request.json() as {
      originalSentence: string;
      rewrittenSentence: string;
      targetTone: TargetTone;
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
            toneMatch: { type: SchemaType.INTEGER },
            meaningPreserved: { type: SchemaType.INTEGER },
            grammarScore: { type: SchemaType.INTEGER },
            feedback: { type: SchemaType.STRING },
            alternatives: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            }
          },
          required: ['toneMatch', 'meaningPreserved', 'grammarScore', 'feedback', 'alternatives']
        }
      }
    });

    const toneDescription = TONE_DESCRIPTIONS[targetTone];

    const prompt = `Evaluate this tone transformation attempt by a ${difficultyPrompts[difficulty]} level English learner.

Original sentence: "${originalSentence}"
Target tone: ${targetTone} (${toneDescription})
Student's rewrite: "${rewrittenSentence}"

Score each criterion from 1-10:
1. Tone Match: How well does the rewrite match the target ${targetTone} tone?
2. Meaning Preserved: Does the rewrite keep the original message intact? (10 = perfect, 1 = completely different meaning)
3. Grammar Score: Is the sentence grammatically correct for ${difficulty} level?

Also provide:
- Feedback: Brief, encouraging feedback (2-3 sentences max) highlighting what worked and one tip for improvement
- Alternatives: 2 example rewrites that nail the ${targetTone} tone perfectly

Be appropriately lenient for ${difficulty} level - focus on whether they achieved the tone shift.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const evaluation = JSON.parse(text);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (evaluation.toneMatch * 0.5) +
      (evaluation.meaningPreserved * 0.3) +
      (evaluation.grammarScore * 0.2)
    );

    return NextResponse.json({
      ...evaluation,
      score: overallScore
    });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate sentence' },
      { status: 500 }
    );
  }
}

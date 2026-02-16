import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty } from '@/stores/session-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Be encouraging with basic expectations.',
  'Easy': 'Easy (A2) level. Expect simple but correct sentences.',
  'Intermediate': 'Intermediate (B1/B2) level. Expect good grammar and some creativity.',
  'Advanced': 'Advanced (C1) level. Expect sophisticated language and strong creativity.',
  'Expert': 'Expert (C2/Native) level. Expect excellent grammar, vivid imagery, and masterful flow.'
};

export async function POST(request: NextRequest) {
  try {
    const { sentence, context, difficulty, topic } = await request.json() as {
      sentence: string;
      context: string;
      difficulty: Difficulty;
      topic?: string;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const baseProperties = {
      grammarScore: { type: SchemaType.INTEGER },
      creativityScore: { type: SchemaType.INTEGER },
      flowScore: { type: SchemaType.INTEGER },
      feedback: { type: SchemaType.STRING },
    } as const;

    const baseRequired = ['grammarScore', 'creativityScore', 'flowScore', 'feedback'] as const;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: topic
          ? { type: SchemaType.OBJECT, properties: { ...baseProperties, topicRelevanceScore: { type: SchemaType.INTEGER } }, required: [...baseRequired, 'topicRelevanceScore'] }
          : { type: SchemaType.OBJECT, properties: { ...baseProperties }, required: [...baseRequired] },
      }
    });

    const topicInstruction = topic
      ? `\n4. Topic Relevance (1-100) — How well does this sentence relate to the theme: "${topic}"?`
      : '';

    const prompt = `You are an expert creative writing teacher evaluating a collaborative story.
Student Level: ${difficultyPrompts[difficulty]}
${topic ? `Story Topic: "${topic}"` : ''}

Story so far: "${context || 'This is the first sentence of a new story.'}"

New sentence to evaluate: "${sentence}"

Score the sentence from 1 to 100 on these metrics:
1. Grammar (syntax, spelling, punctuation) - Score based on ${difficulty} level expectations
2. Creativity (originality, vivid imagery, word choice) - How imaginative and engaging is the sentence?
3. Flow (how well it transitions from the story context) - Does it continue the narrative naturally?${topicInstruction}

Provide a constructive, encouraging feedback comment (max 20 words) that helps the student improve while celebrating what they did well.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const analysis = JSON.parse(text);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentence' },
      { status: 500 }
    );
  }
}

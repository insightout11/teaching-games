import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuthForGeneration } from '@/lib/auth-credits';
import type { Difficulty } from '@/stores/session-store';

export const maxDuration = 60;

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Be encouraging with basic expectations.',
  'Easy': 'Easy (A2) level. Expect simple but correct sentences.',
  'Intermediate': 'Intermediate (B1/B2) level. Expect good grammar and some creativity.',
  'Advanced': 'Advanced (C1) level. Expect sophisticated language and strong creativity.',
  'Expert': 'Expert (C2/Native) level. Expect excellent grammar, vivid imagery, and masterful flow.'
};

const baseSchema: AISchema = {
  type: 'object',
  properties: {
    grammarScore: { type: 'integer' },
    creativityScore: { type: 'integer' },
    flowScore: { type: 'integer' },
    feedback: { type: 'string' },
  },
  required: ['grammarScore', 'creativityScore', 'flowScore', 'feedback'],
};

const topicSchema: AISchema = {
  type: 'object',
  properties: {
    grammarScore: { type: 'integer' },
    creativityScore: { type: 'integer' },
    flowScore: { type: 'integer' },
    feedback: { type: 'string' },
    topicRelevanceScore: { type: 'integer' },
  },
  required: ['grammarScore', 'creativityScore', 'flowScore', 'feedback', 'topicRelevanceScore'],
};

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAuthForGeneration();
  if (authError) return authError;

  try {
    const { sentence, context, difficulty, topic } = await request.json() as {
      sentence: string;
      context: string;
      difficulty: Difficulty;
      topic?: string;
    };

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

    const analysis = await generateJSON<{
      grammarScore: number;
      creativityScore: number;
      flowScore: number;
      feedback: string;
      topicRelevanceScore?: number;
    }>(prompt, topic ? topicSchema : baseSchema, { taskClass: 'evaluation' });
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentence' },
      { status: 500 }
    );
  }
}

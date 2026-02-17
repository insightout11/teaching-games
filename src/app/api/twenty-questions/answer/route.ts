import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';

interface AnswerRequest {
  secret: string;
  question: string;
  tone: string;
  questionsHistory: { question: string; answer: string }[];
}

interface AnswerResponse {
  answer: 'yes' | 'no' | 'maybe';
  explanation: string;
}

const answerSchema: AISchema = {
  type: 'object',
  properties: {
    answer: {
      type: 'string',
      enum: ['yes', 'no', 'maybe'],
      description: 'The answer to the question about the secret',
    },
    explanation: {
      type: 'string',
      description: 'Brief explanation of why this answer is correct (shown to teacher only)',
    },
  },
  required: ['answer', 'explanation'],
};

export async function POST(request: NextRequest) {
  try {
    const { secret, question, tone, questionsHistory } =
      (await request.json()) as AnswerRequest;

    if (!secret || !question) {
      return NextResponse.json(
        { error: 'Secret and question are required' },
        { status: 400 },
      );
    }

    const historyText =
      questionsHistory.length > 0
        ? `\n\nPrevious questions and answers:\n${questionsHistory.map((h) => `Q: ${h.question} -> ${h.answer}`).join('\n')}`
        : '';

    const toneInstruction =
      tone === 'kid-friendly'
        ? 'Use simple, kid-friendly language in your explanation.'
        : 'Be concise and clear in your explanation.';

    const prompt = `You are the host of a 20 Questions game. The secret is: "${secret}".

A player asked: "${question}"

Answer with "yes", "no", or "maybe". Be accurate and consistent with previous answers. ${toneInstruction}${historyText}`;

    const result = await generateJSON<AnswerResponse>(prompt, answerSchema, {
      temperature: 0.3,
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('Twenty Questions answer error:', error);
    return NextResponse.json(
      { error: 'Failed to generate answer' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty } from '@/stores/session-store';

const difficultyLevels: Record<Difficulty, string> = {
  'Beginner': 'A1 beginner',
  'Easy': 'A2 elementary',
  'Intermediate': 'B1/B2 intermediate',
  'Advanced': 'C1 advanced',
  'Expert': 'C2/Native expert',
};

interface SentenceInput {
  text: string;
  studentName: string;
  isStarter?: boolean;
}

const baseSchema: AISchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    overallScore: { type: 'integer' },
    coherenceScore: { type: 'integer' },
    creativityScore: { type: 'integer' },
    endingScore: { type: 'integer' },
    bestLineText: { type: 'string' },
    bestLineStudentName: { type: 'string' },
    bestLineReason: { type: 'string' },
    summary: { type: 'string' },
  },
  required: [
    'title', 'overallScore', 'coherenceScore', 'creativityScore',
    'endingScore', 'bestLineText', 'bestLineStudentName', 'bestLineReason', 'summary',
  ],
};

const topicSchema: AISchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    overallScore: { type: 'integer' },
    coherenceScore: { type: 'integer' },
    creativityScore: { type: 'integer' },
    endingScore: { type: 'integer' },
    bestLineText: { type: 'string' },
    bestLineStudentName: { type: 'string' },
    bestLineReason: { type: 'string' },
    summary: { type: 'string' },
    topicRelevance: { type: 'integer' },
  },
  required: [
    'title', 'overallScore', 'coherenceScore', 'creativityScore',
    'endingScore', 'bestLineText', 'bestLineStudentName', 'bestLineReason', 'summary', 'topicRelevance',
  ],
};

export async function POST(request: NextRequest) {
  try {
    const { sentences, topic, difficulty } = await request.json() as {
      sentences: SentenceInput[];
      topic?: string;
      difficulty: Difficulty;
    };

    const storyText = sentences.map((s) => {
      if (s.isStarter) return `[Starter] ${s.text}`;
      return `[${s.studentName}] ${s.text}`;
    }).join('\n');

    const studentSentences = sentences.filter(s => !s.isStarter);
    const studentNames = Array.from(new Set(studentSentences.map(s => s.studentName)));

    const topicInstruction = topic
      ? `\n5. Topic Relevance (1-100) — How well does the overall story relate to the theme: "${topic}"?`
      : '';

    const prompt = `You are an expert creative writing teacher evaluating a collaborative story written by ESL students.
Student Level: ${difficultyLevels[difficulty]}
${topic ? `Story Topic: "${topic}"` : ''}

The collaborative story (each line shows the author):
${storyText}

Evaluate the COMPLETE story on these metrics (1-100 each):
1. Overall Score — How good is this story overall?
2. Coherence — Does the story flow logically from beginning to end?
3. Creativity — How imaginative and engaging is the story?
4. Ending Quality — Does the story reach a satisfying conclusion?${topicInstruction}

Also:
- Generate a creative title for this story (max 6 words)
- Pick the single best sentence from the story (must be by a student: ${studentNames.join(', ')}). Explain WHY in under 15 words.
- Write a 1-2 sentence summary/commentary on the story as encouraging feedback.

For bestLineStudentName, use EXACTLY one of: ${studentNames.join(', ')}`;

    const parsed = await generateJSON<{
      title: string;
      overallScore: number;
      coherenceScore: number;
      creativityScore: number;
      endingScore: number;
      bestLineText: string;
      bestLineStudentName: string;
      bestLineReason: string;
      summary: string;
      topicRelevance?: number;
    }>(prompt, topic ? topicSchema : baseSchema);

    // Reshape bestLine into nested object
    const response: Record<string, unknown> = {
      title: parsed.title,
      overallScore: parsed.overallScore,
      coherenceScore: parsed.coherenceScore,
      creativityScore: parsed.creativityScore,
      endingScore: parsed.endingScore,
      summary: parsed.summary,
      bestLine: {
        text: parsed.bestLineText,
        studentName: parsed.bestLineStudentName,
        reason: parsed.bestLineReason,
      },
    };

    if (topic && parsed.topicRelevance !== undefined) {
      response.topicRelevance = parsed.topicRelevance;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate story' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty } from '@/stores/session-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

export async function POST(request: NextRequest) {
  try {
    const { sentences, topic, difficulty } = await request.json() as {
      sentences: SentenceInput[];
      topic?: string;
      difficulty: Difficulty;
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const baseProperties = {
      title: { type: SchemaType.STRING },
      overallScore: { type: SchemaType.INTEGER },
      coherenceScore: { type: SchemaType.INTEGER },
      creativityScore: { type: SchemaType.INTEGER },
      endingScore: { type: SchemaType.INTEGER },
      bestLineText: { type: SchemaType.STRING },
      bestLineStudentName: { type: SchemaType.STRING },
      bestLineReason: { type: SchemaType.STRING },
      summary: { type: SchemaType.STRING },
    } as const;

    const baseRequired = [
      'title', 'overallScore', 'coherenceScore', 'creativityScore',
      'endingScore', 'bestLineText', 'bestLineStudentName', 'bestLineReason', 'summary',
    ] as const;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: topic
          ? { type: SchemaType.OBJECT, properties: { ...baseProperties, topicRelevance: { type: SchemaType.INTEGER } }, required: [...baseRequired, 'topicRelevance'] }
          : { type: SchemaType.OBJECT, properties: { ...baseProperties }, required: [...baseRequired] },
      },
    });

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

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

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

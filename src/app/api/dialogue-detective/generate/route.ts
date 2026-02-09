import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Difficulty, Topic } from '@/stores/session-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very simple, short dialogue.',
  'Easy': 'Easy (A2) level. Use simple everyday conversation.',
  'Intermediate': 'Intermediate (B1/B2) level. Use natural conversation.',
  'Advanced': 'Advanced (C1) level. Use nuanced, contextual dialogue.',
  'Expert': 'Expert (C2/Native) level. Use sophisticated, idiomatic conversation.'
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

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            speakerA_before: { type: SchemaType.STRING },
            speakerA_after: { type: SchemaType.STRING },
            context: { type: SchemaType.STRING },
            goal: { type: SchemaType.STRING }
          },
          required: ['speakerA_before', 'speakerA_after', 'context', 'goal']
        }
      }
    });

    const prompt = `Generate a dialogue puzzle for ${difficultyPrompts[difficulty]}
Topic: ${topic}.

Create a 3-line conversation where:
- Speaker A says something (line 1)
- Speaker B responds (line 2) - THIS IS THE BLANK the student fills in
- Speaker A replies to B's response (line 3)

The student must figure out what B said that would:
1. Make sense as a response to line 1
2. Naturally lead to line 3

Provide:
- speakerA_before: What A says first
- speakerA_after: What A says after B's response
- context: Brief setting (e.g., "At a restaurant", "Job interview")
- goal: What B needs to accomplish (e.g., "Ask for directions", "Decline politely")

Requirements:
- The conversation should be natural and realistic
- B's response should be inferable from context
- There should be multiple valid ways to fill the blank
- The dialogue should relate to ${topic}
- Appropriate complexity for ${difficulty} level`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const data = JSON.parse(text);
    return NextResponse.json({
      speakerA_before: data.speakerA_before,
      speakerA_after: data.speakerA_after,
      context: data.context,
      goal: data.goal
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate dialogue' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import type { Difficulty, Topic } from '@/stores/session-store';

const difficultyPrompts: Record<Difficulty, string> = {
  'Beginner': 'Beginner (A1) level. Use very simple, short dialogue.',
  'Easy': 'Easy (A2) level. Use simple everyday conversation.',
  'Intermediate': 'Intermediate (B1/B2) level. Use natural conversation.',
  'Advanced': 'Advanced (C1) level. Use nuanced, contextual dialogue.',
  'Expert': 'Expert (C2/Native) level. Use sophisticated, idiomatic conversation.'
};

const schema: AISchema = {
  type: 'object',
  properties: {
    speakerA_before: { type: 'string' },
    speakerA_after: { type: 'string' },
    context: { type: 'string' },
    goal: { type: 'string' }
  },
  required: ['speakerA_before', 'speakerA_after', 'context', 'goal']
};

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json() as {
      topic: Topic;
      difficulty: Difficulty;
    };

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

    const data = await generateJSON<{ speakerA_before: string; speakerA_after: string; context: string; goal: string }>(prompt, schema, { taskClass: 'content-generation' });
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

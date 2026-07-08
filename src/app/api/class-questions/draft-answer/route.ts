import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { createServerSupabase } from '@/lib/supabase/server';

export const maxDuration = 60;

// POST /api/class-questions/draft-answer
// Teacher-only: generate an AI draft answer for a published student question.

interface DraftRequest {
  question: string;
  topic: string;
  difficulty: string;
}

interface DraftResponse {
  answer: string;
  example?: string;
  teacherTip?: string;
}

const schema: AISchema = {
  type: 'object',
  properties: {
    answer: { type: 'string', description: '2-3 sentence explanation, difficulty-appropriate' },
    example: { type: 'string', description: 'One natural example sentence (optional)' },
    teacherTip: { type: 'string', description: 'One brief classroom delivery tip (optional)' },
  },
  required: ['answer'],
};

export async function POST(request: NextRequest) {
  try {
    // Verify teacher authentication
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as DraftRequest;
    const { question, topic, difficulty } = body;

    // Validate inputs
    if (!question || !topic || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: question, topic, difficulty' },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        { error: 'Question must be 500 characters or fewer' },
        { status: 400 }
      );
    }

    const prompt = `You are an English language teacher's assistant.
A student in a ${difficulty} class studying the topic "${topic}" asked:
"${question}"

Give a clear, concise teacher's answer.
- answer: 2-3 sentences, ${difficulty}-appropriate language
- example: one natural example sentence (optional, only if useful)
- teacherTip: one brief delivery tip for the teacher (optional)`;

    const data = await generateJSON<DraftResponse>(prompt, schema, {
      taskClass: 'activity-facilitation',
    });

    return NextResponse.json({
      answer: data.answer,
      ...(data.example && { example: data.example }),
      ...(data.teacherTip && { teacherTip: data.teacherTip }),
    });
  } catch (error) {
    console.error('Draft answer error:', error);
    return NextResponse.json({ error: 'Failed to generate draft answer' }, { status: 500 });
  }
}

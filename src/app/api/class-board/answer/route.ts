import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/class-board/answer
// Teacher-only: answer a class board question (question-wall mode) manually or via AI.
// The answer is stored on the item's metadata jsonb so the board model needs no new columns.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface AnswerRequest {
  sessionId: string;
  itemId: string;
  answerType: 'teacher' | 'ai';
  answerText?: string; // required when answerType === 'teacher'
}

interface AIAnswerResponse {
  answer: string;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const aiAnswerSchema: AISchema = {
  type: 'object',
  properties: {
    answer: { type: 'string', description: 'One clear sentence, difficulty-appropriate' },
  },
  required: ['answer'],
};

export async function POST(request: NextRequest) {
  try {
    const authClient = createServerSupabase();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as AnswerRequest;
    const { sessionId, itemId, answerType, answerText } = body;

    if (!sessionId || !itemId || !answerType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!uuidRegex.test(sessionId) || !uuidRegex.test(itemId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }
    if (answerType !== 'teacher' && answerType !== 'ai') {
      return NextResponse.json({ error: 'answerType must be teacher or ai' }, { status: 400 });
    }
    if (answerType === 'teacher' && (!answerText || answerText.trim().length === 0)) {
      return NextResponse.json({ error: 'answerText is required for teacher answers' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Ownership: sessions.class_id → classes.teacher_id
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, class_id, topic, custom_topic, difficulty')
      .eq('id', sessionId)
      .single();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { data: cls, error: clsError } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', session.class_id)
      .single();
    if (clsError || !cls || cls.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: item, error: itemError } = await supabase
      .from('class_board_items')
      .select('id, content, metadata')
      .eq('id', itemId)
      .eq('session_id', sessionId)
      .single();
    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    let finalAnswerText: string;
    if (answerType === 'ai') {
      const topic = (session.custom_topic as string | null) || (session.topic as string) || 'General';
      const difficulty = (session.difficulty as string) || 'Intermediate';
      const prompt = `You are helping a teacher answer a student's question during class.
Topic: "${topic}" | Level: "${difficulty}"
Student question: "${item.content}"

Give one clear, direct sentence that answers the question. ${difficulty}-appropriate language. No follow-up question.`;
      const data = await generateJSON<AIAnswerResponse>(prompt, aiAnswerSchema, {
        taskClass: 'activity-facilitation',
      });
      finalAnswerText = data.answer;
    } else {
      finalAnswerText = answerText!.trim();
    }

    const existingMetadata = (item.metadata as Record<string, unknown> | null) ?? {};
    const { error: updateError } = await supabase
      .from('class_board_items')
      .update({
        metadata: {
          ...existingMetadata,
          answer: finalAnswerText,
          answerType,
          answeredAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Class Board answer update error:', updateError);
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }

    return NextResponse.json({ success: true, answerText: finalAnswerText });
  } catch (error) {
    console.error('Class Board answer error:', error);
    return NextResponse.json({ error: 'Failed to answer question' }, { status: 500 });
  }
}

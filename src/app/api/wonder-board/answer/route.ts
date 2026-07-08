import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const maxDuration = 60;

// POST /api/wonder-board/answer
// Teacher-only: answer a wonder board question manually or via AI.
// AI answers give a short definitive answer + one open provocation.

interface AnswerRequest {
  sessionId: string;
  questionId: string;
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
    // Verify teacher authentication
    const supabase = createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as AnswerRequest;
    const { sessionId, questionId, answerType, answerText } = body;

    if (!sessionId || !questionId || !answerType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!uuidRegex.test(sessionId) || !uuidRegex.test(questionId)) {
      return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }

    if (answerType !== 'teacher' && answerType !== 'ai') {
      return NextResponse.json({ error: 'answerType must be teacher or ai' }, { status: 400 });
    }

    if (answerType === 'teacher' && (!answerText || answerText.trim().length === 0)) {
      return NextResponse.json({ error: 'answerText is required for teacher answers' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Verify the question belongs to a session owned by this teacher
    // sessions.teacher_id doesn't exist — ownership is via sessions.class_id → classes.teacher_id
    const { data: session, error: sessionError } = await serviceClient
      .from('sessions')
      .select('id, status, class_id, topic, custom_topic, difficulty')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { data: cls, error: clsError } = await serviceClient
      .from('classes')
      .select('teacher_id')
      .eq('id', session.class_id)
      .single();

    if (clsError || !cls || cls.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch the question
    const { data: question, error: questionError } = await serviceClient
      .from('wonder_questions')
      .select('id, content, session_id')
      .eq('id', questionId)
      .eq('session_id', sessionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    let finalAnswerText: string;

    if (answerType === 'ai') {
      const topic = (session.custom_topic as string | null) || (session.topic as string) || 'General';
      const difficulty = (session.difficulty as string) || 'Intermediate';

      const prompt = `You are helping a teacher answer a student's question during class.
Topic: "${topic}" | Level: "${difficulty}"
Student question: "${question.content}"

Give one clear, direct sentence that answers the question. ${difficulty}-appropriate language. No follow-up question.`;

      const data = await generateJSON<AIAnswerResponse>(prompt, aiAnswerSchema, {
        taskClass: 'activity-facilitation',
      });

      finalAnswerText = data.answer;
    } else {
      finalAnswerText = answerText!.trim();
    }

    // Update the question with the answer
    const { error: updateError } = await serviceClient
      .from('wonder_questions')
      .update({
        answer_text: finalAnswerText,
        answer_type: answerType,
        answered_at: new Date().toISOString(),
      })
      .eq('id', questionId);

    if (updateError) {
      console.error('Wonder Board answer update error:', updateError);
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }

    return NextResponse.json({ success: true, answerText: finalAnswerText });
  } catch (error) {
    console.error('Wonder Board answer error:', error);
    return NextResponse.json({ error: 'Failed to answer question' }, { status: 500 });
  }
}

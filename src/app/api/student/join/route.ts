import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/student/join
// Adds a student to the roster when they join via /join/[sessionId]
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, name, avatarSeed } = body;

    if (!sessionId || !name) {
      return NextResponse.json(
        { error: 'sessionId and name are required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 40) {
      return NextResponse.json(
        { error: 'Name must be 1-40 characters' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get class_id from session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, class_id, status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    // Check if student with same name already exists in this class
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id, name')
      .eq('class_id', session.class_id)
      .eq('name', trimmedName)
      .single();

    if (existingStudent) {
      // Return existing student instead of creating duplicate
      return NextResponse.json({
        studentId: existingStudent.id,
        name: existingStudent.name,
        isExisting: true,
      });
    }

    // Insert new student
    const seed = typeof avatarSeed === 'string' && avatarSeed.trim() ? avatarSeed.trim() : 'ace';
    const { data: newStudent, error: insertError } = await supabase
      .from('students')
      .insert({
        class_id: session.class_id,
        name: trimmedName,
        avatar_seed: seed,
      })
      .select('id, name')
      .single();

    if (insertError || !newStudent) {
      console.error('Failed to insert student:', insertError);
      return NextResponse.json(
        { error: 'Failed to add student to roster' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      studentId: newStudent.id,
      name: newStudent.name,
      isExisting: false,
    });
  } catch (error) {
    console.error('Student join error:', error);
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}

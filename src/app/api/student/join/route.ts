import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/student/join
//
// Shape A — picked from roster:
//   { sessionId, studentId, avatarSeed, clientId }
//
// Shape B — not on list / new student:
//   { sessionId, newName, avatarSeed, clientId }
//
// Both shapes record the student in session_participants.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, studentId, newName, avatarSeed, clientId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 });
    }

    // One of studentId or newName must be provided
    if (!studentId && !newName) {
      return NextResponse.json({ error: 'studentId or newName is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Get session
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

    const seed = typeof avatarSeed === 'string' && avatarSeed.trim() ? avatarSeed.trim() : 'teal';

    // ── Shape A: student selected from roster ─────────────────────────────
    if (studentId) {
      if (!uuidRegex.test(studentId)) {
        return NextResponse.json({ error: 'Invalid studentId format' }, { status: 400 });
      }

      // Update avatar if it changed
      await supabase
        .from('students')
        .update({ avatar_seed: seed })
        .eq('id', studentId);

      const { data: student } = await supabase
        .from('students')
        .select('id, name')
        .eq('id', studentId)
        .single();

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Record participation (ignore if already joined this session from same device)
      if (clientId && uuidRegex.test(clientId)) {
        await supabase.from('session_participants').upsert(
          {
            session_id: sessionId,
            student_id: studentId,
            client_id: clientId,
            display_name: student.name,
            avatar_seed: seed,
          },
          { onConflict: 'session_id,client_id', ignoreDuplicates: true }
        );
      }

      return NextResponse.json({ studentId: student.id, name: student.name, isExisting: true });
    }

    // ── Shape B: new name / not on list ───────────────────────────────────
    const trimmedName = String(newName).trim();
    if (!trimmedName || trimmedName.length > 40) {
      return NextResponse.json({ error: 'Name must be 1-40 characters' }, { status: 400 });
    }

    // Find or create student by name in this class
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id, name')
      .eq('class_id', session.class_id)
      .eq('name', trimmedName)
      .single();

    let resolvedStudentId: string;
    let resolvedName: string;
    let isExisting = false;

    if (existingStudent) {
      resolvedStudentId = existingStudent.id;
      resolvedName = existingStudent.name;
      isExisting = true;
      // Update avatar even on name-match path
      await supabase
        .from('students')
        .update({ avatar_seed: seed })
        .eq('id', existingStudent.id);
    } else {
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert({ class_id: session.class_id, name: trimmedName, avatar_seed: seed })
        .select('id, name')
        .single();

      if (insertError || !newStudent) {
        console.error('Failed to insert student:', insertError);
        return NextResponse.json({ error: 'Failed to add student to roster' }, { status: 500 });
      }

      resolvedStudentId = newStudent.id;
      resolvedName = newStudent.name;
    }

    // Record participation
    if (clientId && uuidRegex.test(clientId)) {
      await supabase.from('session_participants').upsert(
        {
          session_id: sessionId,
          student_id: resolvedStudentId,
          client_id: clientId,
          display_name: resolvedName,
          avatar_seed: seed,
        },
        { onConflict: 'session_id,client_id', ignoreDuplicates: true }
      );
    }

    return NextResponse.json({ studentId: resolvedStudentId, name: resolvedName, isExisting });
  } catch (error) {
    console.error('Student join error:', error);
    return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { mockStore } from '@/lib/mock/data';
import { isSessionStale } from '@/lib/session-freshness';

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

    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      const session = mockStore.ensureSession(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      if (session.status !== 'active') {
        return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
      }

      if (!studentId && !newName) {
        return NextResponse.json({ error: 'studentId or newName is required' }, { status: 400 });
      }

      const seed = typeof avatarSeed === 'string' && avatarSeed.trim() ? avatarSeed.trim() : 'teal';
      const participantClientId = typeof clientId === 'string' && clientId.trim()
        ? clientId.trim()
        : `mock-client-${Date.now()}`;

      if (studentId) {
        const student = mockStore.getStudent(String(studentId));
        if (!student) {
          return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        mockStore.updateStudent(student.id, { avatar_seed: seed });
        mockStore.upsertSessionParticipant({
          session_id: sessionId,
          student_id: student.id,
          client_id: participantClientId,
          display_name: student.name,
          avatar_seed: seed,
        });

        return NextResponse.json({ studentId: student.id, name: student.name, isExisting: true });
      }

      const trimmedName = String(newName).trim();
      if (!trimmedName || trimmedName.length > 40) {
        return NextResponse.json({ error: 'Name must be 1-40 characters' }, { status: 400 });
      }

      const existingStudent = mockStore
        .getStudents(session.class_id)
        .find((student) => student.name.toLowerCase() === trimmedName.toLowerCase());
      const student = existingStudent ?? mockStore.createStudent({
        class_id: session.class_id,
        name: trimmedName,
        avatar_seed: seed,
      });

      if (existingStudent) {
        mockStore.updateStudent(existingStudent.id, { avatar_seed: seed });
      }

      mockStore.upsertSessionParticipant({
        session_id: sessionId,
        student_id: student.id,
        client_id: participantClientId,
        display_name: student.name,
        avatar_seed: seed,
      });

      return NextResponse.json({ studentId: student.id, name: student.name, isExisting: Boolean(existingStudent) });
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
      .select('id, class_id, status, started_at')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'active' || isSessionStale(session.started_at)) {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }

    const seed = typeof avatarSeed === 'string' && avatarSeed.trim() ? avatarSeed.trim() : 'teal';
    if (seed.length > 32) {
      return NextResponse.json({ error: 'Invalid avatarSeed' }, { status: 400 });
    }

    // ── Shape A: student selected from roster ─────────────────────────────
    if (studentId) {
      if (!uuidRegex.test(studentId)) {
        return NextResponse.json({ error: 'Invalid studentId format' }, { status: 400 });
      }

      // Verify the student belongs to this session's class BEFORE any write
      const { data: student } = await supabase
        .from('students')
        .select('id, name')
        .eq('id', studentId)
        .eq('class_id', session.class_id)
        .single();

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Update avatar if it changed
      await supabase
        .from('students')
        .update({ avatar_seed: seed })
        .eq('id', student.id);

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
      // Cap roster growth — anyone with a join link can otherwise flood it
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', session.class_id);
      if ((count ?? 0) >= 100) {
        return NextResponse.json({ error: 'Class roster is full' }, { status: 400 });
      }

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

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { toCourse } from '@/lib/course-serialize';

export const dynamic = 'force-dynamic';

// GET — a single course (own or a global template) with its ordered lessons.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;

  const supabase = createServiceClient();
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (courseErr) return NextResponse.json({ error: courseErr.message }, { status: 500 });
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  if (course.teacher_id !== teacher.id && !course.is_template) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: lessons } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('course_id', course.id)
    .order('order_index', { ascending: true });

  return NextResponse.json(toCourse(course, lessons ?? []));
}

// DELETE — remove a teacher's own course (cascades to its lessons). Templates are not deletable here.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;

  const supabase = createServiceClient();
  const { data: course } = await supabase
    .from('courses')
    .select('id, teacher_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!course || course.teacher_id !== teacher.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error: delErr } = await supabase.from('courses').delete().eq('id', params.id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

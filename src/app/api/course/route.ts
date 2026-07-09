import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';
import { toCourse, type DbCourse, type DbLesson } from '@/lib/course-serialize';
import type { CourseLessonPayload, CourseSourceRef } from '@/lib/course';
import { getLibrarySourceMaterial } from '@/lib/library-source-material';

export const dynamic = 'force-dynamic';

// GET — the teacher's own courses + global templates (summary; no lessons inlined).
export async function GET() {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;

  const supabase = createServiceClient();
  const { data, error: dbError } = await supabase
    .from('courses')
    .select('*')
    .or(`teacher_id.eq.${teacher.id},is_template.eq.true`)
    .order('created_at', { ascending: false });

  if (dbError) {
    console.error('[api/course] list error:', dbError.message);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ courses: (data as DbCourse[] ?? []).map((c) => toCourse(c)) });
}

interface CreateBody {
  title?: string;
  theme?: string;
  description?: string;
  lessons?: Array<{ title: string; orderIndex: number; sourceRef?: CourseSourceRef; lessonPayload: CourseLessonPayload }>;
}

// POST — create a course with its lessons (lesson payloads are composed client-side).
export async function POST(request: NextRequest) {
  const { teacher, error } = await requireAuth();
  if (error || !teacher) return error!;

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const title = (body.title ?? '').trim();
  const theme = (body.theme ?? '').trim();
  const lessons = Array.isArray(body.lessons) ? body.lessons : [];
  if (!title || !theme) return NextResponse.json({ error: 'title and theme are required' }, { status: 400 });
  if (lessons.length === 0) return NextResponse.json({ error: 'A course needs at least one lesson' }, { status: 400 });
  if (lessons.length > 20) return NextResponse.json({ error: 'Too many lessons (max 20)' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .insert({ teacher_id: teacher.id, title, theme, description: body.description ?? null, is_template: false })
    .select('*')
    .single();
  if (courseErr || !course) {
    console.error('[api/course] create error:', courseErr?.message);
    return NextResponse.json({ error: courseErr?.message ?? 'Failed to create course' }, { status: 500 });
  }

  const rows = lessons.map((l, i) => {
    const sourceRef = l.sourceRef ?? null;
    const sourceMaterial = getLibrarySourceMaterial(sourceRef);
    const lessonPayload = sourceMaterial
      ? { ...l.lessonPayload, sourceMaterial }
      : l.lessonPayload;
    return {
      course_id: course.id,
      order_index: typeof l.orderIndex === 'number' ? l.orderIndex : i,
      title: l.title,
      source_ref: sourceRef,
      lesson_payload: lessonPayload,
      status: 'planned' as const,
    };
  });
  const { data: lessonRows, error: lessonErr } = await supabase.from('course_lessons').insert(rows).select('*');
  if (lessonErr) {
    // Roll back the course so we don't leave a lesson-less husk.
    await supabase.from('courses').delete().eq('id', course.id);
    console.error('[api/course] lesson create error:', lessonErr.message);
    return NextResponse.json({ error: lessonErr.message }, { status: 500 });
  }

  return NextResponse.json(toCourse(course as DbCourse, (lessonRows as DbLesson[]) ?? []));
}

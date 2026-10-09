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
  const courses = (data as DbCourse[] ?? []);
  // Progress for the teacher's own courses: lessons done, the next planned lesson, and the class flying it
  // (the class of the latest launched lesson's session).
  const own = courses.filter((c) => c.teacher_id === teacher.id).map((c) => c.id);
  const progress = new Map<string, CourseProgress>();
  if (own.length) {
    const { data: lessons } = await supabase
      .from('course_lessons')
      .select('course_id, id, title, order_index, status, session_id')
      .in('course_id', own)
      .order('order_index', { ascending: true });
    const rows = (lessons ?? []) as Array<{ course_id: string; id: string; title: string; order_index: number; status: string; session_id: string | null }>;
    const sessionIds = Array.from(new Set(rows.map((r) => r.session_id).filter((x): x is string => !!x)));
    const classBySession = new Map<string, { id: string; name: string }>();
    if (sessionIds.length) {
      const { data: sess } = await supabase.from('sessions').select('id, started_at, classes(id, name)').in('id', sessionIds);
      for (const s of (sess ?? []) as unknown as Array<{ id: string; classes: { id: string; name: string } | null }>) if (s.classes) classBySession.set(s.id, s.classes);
    }
    const fixedIds = Array.from(new Set(courses.map((c) => c.class_id).filter((x): x is string => !!x)));
    const classNames = new Map<string, string>();
    if (fixedIds.length) {
      const { data: cl } = await supabase.from('classes').select('id, name').in('id', fixedIds);
      for (const c of (cl ?? []) as Array<{ id: string; name: string }>) classNames.set(c.id, c.name);
    }
    for (const id of own) {
      const ls = rows.filter((r) => r.course_id === id);
      const next = ls.find((r) => r.status === 'planned') ?? null;
      const launched = [...ls].reverse().find((r) => r.session_id && classBySession.has(r.session_id));
      const courseRow = courses.find((c) => c.id === id);
      const fixed = courseRow?.class_id ? { id: courseRow.class_id, name: classNames.get(courseRow.class_id) ?? '' } : null;
      const cls = fixed ?? (launched?.session_id ? classBySession.get(launched.session_id) ?? null : null);
      progress.set(id, {
        total: ls.length,
        done: ls.filter((r) => r.status !== 'planned').length,
        next: next ? { lessonId: next.id, title: next.title, index: ls.indexOf(next) + 1 } : null,
        className: cls?.name ?? null,
        classId: cls?.id ?? null,
      });
    }
  }
  return NextResponse.json({ courses: courses.map((c) => ({ ...toCourse(c), progress: progress.get(c.id) ?? null })) });
}

export interface CourseProgress {
  total: number;
  done: number;
  next: { lessonId: string; title: string; index: number } | null;
  className: string | null;
  classId: string | null;
}

interface CreateBody {
  title?: string;
  theme?: string;
  description?: string;
  classId?: string | null;
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
  // The class must be the teacher's own (the service client bypasses row-level security).
  let classId: string | null = null;
  if (typeof body.classId === 'string' && body.classId) {
    const { data: cls } = await createServiceClient().from('classes').select('id').eq('id', body.classId).eq('teacher_id', teacher.id).maybeSingle();
    classId = cls ? body.classId : null;
  }
  if (!title || !theme) return NextResponse.json({ error: 'title and theme are required' }, { status: 400 });
  if (lessons.length === 0) return NextResponse.json({ error: 'A course needs at least one lesson' }, { status: 400 });
  // Uploaded-book reading courses can be long (one lesson per part of the book).
  const maxLessons = (body as { bookCourse?: boolean }).bookCourse ? 150 : 20;
  if (lessons.length > maxLessons) return NextResponse.json({ error: `Too many lessons (max ${maxLessons})` }, { status: 400 });

  const supabase = createServiceClient();
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .insert({ teacher_id: teacher.id, title, theme, description: body.description ?? null, is_template: false, class_id: classId })
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

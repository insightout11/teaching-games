import { createServerSupabase } from '@/lib/supabase/server';
import { FLIGHT_RESULT_KEY, flightResultLine, sanitizeFlightResult } from '@/lib/flight-result';

/**
 * Home as the departures board (docs/home-page-concept.md): one row per class with what happens next. Read with
 * the teacher's own session (row-level security keeps it to their classes).
 */
export interface BoardRow {
  classId: string;
  name: string;
  students: number;
  /** A live (active, recent) session to rejoin instead of boarding. */
  liveSessionId: string | null;
  liveTopic: string | null;
  /** The next planned lesson of a course this class has started. */
  next: { courseId: string; lessonId: string; title: string; courseTitle: string } | null;
  /** One line about the last lesson: the flight result if there is one, else its topic. */
  last: { at: string; line: string } | null;
  lastUsedAt: string | null;
}

// An "active" session older than this was left open, not live.
const LIVE_WINDOW_MS = 6 * 3600 * 1000;

export async function getDepartureBoard(teacherId: string): Promise<BoardRow[]> {
  const supabase = createServerSupabase();
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, created_at')
    .eq('teacher_id', teacherId)
    .eq('is_demo', false);
  const rows = (classes ?? []) as Array<{ id: string; name: string; created_at: string }>;
  if (!rows.length) return [];
  const ids = rows.map((c) => c.id);

  const [studentsRes, sessionsRes] = await Promise.all([
    supabase.from('students').select('class_id').in('class_id', ids),
    supabase
      .from('sessions')
      .select('id, class_id, status, started_at, topic, custom_topic')
      .in('class_id', ids)
      .order('started_at', { ascending: false })
      .limit(300),
  ]);
  const sessions = (sessionsRes.data ?? []) as Array<{ id: string; class_id: string; status: string; started_at: string; topic: string | null; custom_topic: string | null }>;

  const students = new Map<string, number>();
  for (const s of (studentsRes.data ?? []) as Array<{ class_id: string }>) students.set(s.class_id, (students.get(s.class_id) ?? 0) + 1);

  // Latest session per class, the live one, and the last finished one.
  const latest = new Map<string, (typeof sessions)[number]>();
  const live = new Map<string, (typeof sessions)[number]>();
  const lastEnded = new Map<string, (typeof sessions)[number]>();
  const now = Date.now();
  for (const s of sessions) {
    if (!latest.has(s.class_id)) latest.set(s.class_id, s);
    if (s.status === 'active' && !live.has(s.class_id) && now - Date.parse(s.started_at) < LIVE_WINDOW_MS) live.set(s.class_id, s);
    if (s.status === 'ended' && !lastEnded.has(s.class_id)) lastEnded.set(s.class_id, s);
  }

  // Flight results of the last finished lessons (teacher-only display; class counts, no names).
  const endedIds = Array.from(lastEnded.values()).map((s) => s.id);
  const results = new Map<string, string>();
  if (endedIds.length) {
    const { data } = await supabase.from('session_private_state').select('session_id, payload').eq('key', FLIGHT_RESULT_KEY).in('session_id', endedIds);
    for (const r of (data ?? []) as Array<{ session_id: string; payload: unknown }>) {
      const fr = sanitizeFlightResult(r.payload);
      if (fr) results.set(r.session_id, flightResultLine(fr));
    }
  }

  // Courses this class has started (a lesson launched in one of its sessions) → that course's next planned lesson.
  const sessionClass = new Map(sessions.map((s) => [s.id, s.class_id]));
  const next = new Map<string, BoardRow['next']>();
  const { data: launched } = await supabase
    .from('course_lessons')
    .select('course_id, session_id')
    .in('session_id', sessions.map((s) => s.id).slice(0, 300));
  const courseByClass = new Map<string, string>();
  for (const l of (launched ?? []) as Array<{ course_id: string; session_id: string | null }>) {
    const cls = l.session_id ? sessionClass.get(l.session_id) : null;
    if (cls && !courseByClass.has(cls)) courseByClass.set(cls, l.course_id);
  }
  const courseIds = Array.from(new Set(courseByClass.values()));
  if (courseIds.length) {
    const [{ data: planned }, { data: courses }] = await Promise.all([
      supabase.from('course_lessons').select('id, course_id, title, order_index, status').in('course_id', courseIds).eq('status', 'planned').order('order_index', { ascending: true }),
      supabase.from('courses').select('id, title').in('id', courseIds),
    ]);
    const titles = new Map(((courses ?? []) as Array<{ id: string; title: string }>).map((c) => [c.id, c.title]));
    courseByClass.forEach((courseId, classId) => {
      const lesson = ((planned ?? []) as Array<{ id: string; course_id: string; title: string }>).find((l) => l.course_id === courseId);
      if (lesson) next.set(classId, { courseId, lessonId: lesson.id, title: lesson.title, courseTitle: titles.get(courseId) ?? 'Course' });
    });
  }

  return rows
    .map((c) => {
      const lv = live.get(c.id) ?? null;
      const ended = lastEnded.get(c.id) ?? null;
      const topic = ended ? ended.custom_topic || ended.topic : null;
      return {
        classId: c.id,
        name: c.name,
        students: students.get(c.id) ?? 0,
        liveSessionId: lv?.id ?? null,
        liveTopic: lv ? lv.custom_topic || lv.topic || null : null,
        next: next.get(c.id) ?? null,
        last: ended ? { at: ended.started_at, line: results.get(ended.id) ?? (topic ? `${topic}` : 'Lesson') } : null,
        lastUsedAt: latest.get(c.id)?.started_at ?? c.created_at,
      };
    })
    // Live classes first, then the class used most recently.
    .sort((a, b) => Number(!!b.liveSessionId) - Number(!!a.liveSessionId) || (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? ''));
}

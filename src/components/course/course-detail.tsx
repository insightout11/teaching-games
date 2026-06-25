'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { launchCourseLesson } from '@/lib/launch-course-lesson';
import type { Course, CourseLesson } from '@/lib/course';
import { ArrowLeft, CheckCircle2, Film, FileText, Loader2, PlayCircle, Plane, Rocket, Trash2, Users } from 'lucide-react';

type TeacherClass = { id: string; name: string };

// Library source types that are video (vs. reading) — for the lesson source icon.
const VIDEO_SOURCE_TYPES = new Set(['youtube', 'ted', 'teded', 'bbc', 'voa', 'kids']);

export function CourseDetail({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/course/${courseId}`);
        if (!res.ok) throw new Error(res.status === 404 ? 'Course not found' : 'Failed to load course');
        setCourse((await res.json()) as Course);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  useEffect(() => {
    async function loadClasses() {
      const supabase = createClient();
      const { data } = await supabase.from('classes').select('id, name').order('name');
      const mapped = (data ?? []) as TeacherClass[];
      setClasses(mapped);
      if (mapped.length === 1) setSelectedClassId(mapped[0].id);
    }
    loadClasses();
  }, []);

  async function handleLaunch(lesson: CourseLesson) {
    if (!selectedClassId) return;
    setLaunchingId(lesson.id);
    setError(null);
    try {
      await launchCourseLesson(lesson, selectedClassId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to launch lesson');
      setLaunchingId(null);
    }
  }

  async function handleDelete() {
    if (!course || course.isTemplate) return;
    if (!confirm('Delete this course and its lessons?')) return;
    const res = await fetch(`/api/course/${course.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/courses');
    else setError('Failed to delete course');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-lc-text3" />
      </div>
    );
  }
  if (error && !course) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-lc-text3 mb-4">{error}</p>
        <button onClick={() => router.push('/courses')} className="text-lc-blue hover:underline">Back to courses</button>
      </div>
    );
  }
  if (!course) return null;

  const nextUpId = course.lessons.find((l) => l.status === 'planned')?.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.push('/courses')} className="flex items-center gap-2 text-sm text-lc-text3 hover:text-lc-text">
        <ArrowLeft className="w-4 h-4" /> Courses
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-lc-text">{course.title}</h1>
          <p className="text-lc-text3 mt-1">{course.theme}</p>
        </div>
        {!course.isTemplate && (
          <button onClick={handleDelete} className="shrink-0 text-lc-text3 hover:text-red-400 p-2" title="Delete course">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Class picker */}
      <div className="bg-lc-card rounded-xl border border-lc-border p-4">
        <h2 className="text-xs font-semibold text-lc-text2 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Launch with class
        </h2>
        {classes.length === 0 ? (
          <p className="text-sm text-lc-text3">No classes yet — create one from the Classes page first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedClassId === c.id ? 'bg-lc-blue text-white' : 'bg-lc-surface text-lc-text2 hover:text-lc-text'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* Lessons */}
      <div className="space-y-3">
        {course.lessons.map((l, i) => {
          const isNextUp = l.id === nextUpId;
          const launched = l.status !== 'planned';
          return (
            <div
              key={l.id}
              className={`bg-lc-card rounded-xl border p-4 flex items-center gap-4 ${
                isNextUp ? 'border-lc-blue/40' : 'border-lc-border'
              }`}
            >
              <span className="w-7 h-7 shrink-0 rounded-full bg-lc-blue/10 text-lc-blue text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lc-text truncate">{l.title}</h3>
                  {launched && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-lc-success">
                      <CheckCircle2 className="w-3 h-3" /> {l.status}
                    </span>
                  )}
                  {isNextUp && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-lc-blue bg-lc-blue/10 px-1.5 py-0.5 rounded">
                      Next up
                    </span>
                  )}
                </div>
                <p className="text-xs text-lc-text3 mt-0.5 truncate">{l.lessonPayload.customTopic}</p>
                {l.sourceRef?.kind === 'library' && (
                  <span className="inline-flex items-center gap-1 text-xs text-lc-text3 mt-1">
                    {VIDEO_SOURCE_TYPES.has(l.sourceRef.sourceType) ? <Film className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    <span className="truncate max-w-xs">{l.sourceRef.title}</span>
                  </span>
                )}
              </div>

              {l.sessionId && launched ? (
                <a
                  href={`/sessions/${l.sessionId}`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-lc-surface border border-lc-border text-sm text-lc-text2 hover:text-lc-text"
                >
                  <PlayCircle className="w-4 h-4" /> Open
                </a>
              ) : (
                <button
                  onClick={() => handleLaunch(l)}
                  disabled={!selectedClassId || launchingId !== null}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-lc-success text-lc-bg text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {launchingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  Launch
                </button>
              )}
            </div>
          );
        })}
      </div>

      {course.lessons.length === 0 && (
        <div className="text-center py-12 text-lc-text3">
          <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
          This course has no lessons yet.
        </div>
      )}
    </div>
  );
}

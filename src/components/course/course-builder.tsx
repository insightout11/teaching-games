'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { GOAL_LABELS, type GoalTag } from '@/lib/flight-plan-config';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import { composeLesson, difficultyToComposerLevel } from '@/lib/planner-compose';
import { buildCourseLessonPayload } from '@/lib/planner-utils';
import type { CourseOutline, CourseOutlineLesson, CourseSourceRef } from '@/lib/course';
import { ArrowLeft, ArrowDown, ArrowUp, Film, FileText, Loader2, Sparkles, Trash2, Wand2 } from 'lucide-react';

type EditableLesson = CourseOutlineLesson & { _id: string };

export function CourseBuilder() {
  const router = useRouter();
  const { loading: tierLoading, isPro } = useTeacherTier();

  const [theme, setTheme] = useState('');
  const [level, setLevel] = useState<Difficulty>('Intermediate');
  const [lessonCount, setLessonCount] = useState(5);
  const [phase, setPhase] = useState<'theme' | 'outline'>('theme');

  const [courseTitle, setCourseTitle] = useState('');
  const [lessons, setLessons] = useState<EditableLesson[]>([]);

  const [proposing, setProposing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePropose() {
    setProposing(true);
    setError(null);
    try {
      const res = await fetch('/api/course/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: theme.trim(), lessonCount, level }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to build outline' }));
        throw new Error(err.error ?? 'Failed to build outline');
      }
      const outline = (await res.json()) as CourseOutline;
      setCourseTitle(outline.title);
      setLevel(outline.difficulty);
      setLessons(outline.lessons.map((l, i) => ({ ...l, _id: `${Date.now()}-${i}` })));
      setPhase('outline');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build outline');
    } finally {
      setProposing(false);
    }
  }

  function updateLesson(id: string, patch: Partial<EditableLesson>) {
    setLessons((prev) => prev.map((l) => (l._id === id ? { ...l, ...patch } : l)));
  }
  function removeLesson(id: string) {
    setLessons((prev) => prev.filter((l) => l._id !== id));
  }
  function move(id: string, dir: -1 | 1) {
    setLessons((prev) => {
      const i = prev.findIndex((l) => l._id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function handleSave() {
    if (!courseTitle.trim() || lessons.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const payloadLessons = lessons.map((l, i) => {
        const sourceKind = l.suggestedSource ? (l.suggestedSource.kind === 'video' ? 'video' : 'text') : null;
        const modules = composeLesson({
          goal: l.goal,
          level: difficultyToComposerLevel(level),
          durationMinutes: 60,
          sourceKind,
        });
        const lessonPayload = buildCourseLessonPayload(
          { topic: l.topic, difficulty: level, goal: l.goal, durationMinutes: 60 },
          modules,
        );
        const sourceRef: CourseSourceRef = l.suggestedSource
          ? {
              kind: 'library',
              sourceType: l.suggestedSource.sourceType,
              id: l.suggestedSource.id,
              title: l.suggestedSource.title,
            }
          : null;
        return { title: l.title, orderIndex: i, sourceRef, lessonPayload };
      });

      const res = await fetch('/api/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: courseTitle.trim(), theme: theme.trim(), lessons: payloadLessons }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save course' }));
        throw new Error(err.error ?? 'Failed to save course');
      }
      const course = (await res.json()) as { id: string };
      router.push(`/courses/${course.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save course');
      setSaving(false);
    }
  }

  if (!tierLoading && !isPro) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold text-lc-text mb-2">Course Builder is a Pro feature</h1>
        <a href="/pro" className="inline-flex items-center gap-2 px-5 py-3 mt-4 rounded-xl bg-lc-blue text-white font-semibold hover:brightness-110">
          <Sparkles className="w-4 h-4" /> Upgrade to Pro
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.push('/courses')} className="flex items-center gap-2 text-sm text-lc-text3 hover:text-lc-text">
        <ArrowLeft className="w-4 h-4" /> Courses
      </button>

      {phase === 'theme' ? (
        <div className="bg-lc-card rounded-2xl border border-lc-border p-6 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-lc-text">Describe your course</h1>
            <p className="text-lc-text3 mt-1 text-sm">
              A theme and a few lessons — we&apos;ll propose a connected arc, each lesson anchored to a video or reading.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-lc-text2 mb-1.5">Theme</label>
            <textarea
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              rows={3}
              placeholder="e.g. Travel English for a trip abroad — airport, hotel, restaurants, getting around"
              className="w-full px-3 py-2.5 rounded-lg bg-lc-surface border border-lc-border text-sm text-lc-text placeholder:text-lc-text3 focus:outline-none focus:ring-1 focus:ring-lc-blue resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-sm font-medium text-lc-text2 mb-1.5">Level</label>
              <div className="flex gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setLevel(d as Difficulty)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      level === d ? 'bg-lc-blue text-white' : 'bg-lc-surface border border-lc-border text-lc-text2 hover:border-lc-blue/50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-lc-text2 mb-1.5">Lessons</label>
              <div className="flex gap-1.5">
                {[3, 4, 5, 6, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => setLessonCount(n)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      lessonCount === n ? 'bg-lc-blue text-white' : 'bg-lc-surface border border-lc-border text-lc-text2 hover:border-lc-blue/50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handlePropose}
            disabled={theme.trim().length < 3 || proposing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-lc-success text-lc-bg font-semibold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {proposing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {proposing ? 'Proposing outline…' : 'Propose outline'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-lc-text3 uppercase tracking-wider mb-1.5">Course title</label>
            <input
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-lc-surface border border-lc-border text-lg font-semibold text-lc-text focus:outline-none focus:ring-1 focus:ring-lc-blue"
            />
          </div>

          <div className="space-y-3">
            {lessons.map((l, i) => (
              <div key={l._id} className="bg-lc-card rounded-xl border border-lc-border p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <span className="w-6 h-6 rounded-full bg-lc-blue/10 text-lc-blue text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div className="flex flex-col">
                      <button onClick={() => move(l._id, -1)} disabled={i === 0} className="text-lc-text3 hover:text-lc-text disabled:opacity-30">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => move(l._id, 1)} disabled={i === lessons.length - 1} className="text-lc-text3 hover:text-lc-text disabled:opacity-30">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      value={l.title}
                      onChange={(e) => updateLesson(l._id, { title: e.target.value })}
                      className="w-full px-2 py-1 rounded-md bg-lc-surface border border-lc-border text-sm font-semibold text-lc-text focus:outline-none focus:ring-1 focus:ring-lc-blue"
                    />
                    <input
                      value={l.topic}
                      onChange={(e) => updateLesson(l._id, { topic: e.target.value })}
                      placeholder="Specific topic to ground the lesson"
                      className="w-full px-2 py-1 rounded-md bg-lc-surface border border-lc-border text-xs text-lc-text2 focus:outline-none focus:ring-1 focus:ring-lc-blue"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={l.goal}
                        onChange={(e) => updateLesson(l._id, { goal: e.target.value as GoalTag })}
                        className="px-2 py-1 rounded-md bg-lc-surface border border-lc-border text-xs text-lc-text2 focus:outline-none cursor-pointer"
                      >
                        {(Object.entries(GOAL_LABELS) as [GoalTag, string][]).map(([k, label]) => (
                          <option key={k} value={k}>{label}</option>
                        ))}
                      </select>
                      {l.suggestedSource ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-lc-blue/10 text-lc-blue text-xs max-w-[60%]">
                          {l.suggestedSource.kind === 'video' ? <Film className="w-3 h-3 shrink-0" /> : <FileText className="w-3 h-3 shrink-0" />}
                          <span className="truncate">{l.suggestedSource.title}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-lc-text3">No source — grounded by topic</span>
                      )}
                    </div>
                  </div>

                  <button onClick={() => removeLesson(l._id)} className="text-lc-text3 hover:text-red-400 pt-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setPhase('theme')} className="text-sm text-lc-text3 hover:text-lc-text">
              ← Back to theme
            </button>
            <button
              onClick={handleSave}
              disabled={saving || lessons.length === 0 || !courseTitle.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lc-success text-lc-bg font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save course
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

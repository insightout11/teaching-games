'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import type { Course } from '@/lib/course';
import { COURSE_PRESETS } from '@/lib/course-presets';
import { BookOpen, Loader2, Plus, Sparkles, Layers } from 'lucide-react';

export function CoursesHome() {
  const { loading: tierLoading, isPro } = useTeacherTier();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/course');
        if (!res.ok) throw new Error('Failed to load courses');
        const data = (await res.json()) as { courses: Course[] };
        setCourses(data.courses ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const mine = courses.filter((c) => !c.isTemplate);
  const templates = courses.filter((c) => c.isTemplate);

  if (!tierLoading && !isPro) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-lc-amber/10 mb-4">
          <Layers className="w-7 h-7 text-lc-amber" />
        </div>
        <h1 className="text-2xl font-bold text-lc-text mb-2">Courses</h1>
        <p className="text-lc-text3 mb-6 leading-relaxed">
          Plan a connected arc of lessons around a theme — each anchored to a reading or video, launched one
          at a time. Course Builder is a Pro feature.
        </p>
        <a
          href="/pro"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-lc-blue text-white font-semibold hover:brightness-110 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade to Pro
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-lc-text">Courses</h1>
          <p className="text-lc-text3 mt-1">A connected arc of lessons around one theme.</p>
        </div>
        <Link
          href="/courses/new"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lc-success text-lc-bg font-semibold hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" />
          New course
        </Link>
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <Section title="Course presets" subtitle="Start from a ready-made six-lesson arc, then edit before saving.">
        <PresetGrid />
      </Section>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-lc-text3" />
        </div>
      ) : (
        <>
          <Section title="Your courses">
            {mine.length === 0 ? (
              <EmptyState />
            ) : (
              <CourseGrid courses={mine} />
            )}
          </Section>

          {templates.length > 0 && (
            <Section title="Pre-built courses" subtitle="Start from a ready-made arc — you can edit it after.">
              <CourseGrid courses={templates} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-lc-text2 uppercase tracking-wider">{title}</h2>
        {subtitle && <p className="text-xs text-lc-text3 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function PresetGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {COURSE_PRESETS.map((preset) => (
        <Link
          key={preset.id}
          href={`/courses/new?preset=${encodeURIComponent(preset.id)}`}
          className="block bg-lc-card rounded-xl border border-lc-border p-4 hover:border-lc-blue/40 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-lc-blue shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-lc-blue bg-lc-blue/10 px-1.5 py-0.5 rounded">
              6 lessons
            </span>
          </div>
          <h3 className="font-semibold text-lc-text leading-snug">{preset.title}</h3>
          <p className="text-xs text-lc-text3 mt-1 line-clamp-2">{preset.blurb}</p>
        </Link>
      ))}
    </div>
  );
}

function CourseGrid({ courses }: { courses: Course[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map((c) => (
        <Link
          key={c.id}
          href={`/courses/${c.id}`}
          className="block bg-lc-card rounded-xl border border-lc-border p-5 hover:border-lc-blue/40 transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-lc-blue shrink-0" />
            {c.isTemplate && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-lc-amber bg-lc-amber/10 px-1.5 py-0.5 rounded">
                Pre-built
              </span>
            )}
          </div>
          <h3 className="font-semibold text-lc-text leading-snug">{c.title}</h3>
          <p className="text-xs text-lc-text3 mt-1 line-clamp-2">{c.theme}</p>
        </Link>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-lc-card rounded-xl border border-dashed border-lc-border p-8 text-center">
      <p className="text-lc-text3 mb-4">No courses yet. Describe a theme and let it propose an outline.</p>
      <Link
        href="/courses/new"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lc-blue text-white text-sm font-medium hover:brightness-110 transition-all"
      >
        <Plus className="w-4 h-4" />
        New course
      </Link>
    </div>
  );
}

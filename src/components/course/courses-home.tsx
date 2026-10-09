'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import type { Course } from '@/lib/course';
import type { CourseProgress } from '@/app/api/course/route';
import { COURSE_PRESETS, READING_COURSE_PRESETS, type CoursePreset } from '@/lib/course-presets';
import { FLAP_FONT } from '@/components/ui/split-flap';
import { BookOpen, BookUp, Layers, Loader2, Plus, Sparkles } from 'lucide-react';

// Courses (Oct 2026 redesign): each course is an itinerary pass (lessons as stops, the next one highlighted, the
// class flying it); then the ways to start one, with uploading your own book first.

type ListedCourse = Course & { progress: CourseProgress | null };

const PASS = '#fff6e4';
const INK = '#1b2233';

function Legs({ total, done }: { total: number; done: number }) {
  const n = Math.max(1, Math.min(total, 12));
  return (
    <div className="flex items-center" aria-label={`${done} of ${total} lessons done`}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="flex flex-1 items-center last:flex-none">
          <span
            className="block h-3 w-3 shrink-0 rounded-full border-2"
            style={{
              borderColor: i === done ? '#e08a00' : '#0b6b85',
              background: i < done ? '#0b6b85' : i === done ? '#ffd27a' : PASS,
            }}
          />
          {i < n - 1 && <span className="h-0.5 flex-1 bg-[#cdbf9f]" />}
        </span>
      ))}
    </div>
  );
}

function CoursePass({ c }: { c: ListedCourse }) {
  const p = c.progress;
  const total = p?.total ?? c.lessons.length;
  const done = p?.done ?? 0;
  const kind = /reading|book/i.test(`${c.title} ${c.theme}`) ? 'READING COURSE' : 'COURSE';
  return (
    <Link href={`/courses/${c.id}`} className="flex flex-col overflow-hidden rounded-2xl shadow-[0_14px_30px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5" style={{ background: PASS, color: INK }}>
      <div className="flex justify-between bg-[#14202f] px-4 py-2.5 text-[11px] font-bold tracking-[0.16em] text-[#fff4dc]" style={{ fontFamily: FLAP_FONT }}>
        {c.isTemplate ? 'PRE-BUILT' : kind}<span className="text-amber-300">{total} STOPS</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-4 py-3.5">
        <h3 className="line-clamp-2 text-[17px] font-bold uppercase leading-snug" style={{ fontFamily: FLAP_FONT }}>{c.title}</h3>
        {total > 0 && <Legs total={total} done={done} />}
        <p className="truncate text-[13px] text-[#5b5240]">
          {p?.next ? `Next: lesson ${p.next.index} · ${p.next.title}` : total > 0 && done >= total ? 'All lessons flown' : c.theme}
        </p>
      </div>
      <div className="flex items-center justify-between border-t-2 border-dashed border-[#d8c9a8] px-4 py-2.5 text-[13px]">
        <span className="truncate text-[#5b5240]">{p?.className ?? (c.isTemplate ? 'Ready to use' : 'No class yet')}</span>
        <span className="shrink-0 font-semibold text-[#0b6b85]">{p?.next ? `Continue: lesson ${p.next.index}` : 'Open'}</span>
      </div>
    </Link>
  );
}

function PresetTile({ preset, reading }: { preset: CoursePreset; reading?: boolean }) {
  return (
    <Link
      href={`/courses/new?preset=${encodeURIComponent(preset.id)}`}
      className="group flex min-w-0 flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-[#0a121e]/85 p-4 transition-colors hover:border-cyan-300/30"
    >
      <span className="text-[10px] font-bold tracking-[0.16em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>
        {preset.lessons.length} LESSONS · {preset.level.toUpperCase()}
      </span>
      <h3 className="font-semibold leading-snug text-white">{reading ? preset.title.replace(/ \(reading course\)$/, '') : preset.title}</h3>
      <p className="line-clamp-2 text-xs text-white/55">{preset.blurb}</p>
    </Link>
  );
}

export function CoursesHome() {
  const { loading: tierLoading, isPro } = useTeacherTier();
  const [courses, setCourses] = useState<ListedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/course');
        if (!res.ok) throw new Error('Could not load your courses.');
        const data = (await res.json()) as { courses: ListedCourse[] };
        setCourses(data.courses ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load your courses.');
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
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-16 text-center">
        <Layers className="h-10 w-10 text-amber-300" />
        <h1 className="font-display text-4xl text-white">Lessons that <em className="text-amber-300">connect</em></h1>
        <p className="leading-relaxed text-white/60">
          A course is a run of lessons around one theme or one book, each lesson picking up where the last one ended.
          Upload your own book, or start from a ready-made course. Courses are part of Pro.
        </p>
        <a href="/pro" className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-[#03202a] hover:bg-cyan-300">
          <Sparkles className="h-4 w-4" />See Pro
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/90" style={{ fontFamily: FLAP_FONT }}>Courses</p>
          <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">Lessons that <em className="text-amber-300">connect</em></h1>
        </div>
        <Link href="/courses/new" className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-[#03202a] hover:bg-cyan-300">
          <Plus className="h-4 w-4" />New course
        </Link>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>Your courses</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
        ) : mine.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-white/55">
            No courses yet. Upload a book, or start from one of the ready courses below.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((c) => <CoursePass key={c.id} c={c} />)}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
        <Link href="/courses/book" className="flex flex-col gap-2 rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-300/[0.14] to-[#0a121e]/85 p-5 hover:border-cyan-300/60">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>Start from your book</span>
          <h2 className="text-lg font-semibold text-white">Upload a book, a scan or photos of the pages</h2>
          <p className="text-sm text-white/65">It becomes a course of lessons at your class&apos;s level, read aloud in turns, with the pictures kept for picture books.</p>
          <span className="mt-1 inline-flex items-center gap-2 self-start rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-[#03202a]"><BookUp className="h-4 w-4" />Upload a book</span>
        </Link>
        <a href="#reading-courses" className="flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[#0a121e]/85 p-5 hover:border-cyan-300/30">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>Reading courses</span>
          <h2 className="text-lg font-semibold text-white">{READING_COURSE_PRESETS.length} ready books</h2>
          <p className="text-sm text-white/65">Beatrix Potter, fairy tales, Alice, Sherlock Holmes and more, kids to teens.</p>
        </a>
        <a href="#theme-courses" className="flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[#0a121e]/85 p-5 hover:border-cyan-300/30">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>Theme courses</span>
          <h2 className="text-lg font-semibold text-white">{COURSE_PRESETS.length} six-lesson themes</h2>
          <p className="text-sm text-white/65">Travel, food, animals, technology and more. Pick one, edit the lessons, save.</p>
        </a>
      </section>

      <section id="reading-courses" className="scroll-mt-20 space-y-3">
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: FLAP_FONT }}><BookOpen className="h-3.5 w-3.5" />Reading courses</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {READING_COURSE_PRESETS.map((p) => <PresetTile key={p.id} preset={p} reading />)}
        </div>
      </section>

      <section id="theme-courses" className="scroll-mt-20 space-y-3">
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: FLAP_FONT }}><Layers className="h-3.5 w-3.5" />Theme courses</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COURSE_PRESETS.map((p) => <PresetTile key={p.id} preset={p} />)}
        </div>
      </section>

      {templates.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>Pre-built courses</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((c) => <CoursePass key={c.id} c={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}

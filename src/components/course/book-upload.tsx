'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Link2, Loader2, Upload } from 'lucide-react';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import { planLessons, toChapters, type BookChapter, type BookLesson } from '@/lib/book-import';
import { readBookFile } from '@/lib/book-import/readers';
import { buildCourseLessonPayload } from '@/lib/planner-utils';
import { buildCourseModulesFromPreset, buildFlightConfigForCourseSlots, getCourseFlightPreset } from '@/lib/course-flight-preset';
import { buildCourseLessonContext } from '@/lib/course-context';
import type { CourseOutlineLesson } from '@/lib/course';
import type { SourceMaterial } from '@/types/source-material';

// Upload a book → a private reading course (docs/book-upload-plan.md). The file is read and
// cleaned in this browser (no AI, nothing uploaded while reading); only the lesson texts are
// saved, as a private course on the Reading flight. Each lesson's questions are written when
// that lesson is prepared.

const MAX_LESSONS = 150;

function joinWithNext(lessons: BookLesson[], i: number): BookLesson[] {
  if (i >= lessons.length - 1) return lessons;
  const a = lessons[i];
  const b = lessons[i + 1];
  const merged: BookLesson = { title: `${a.title} – ${b.title}`, chapters: Array.from(new Set([...a.chapters, ...b.chapters])), text: `${a.text}\n\n${b.text}`, words: a.words + b.words };
  return [...lessons.slice(0, i), merged, ...lessons.slice(i + 2)];
}

export function BookUpload() {
  const router = useRouter();
  const { isPro, loading: tierLoading } = useTeacherTier();
  const [phase, setPhase] = useState<'pick' | 'reading' | 'ready' | 'saving'>('pick');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<Difficulty>('Easy');
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [joins, setJoins] = useState<number[]>([]); // "join with next" clicks, replayed on the planned lessons
  const [rights, setRights] = useState(false);

  const lessons = useMemo(() => joins.reduce((ls, i) => joinWithNext(ls, i), planLessons(chapters, level)), [chapters, level, joins]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPhase('reading');
    setProgress(null);
    try {
      const pages = await readBookFile(file, (done, total) => setProgress({ done, total }));
      const found = toChapters(pages);
      if (found.reduce((n, c) => n + c.words, 0) < 100) throw new Error('We couldn’t find readable text in this file. If it’s a scanned book (pictures of pages), it can’t be read yet.');
      setChapters(found);
      setJoins([]);
      setTitle(file.name.replace(/\.(pdf|docx|txt)$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      setPhase('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.');
      setPhase('pick');
    }
  };

  const create = async () => {
    if (!rights || !title.trim() || lessons.length === 0) return;
    if (lessons.length > MAX_LESSONS) { setError(`That’s ${lessons.length} lessons; the most is ${MAX_LESSONS}. Try a higher level (longer lessons) or a shorter book.`); return; }
    setPhase('saving');
    setError(null);
    try {
      const book = title.trim();
      const preset = getCourseFlightPreset('vocabulary-building', 'reading-60');
      const outline: CourseOutlineLesson[] = lessons.map((l) => ({ title: l.title, topic: `${book}: ${l.title}`, goal: 'vocabulary-building', flightPresetId: 'reading-60' }));
      const payloadLessons = lessons.map((l, i) => {
        const modules = buildCourseModulesFromPreset(preset, 'text');
        const courseContext = buildCourseLessonContext({ courseTitle: book, courseTheme: `Reading ${book} together`, lessons: outline, index: i });
        const lessonPayload = buildCourseLessonPayload({ topic: `${book}: ${l.title}`, difficulty: level, goal: 'vocabulary-building', durationMinutes: 60, courseContext }, modules);
        const flightConfig = buildFlightConfigForCourseSlots(preset.flightConfig, lessonPayload.slots);
        if (flightConfig) { lessonPayload.flightPresetId = preset.id; lessonPayload.flightConfig = flightConfig; }
        const material: SourceMaterial = {
          sourceType: 'text',
          title: `${book}: ${l.title}`,
          summary: l.text.slice(0, 500),
          rawText: l.text,
          originalText: l.text,
          documentKind: 'book-part',
          wordCount: l.words,
        };
        // The full text lives once, in the lesson payload; the source ref keeps only the label.
        const label: SourceMaterial = { sourceType: material.sourceType, title: material.title, summary: material.summary.slice(0, 200), documentKind: material.documentKind, wordCount: material.wordCount };
        return { title: l.title, orderIndex: i, sourceRef: { kind: 'custom' as const, material: label }, lessonPayload: { ...lessonPayload, sourceMaterial: material } };
      });
      const res = await fetch('/api/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `${book} (reading course)`, theme: `Reading ${book} together, one part per lesson`, description: 'Private reading course from an uploaded book.', bookCourse: true, lessons: payloadLessons }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save course' }));
        throw new Error(err.error ?? 'Failed to save course');
      }
      const course = (await res.json()) as { id: string };
      router.push(`/courses/${course.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save course');
      setPhase('ready');
    }
  };

  if (!tierLoading && !isPro) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold text-lc-text">Reading courses from your own books are a Pro feature</h1>
        <a href="/pro" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lc-blue px-5 py-3 font-semibold text-white hover:brightness-110">Upgrade to Pro</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => router.push('/courses/new')} className="flex items-center gap-2 text-sm text-lc-text3 hover:text-lc-text"><ArrowLeft className="h-4 w-4" />Courses</button>

      {(phase === 'pick' || phase === 'reading') && (
        <div className="space-y-4 rounded-2xl border border-lc-border bg-lc-card p-6">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-lc-text"><BookOpen className="h-5 w-5 text-lc-blue" />Make a reading course from your book</h1>
            <p className="mt-1 text-sm text-lc-text3">Upload a PDF, Word or text file. It’s read here in your browser and split into lessons for your class level. Students take turns reading each part aloud in class.</p>
          </div>
          <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-lc-border p-10 text-center hover:border-lc-blue/60 ${phase === 'reading' ? 'pointer-events-none opacity-60' : ''}`}>
            {phase === 'reading' ? <Loader2 className="h-8 w-8 animate-spin text-lc-blue" /> : <Upload className="h-8 w-8 text-lc-blue" />}
            <span className="font-semibold text-lc-text">{phase === 'reading' ? (progress ? `Reading page ${progress.done} of ${progress.total}…` : 'Reading your book…') : 'Choose a book file'}</span>
            <span className="text-xs text-lc-text3">PDF, .docx or .txt · your file stays private to you</span>
            <input type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}
        </div>
      )}

      {(phase === 'ready' || phase === 'saving') && (
        <div className="space-y-5 rounded-2xl border border-lc-border bg-lc-card p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-lc-success">Book ready</p>
            <h1 className="text-2xl font-bold text-lc-text">{lessons.length} lessons · {chapters.length} chapters</h1>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-lc-text3">Book title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-lc-border bg-lc-surface px-3 py-2 text-lc-text" />
            </label>
            <label className="block text-sm">
              <span className="text-lc-text3">Class level (sets the lesson length)</span>
              <select value={level} onChange={(e) => { setLevel(e.target.value as Difficulty); setJoins([]); }} className="mt-1 w-full rounded-xl border border-lc-border bg-lc-surface px-3 py-2 text-lc-text">
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          </div>
          <ol className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {lessons.map((l, i) => (
              <li key={`${l.title}-${i}`} className="flex items-center gap-3 rounded-xl border border-lc-border bg-lc-surface px-3 py-2 text-sm">
                <span className="w-6 shrink-0 text-center font-bold text-lc-blue">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-lc-text">{l.title}</span>
                <span className="shrink-0 text-xs text-lc-text3">{l.words} words</span>
                {i < lessons.length - 1 && (
                  <button type="button" title="Join with the next lesson" onClick={() => setJoins((j) => [...j, i])} className="shrink-0 rounded-lg p-1 text-lc-text3 hover:bg-white/5 hover:text-lc-text"><Link2 className="h-4 w-4" /></button>
                )}
              </li>
            ))}
          </ol>
          <label className="flex items-start gap-2 text-sm text-lc-text2">
            <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-1" />
            I have the right to use this book with my class. It stays private to my lessons.
          </label>
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => { setPhase('pick'); setChapters([]); }} className="text-sm text-lc-text3 hover:text-lc-text">Choose another file</button>
            <button type="button" disabled={!rights || !title.trim() || phase === 'saving'} onClick={() => void create()} className="inline-flex items-center gap-2 rounded-xl bg-lc-blue px-5 py-3 font-semibold text-white disabled:opacity-40">
              {phase === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}Create the reading course
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

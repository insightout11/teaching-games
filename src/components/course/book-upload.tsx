'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Link2, Loader2, ScanText, Upload } from 'lucide-react';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import { isPictureBook, picturePages, planLessons, planPictureLessons, toChapters, type BookChapter, type BookLesson, type PicturePage } from '@/lib/book-import';
import { isScannedPdf, readBookFile, renderImageFile, renderPdfPages } from '@/lib/book-import/readers';
import { dropRepeatedCaptions, needsReading, readBatches, readToBookPage, type PageRead } from '@/lib/book-import/scan';
import type { BookPage } from '@/lib/book-import';
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

/** The end of a part (whole paragraphs, up to n words): enough for "Previously..." without doubling the book. */
function lastWords(text: string, n: number): string {
  const paras = text.split(/\n\n/);
  const out: string[] = [];
  let count = 0;
  for (let i = paras.length - 1; i >= 0 && (count === 0 || count + paras[i].split(/\s+/).length <= n); i--) {
    out.unshift(paras[i]);
    count += paras[i].split(/\s+/).length;
  }
  return out.join('\n\n');
}

/** Save one page picture to the teacher's private folder; returns its storage path. */
async function uploadPage(blob: Blob, bookId: string, page: number): Promise<string> {
  const form = new FormData();
  form.append('file', blob, `${page}.jpg`);
  form.append('bookId', bookId);
  form.append('page', String(page));
  const up = await fetch('/api/book-pages', { method: 'POST', body: form });
  if (!up.ok) throw new Error('Could not save the page pictures. Please try again.');
  return ((await up.json()) as { path: string }).path;
}

const IMAGE = /\.(jpe?g|png|webp|heic|heif)$/i;

type UploadLesson = BookLesson & { pages?: PicturePage[] };

function joinWithNext(lessons: UploadLesson[], i: number): UploadLesson[] {
  if (i >= lessons.length - 1) return lessons;
  const a = lessons[i];
  const b = lessons[i + 1];
  const merged: UploadLesson = { title: `${a.title} – ${b.title}`, chapters: Array.from(new Set([...a.chapters, ...b.chapters])), text: `${a.text}\n\n${b.text}`, words: a.words + b.words, ...(a.pages ? { pages: [...a.pages, ...(b.pages ?? [])] } : {}) };
  return [...lessons.slice(0, i), merged, ...lessons.slice(i + 2)];
}

export function BookUpload() {
  const router = useRouter();
  const { isPro, loading: tierLoading } = useTeacherTier();
  const [phase, setPhase] = useState<'pick' | 'reading' | 'scan' | 'scanning' | 'ready' | 'saving'>('pick');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<Difficulty>('Easy');
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [joins, setJoins] = useState<number[]>([]); // "join with next" clicks, replayed on the planned lessons
  const [rights, setRights] = useState(false);
  const [simplify, setSimplify] = useState(false);
  // Picture books: one page = one reading turn, shown with its picture (drawn from the PDF when saving).
  // `saved`: pictures already in storage (scanned books), so they aren't drawn again.
  const [pictures, setPictures] = useState<{ file?: File; pages: PicturePage[]; saved?: Map<number, string> } | null>(null);
  // Scanned books: a PDF with no text inside, or phone photos; the AI reads the text from the pictures.
  const [scan, setScan] = useState<{ name: string; pdf?: File; photos?: File[]; count: number; hiddenText?: boolean } | null>(null);
  const [scanNote, setScanNote] = useState<string | null>(null);
  // Scanned pages read this month, and the monthly limit (until pricing is decided).
  const [usage, setUsage] = useState<{ used: number; cap: number; resets: string } | null>(null);
  useEffect(() => {
    if (!scan) return;
    let live = true;
    fetch('/api/book-pages/read').then((r) => (r.ok ? r.json() : null)).then((u) => { if (live && u) setUsage(u); }).catch(() => {});
    return () => { live = false; };
  }, [scan]);
  const overLimit = !!(scan && usage && usage.used + scan.count > usage.cap);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  const lessons = useMemo(() => {
    const planned: UploadLesson[] = pictures ? planPictureLessons(pictures.pages, level, title.trim() || 'The book') : planLessons(chapters, level);
    return joins.reduce((ls, i) => joinWithNext(ls, i), planned);
  }, [chapters, level, joins, pictures, title]);

  /** Pages (from a file's text, or read from pictures) → chapters or a picture book → the ready screen. */
  const finish = (pages: BookPage[], name: string, opts: { pdf?: File; saved?: Map<number, string>; isPdf: boolean }) => {
    const picture = (opts.isPdf || opts.saved) && isPictureBook(pages) ? picturePages(pages) : null;
    const found = picture ? [] : toChapters(pages);
    if (picture ? picture.length === 0 : found.reduce((n, c) => n + c.words, 0) < 100) throw new Error('We couldn’t find readable text in this file.');
    setPictures(picture && picture.length ? { file: opts.pdf, pages: picture, saved: opts.saved } : null);
    setChapters(found);
    setJoins([]);
    setTitle(name.replace(/\.(pdf|docx|txt|jpe?g|png|webp|heic|heif)$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    setPhase('ready');
  };

  const onFiles = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    setError(null);
    setScanNote(null);
    setProgress(null);
    // Photos of the pages: in the order they were taken.
    if (files.every((f) => f.type.startsWith('image/') || IMAGE.test(f.name))) {
      const photos = [...files].sort((a, b) => a.lastModified - b.lastModified || a.name.localeCompare(b.name));
      setScan({ name: 'My book', photos, count: photos.length });
      setPhase('scan');
      return;
    }
    const file = files[0];
    setPhase('reading');
    try {
      const pages = await readBookFile(file, (done, total) => setProgress({ done, total }));
      const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
      const noText = isPdf && needsReading(pages);
      if (noText || (isPdf && (await isScannedPdf(file)))) {
        setScan({ name: file.name, pdf: file, count: pages.length, hiddenText: !noText });
        setPhase('scan');
        return;
      }
      finish(pages, file.name, { pdf: isPdf ? file : undefined, isPdf });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.');
      setPhase('pick');
    }
  };

  /** Scanned book: draw each page, save it privately, and have the AI read the text, 5 pages at a time. */
  const readScan = async () => {
    if (!scan) return;
    setPhase('scanning');
    setError(null);
    setProgress({ done: 0, total: scan.count });
    try {
      const bookId = crypto.randomUUID();
      const saved = new Map<number, string>();
      const reads: Array<PageRead | null> = [];
      for (const batch of readBatches(Array.from({ length: scan.count }, (_, i) => i + 1))) {
        const blobs = scan.pdf
          ? await renderPdfPages(scan.pdf, batch, undefined, 1400)
          : new Map(await Promise.all(batch.map(async (n) => [n, await renderImageFile(scan.photos![n - 1])] as const)));
        const paths: string[] = [];
        for (const n of batch) {
          const blob = blobs.get(n);
          if (!blob) throw new Error(`Could not draw page ${n}.`);
          const path = await uploadPage(blob, bookId, n);
          saved.set(n, path);
          paths.push(path);
        }
        const res = await fetch('/api/book-pages/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paths }) });
        if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Could not read the pages. Please try again.');
        reads.push(...((await res.json()) as { pages: Array<PageRead | null> }).pages);
        setProgress({ done: Math.min(batch[batch.length - 1], scan.count), total: scan.count });
      }
      const skipped = reads.filter((r) => !r || !r.readable).length;
      if (scan.count - skipped < scan.count / 2) throw new Error('Most pages were too unclear to read. Try a sharper scan or brighter photos.');
      if (skipped) setScanNote(`${skipped} page${skipped === 1 ? ' was' : 's were'} too unclear to read and ${skipped === 1 ? 'was' : 'were'} skipped.`);
      finish(dropRepeatedCaptions(reads).map(readToBookPage), scan.name, { saved, isPdf: !!scan.pdf });
      setScan(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read the pages.');
      setPhase('scan');
    }
  };

  const create = async () => {
    if (!rights || !title.trim() || lessons.length === 0) return;
    if (lessons.length > MAX_LESSONS) { setError(`That’s ${lessons.length} lessons; the most is ${MAX_LESSONS}. Try a higher level (longer lessons) or a shorter book.`); return; }
    setPhase('saving');
    setError(null);
    try {
      const book = title.trim();
      // Picture books: draw and save each page's picture first (private to this teacher).
      const images = new Map<number, string>();
      if (pictures) {
        const wanted = lessons.flatMap((l) => (l.pages ?? []).map((p) => p.page));
        pictures.saved?.forEach((path, page) => images.set(page, path));
        const missing = wanted.filter((p) => !images.has(p));
        if (missing.length && pictures.file) {
          const bookId = crypto.randomUUID();
          const blobs = await renderPdfPages(pictures.file, missing, (d, t) => setSaveNote(`Drawing page ${d} of ${t}…`));
          let done = 0;
          for (const [page, blob] of Array.from(blobs.entries())) {
            images.set(page, await uploadPage(blob, bookId, page));
            setSaveNote(`Saving picture ${++done} of ${blobs.size}…`);
          }
        }
        setSaveNote('Saving the course…');
      }
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
          ...(simplify && !pictures ? { simplify: true } : {}),
          ...(i > 0 ? { previousPart: { title: lessons[i - 1].title, text: lastWords(lessons[i - 1].text, 1200) } } : {}),
          ...(l.pages ? { bookPages: l.pages.map((p) => ({ text: p.text, ...(images.get(p.page) ? { image: images.get(p.page) } : {}) })) } : {}),
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
      setSaveNote(null);
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
            <span className="text-xs text-lc-text3">PDF (also scanned), .docx, .txt, or photos of the pages · your file stays private to you</span>
            <input type="file" multiple accept=".pdf,.docx,.txt,application/pdf,text/plain,image/*,.heic,.heif" className="hidden" onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />
          </label>
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}
        </div>
      )}

      {(phase === 'scan' || phase === 'scanning') && scan && (
        <div className="space-y-4 rounded-2xl border border-lc-border bg-lc-card p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-lc-blue">{scan.photos ? 'Photos of the pages' : 'Scanned book'}</p>
            <h1 className="text-2xl font-bold text-lc-text">{scan.count} page{scan.count === 1 ? '' : 's'}</h1>
            <p className="mt-1 text-sm text-lc-text3">{scan.photos ? 'Pages are in the order the photos were taken. ' : scan.hiddenText ? 'This file is a scan. Its hidden text is often wrong, so we’ll read the pages properly. ' : 'There’s no text inside this file, only pictures of the pages. '}We’ll read the text from the pictures, then split the book into lessons.</p>
          </div>
          {usage && (
            <p className={`text-sm ${overLimit ? 'text-amber-300' : 'text-lc-text3'}`}>
              {overLimit
                ? `This book has ${scan.count} pages, and you have ${Math.max(0, usage.cap - usage.used)} of this month’s ${usage.cap.toLocaleString('en-US')} scanned pages left. The limit resets on ${usage.resets}. You can upload part of the book (fewer photos) instead.`
                : `This month: ${usage.used.toLocaleString('en-US')} of ${usage.cap.toLocaleString('en-US')} scanned pages read.`}
            </p>
          )}
          {phase === 'scanning' && progress && (
            <div className="space-y-1.5">
              <div className="h-2 overflow-hidden rounded-full bg-lc-surface"><div className="h-full rounded-full bg-lc-blue transition-all" style={{ width: `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%` }} /></div>
              <p className="flex items-center gap-2 text-sm text-lc-text3"><Loader2 className="h-4 w-4 animate-spin" />Reading page {Math.min(progress.done + 1, progress.total)} of {progress.total}…</p>
            </div>
          )}
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}
          <div className="flex items-center justify-between">
            <button type="button" disabled={phase === 'scanning'} onClick={() => { setScan(null); setPhase('pick'); setError(null); }} className="text-sm text-lc-text3 hover:text-lc-text disabled:opacity-40">Choose another file</button>
            <button type="button" disabled={phase === 'scanning' || overLimit} onClick={() => void readScan()} className="inline-flex items-center gap-2 rounded-xl bg-lc-blue px-5 py-3 font-semibold text-white disabled:opacity-40">
              <ScanText className="h-4 w-4" />Read the pages
            </button>
          </div>
        </div>
      )}

      {(phase === 'ready' || phase === 'saving') && (
        <div className="space-y-5 rounded-2xl border border-lc-border bg-lc-card p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-lc-success">Book ready</p>
            <h1 className="text-2xl font-bold text-lc-text">{pictures ? `Picture book · ${pictures.pages.length} pages · ${lessons.length} lesson${lessons.length === 1 ? '' : 's'}` : `${lessons.length} lessons · ${chapters.length} chapters`}</h1>
            {pictures && <p className="mt-1 text-sm text-lc-text3">Each page is one reading turn, shown with its picture.</p>}
            {scanNote && <p className="mt-1 text-sm text-amber-300">{scanNote}</p>}
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
          {!pictures && (
            <div className="space-y-1.5 text-sm">
              <span className="text-lc-text3">Read the book as</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {([[false, 'Original text', 'The author’s words, exactly as written.'], [true, 'Simplified', `Retold in simpler English for your class level each lesson, marked “Simplified” on screen.`]] as const).map(([v, label, note]) => (
                  <button key={label} type="button" onClick={() => setSimplify(v)} className={`rounded-xl border px-3 py-2 text-left ${simplify === v ? 'border-lc-blue bg-lc-blue/10' : 'border-lc-border bg-lc-surface hover:border-lc-blue/50'}`}>
                    <span className="block font-semibold text-lc-text">{label}</span>
                    <span className="block text-xs text-lc-text3">{note}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="flex items-start gap-2 text-sm text-lc-text2">
            <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-1" />
            I have the right to use this book with my class. It stays private to my lessons.
          </label>
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}
          <div className="flex items-center justify-between">
            {phase === 'saving' && saveNote && <span className="text-sm text-lc-text3">{saveNote}</span>}
            <button type="button" onClick={() => { setPhase('pick'); setChapters([]); setPictures(null); setScanNote(null); }} className="text-sm text-lc-text3 hover:text-lc-text">Choose another file</button>
            <button type="button" disabled={!rights || !title.trim() || phase === 'saving'} onClick={() => void create()} className="inline-flex items-center gap-2 rounded-xl bg-lc-blue px-5 py-3 font-semibold text-white disabled:opacity-40">
              {phase === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}Create the reading course
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

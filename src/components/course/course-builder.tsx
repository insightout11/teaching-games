'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTeacherTier } from '@/hooks/use-teacher-tier';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import { buildCourseLessonPayload } from '@/lib/planner-utils';
import {
  buildCourseModulesFromPreset,
  buildFlightConfigForCourseSlots,
  getCourseFlightPreset,
  getCourseSourceKind,
} from '@/lib/course-flight-preset';
import { buildCourseLessonContext } from '@/lib/course-context';
import { COURSE_PRESETS as TOPIC_COURSE_PRESETS, READING_COURSE_PRESETS, READY_COURSE_PRESETS, type CoursePreset } from '@/lib/course-presets';
import { LESSON_TYPES, lessonTypeBlocker, lessonTypeOf, type LessonType } from '@/lib/course-lesson-types';
import { createClient } from '@/lib/supabase/client';
import { FLAP_FONT } from '@/components/ui/split-flap';
import type { CourseOutline, CourseOutlineLesson, CourseSourceRef } from '@/lib/course';
import type { SourceMaterial, SourceType } from '@/types/source-material';
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, BookUp, FileText, Film, Flag, Loader2, Search, Sparkles, Trash2, Wand2, X } from 'lucide-react';

// Course builder (Oct 2026 upgrade, docs/course-builder-review.md): pick the class (level, Junior), a theme or a
// ready course; each lesson gets a lesson type (a flight) chosen directly, its material (library or your own text),
// and the course arc (one task in lesson 1, repeated in the last lesson).

const COURSE_PRESETS: CoursePreset[] = [...READY_COURSE_PRESETS, ...TOPIC_COURSE_PRESETS, ...READING_COURSE_PRESETS];

type EditableLesson = CourseOutlineLesson & { _id: string };
type TeacherClass = { id: string; name: string; default_difficulty: string | null; junior?: boolean };
type LibraryHit = { kind: 'video' | 'reading'; sourceType: SourceType; id: string; title: string; listening?: boolean };

const label = 'text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300';
const panel = 'rounded-2xl border border-white/[0.07] bg-[#0a121e]/85';
const field = 'w-full rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-lc-text placeholder:text-white/35 focus:border-cyan-300/60 focus:outline-none';
const chip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${on ? 'border-cyan-300 bg-cyan-300 text-[#03202a]' : 'border-white/15 text-white/70 hover:border-white/35'}`;

function withArcRoles(list: EditableLesson[]): EditableLesson[] {
  return list.map((l, i) => ({ ...l, arcRole: list.length > 1 ? (i === 0 ? 'baseline' : i === list.length - 1 ? 'compare' : undefined) : undefined }));
}

/** Material for one lesson: the library item, the teacher's own text, or a search to pick one. */
function LessonMaterial({ lesson, level, junior, onChange }: { lesson: EditableLesson; level: Difficulty; junior: boolean; onChange: (patch: Partial<EditableLesson>) => void }) {
  const [mode, setMode] = useState<'idle' | 'search' | 'own'>('idle');
  const [q, setQ] = useState(lesson.topic);
  const [hits, setHits] = useState<LibraryHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [ownTitle, setOwnTitle] = useState(lesson.ownMaterial?.title ?? lesson.title);
  const [ownText, setOwnText] = useState(lesson.ownMaterial?.text ?? '');

  const search = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/library/search?q=${encodeURIComponent(q)}&level=${encodeURIComponent(level)}${junior ? '&kids=1' : ''}`);
      const data = (await res.json().catch(() => ({ results: [] }))) as { results: LibraryHit[] };
      setHits(data.results ?? []);
    } finally {
      setSearching(false);
    }
  };

  if (mode === 'search') {
    return (
      <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex gap-2">
          <input id={`q-${lesson._id}`} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void search(); }} className={field} placeholder="Search the library" aria-label="Search the library" />
          <button type="button" onClick={() => void search()} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 text-sm font-semibold text-[#03202a]">{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</button>
          <button type="button" onClick={() => setMode('idle')} aria-label="Close search" className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {hits && hits.length === 0 && <p className="text-xs text-white/50">Nothing found. Try another word, or use your own text.</p>}
        {hits && hits.length > 0 && (
          <ul className="space-y-1">
            {hits.map((h) => (
              <li key={`${h.sourceType}-${h.id}`}>
                <button type="button" onClick={() => { onChange({ suggestedSource: h, ownMaterial: null }); setMode('idle'); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-white/80 hover:bg-white/[0.06]">
                  {h.kind === 'video' ? <Film className="h-3.5 w-3.5 shrink-0 text-cyan-300" /> : <FileText className="h-3.5 w-3.5 shrink-0 text-cyan-300" />}
                  <span className="truncate">{h.title}</span>
                  {h.listening && <span className="ml-auto shrink-0 text-[10px] font-bold tracking-wider text-amber-300">LISTENING</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (mode === 'own') {
    return (
      <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
        <input id={`own-title-${lesson._id}`} value={ownTitle} onChange={(e) => setOwnTitle(e.target.value)} className={field} placeholder="Title" aria-label="Material title" />
        <textarea id={`own-text-${lesson._id}`} value={ownText} onChange={(e) => setOwnText(e.target.value)} rows={5} className={`${field} resize-y`} placeholder="Paste an article, a story or a chapter" aria-label="Material text" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setMode('idle')} className="text-sm text-white/50 hover:text-white">Cancel</button>
          <button type="button" disabled={ownText.trim().length < 80} onClick={() => { onChange({ ownMaterial: { title: ownTitle.trim() || lesson.title, text: ownText.trim().slice(0, 20000) }, suggestedSource: null }); setMode('idle'); }} className="rounded-lg bg-cyan-400 px-3 py-1.5 text-sm font-semibold text-[#03202a] disabled:opacity-40">Use this text</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {lesson.ownMaterial ? (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-amber-300/10 px-2 py-1 text-amber-200"><FileText className="h-3 w-3 shrink-0" /><span className="truncate">Your text: {lesson.ownMaterial.title}</span></span>
      ) : lesson.suggestedSource ? (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-cyan-300/10 px-2 py-1 text-cyan-200">
          {lesson.suggestedSource.kind === 'video' ? <Film className="h-3 w-3 shrink-0" /> : <FileText className="h-3 w-3 shrink-0" />}
          <span className="truncate">{lesson.suggestedSource.title}</span>
        </span>
      ) : (
        <span className="text-white/45">No material: built from the topic</span>
      )}
      <button type="button" onClick={() => setMode('search')} className="font-semibold text-cyan-300 hover:text-cyan-200">Find in library</button>
      <button type="button" onClick={() => setMode('own')} className="font-semibold text-cyan-300 hover:text-cyan-200">Use my own text</button>
      {(lesson.suggestedSource || lesson.ownMaterial) && (
        <button type="button" onClick={() => onChange({ suggestedSource: null, ownMaterial: null })} className="text-white/45 hover:text-white">Remove</button>
      )}
    </div>
  );
}

export function CourseBuilder({ initialPresetId }: { initialPresetId?: string }) {
  const router = useRouter();
  const { loading: tierLoading, isPro } = useTeacherTier();
  const appliedPresetRef = useRef<string | null>(null);

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [classId, setClassId] = useState<string>('');
  const [theme, setTheme] = useState('');
  const [level, setLevel] = useState<Difficulty>('Intermediate');
  const [lessonCount, setLessonCount] = useState(5);
  const [phase, setPhase] = useState<'theme' | 'outline'>('theme');

  const [courseTitle, setCourseTitle] = useState('');
  const [arcTask, setArcTask] = useState('');
  const [lessons, setLessons] = useState<EditableLesson[]>([]);

  const [proposing, setProposing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const junior = classes.find((c) => c.id === classId)?.junior === true;

  useEffect(() => {
    void (async () => {
      const { data } = await createClient().from('classes').select('id, name, default_difficulty, junior').eq('is_demo', false).order('name');
      setClasses((data ?? []) as TeacherClass[]);
    })();
  }, []);

  const pickClass = (id: string) => {
    setClassId(id);
    const c = classes.find((x) => x.id === id);
    if (c?.default_difficulty && DIFFICULTIES.includes(c.default_difficulty as Difficulty)) setLevel(c.default_difficulty as Difficulty);
  };

  async function handlePropose() {
    setProposing(true);
    setError(null);
    try {
      const res = await fetch('/api/course/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: theme.trim(), lessonCount, level, junior }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Could not build an outline.' }));
        throw new Error(err.error ?? 'Could not build an outline.');
      }
      const outline = (await res.json()) as CourseOutline;
      setCourseTitle(outline.title);
      setLevel(outline.difficulty);
      setArcTask(outline.arcTask ?? '');
      setLessons(withArcRoles(outline.lessons.map((l, i) => ({ ...l, _id: `${Date.now()}-${i}` }))));
      setPhase('outline');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build an outline.');
    } finally {
      setProposing(false);
    }
  }

  function updateLesson(id: string, patch: Partial<EditableLesson>) {
    setLessons((prev) => prev.map((l) => (l._id === id ? { ...l, ...patch } : l)));
  }
  function removeLesson(id: string) {
    setLessons((prev) => withArcRoles(prev.filter((l) => l._id !== id)));
  }
  function move(id: string, dir: -1 | 1) {
    setLessons((prev) => {
      const i = prev.findIndex((l) => l._id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return withArcRoles(next);
    });
  }
  function setType(l: EditableLesson, t: LessonType) {
    updateLesson(l._id, { flightPresetId: t.flightPresetId, goal: t.goal });
  }

  const applyPreset = useCallback((preset: CoursePreset) => {
    setTheme(preset.theme);
    setLevel(preset.level);
    setLessonCount(preset.lessons.length);
    setCourseTitle(preset.title);
    setArcTask(preset.arcTask ?? '');
    setLessons(withArcRoles(preset.lessons.map((lesson, i) => ({ ...lesson, _id: `${preset.id}-${i}` }))));
    setError(null);
    setPhase('outline');
  }, []);

  useEffect(() => {
    const presetId = initialPresetId;
    if (!presetId || appliedPresetRef.current === presetId) return;
    const preset = COURSE_PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) return;
    appliedPresetRef.current = presetId;
    applyPreset(preset);
  }, [applyPreset, initialPresetId]);

  async function handleSave() {
    if (!courseTitle.trim() || lessons.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const task = arcTask.trim() || undefined;
      const payloadLessons = lessons.map((l, i) => {
        const type = lessonTypeOf(l);
        const preset = getCourseFlightPreset(type.goal, type.flightPresetId);
        const sourceKind = l.ownMaterial ? 'text' : getCourseSourceKind(l.suggestedSource);
        const modules = buildCourseModulesFromPreset(preset, sourceKind);
        const courseContext = buildCourseLessonContext({ courseTitle: courseTitle.trim(), courseTheme: theme.trim(), lessons, index: i, arcTask: task });
        const lessonPayload = buildCourseLessonPayload(
          { topic: l.topic, difficulty: level, goal: type.goal, durationMinutes: 60, courseContext },
          modules,
        );
        const flightConfig = buildFlightConfigForCourseSlots(preset.flightConfig, lessonPayload.slots);
        if (flightConfig) {
          lessonPayload.flightPresetId = preset.id;
          lessonPayload.flightConfig = flightConfig;
        }
        if (l.ownMaterial) {
          // The full text lives once, in the lesson payload; the source ref keeps only the label.
          const material: SourceMaterial = {
            sourceType: 'text',
            title: l.ownMaterial.title,
            summary: l.ownMaterial.text.slice(0, 500),
            rawText: l.ownMaterial.text,
            originalText: l.ownMaterial.text,
            wordCount: l.ownMaterial.text.split(/\s+/).length,
          };
          const labelOnly: SourceMaterial = { sourceType: 'text', title: material.title, summary: material.summary.slice(0, 200), wordCount: material.wordCount };
          return { title: l.title, orderIndex: i, sourceRef: { kind: 'custom' as const, material: labelOnly }, lessonPayload: { ...lessonPayload, sourceMaterial: material } };
        }
        const sourceRef: CourseSourceRef = l.suggestedSource
          ? { kind: 'library', sourceType: l.suggestedSource.sourceType, id: l.suggestedSource.id, title: l.suggestedSource.title }
          : null;
        return { title: l.title, orderIndex: i, sourceRef, lessonPayload };
      });

      const res = await fetch('/api/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: courseTitle.trim(), theme: theme.trim(), description: task ? `Course task: ${task}` : undefined, classId: classId || null, lessons: payloadLessons }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Could not save the course.' }));
        throw new Error(err.error ?? 'Could not save the course.');
      }
      const course = (await res.json()) as { id: string };
      router.push(`/courses/${course.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the course.');
      setSaving(false);
    }
  }

  if (!tierLoading && !isPro) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-16 text-center">
        <h1 className="font-display text-4xl text-white">Courses are part of <em className="text-amber-300">Pro</em></h1>
        <a href="/pro" className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-[#03202a] hover:bg-cyan-300">
          <Sparkles className="h-4 w-4" />See Pro
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <button onClick={() => router.push('/courses')} className="flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Courses
      </button>
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/90" style={{ fontFamily: FLAP_FONT }}>Course builder</p>
        <h1 className="mt-2 font-display text-4xl text-white">{phase === 'theme' ? <>Build a <em className="text-amber-300">course</em></> : <>Your <em className="text-amber-300">route</em></>}</h1>
      </header>

      {phase === 'theme' ? (
        <>
          <a href="/courses/book" className="flex items-center gap-3 rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-300/[0.12] to-[#0a121e]/85 px-5 py-4 hover:border-cyan-300/60">
            <BookUp className="h-5 w-5 shrink-0 text-cyan-300" />
            <span className="flex-1"><span className="block font-semibold text-white">Use your own book</span><span className="block text-sm text-white/60">Upload a PDF, a Word file, a scan or photos of the pages and get a reading course, one part per lesson.</span></span>
          </a>

          <div className={`${panel} space-y-5 p-6`}>
            <div className="space-y-2">
              <span className={label} style={{ fontFamily: FLAP_FONT }}>For which class?</span>
              <select id="course-class" value={classId} onChange={(e) => pickClass(e.target.value)} className={field} aria-label="Class">
                <option value="">Any class (choose when you board)</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.junior ? ' (Junior)' : ''}</option>)}
              </select>
              <p className="text-xs text-white/45">The class&apos;s level and Junior setting shape the outline.</p>
            </div>

            <div className="space-y-2">
              <span className={label} style={{ fontFamily: FLAP_FONT }}>Theme</span>
              <textarea
                id="course-theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                rows={3}
                placeholder="e.g. Food around the world: street food, restaurants, healthy eating, the future of food"
                className={`${field} resize-none`}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="space-y-2">
                <span className={label} style={{ fontFamily: FLAP_FONT }}>Level</span>
                <div className="flex flex-wrap gap-1.5">
                  {DIFFICULTIES.map((d) => <button key={d} type="button" onClick={() => setLevel(d as Difficulty)} className={chip(level === d)}>{d}</button>)}
                </div>
              </div>
              <div className="space-y-2">
                <span className={label} style={{ fontFamily: FLAP_FONT }}>Lessons</span>
                <div className="flex gap-1.5">
                  {[3, 4, 5, 6, 8].map((n) => <button key={n} type="button" onClick={() => setLessonCount(n)} className={chip(lessonCount === n)}>{n}</button>)}
                </div>
              </div>
            </div>

            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

            <button
              onClick={handlePropose}
              disabled={theme.trim().length < 3 || proposing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 font-semibold text-[#03202a] hover:bg-cyan-300 disabled:opacity-50"
            >
              {proposing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {proposing ? 'Planning the route…' : 'Propose a course'}
            </button>
          </div>

          <div className="space-y-2">
            <span className={label} style={{ fontFamily: FLAP_FONT }}>Or start from a ready course</span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {COURSE_PRESETS.map((preset) => (
                <button key={preset.id} type="button" onClick={() => applyPreset(preset)} className={`${panel} p-3 text-left transition-colors hover:border-cyan-300/30`}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-white"><BookOpen className="h-4 w-4 shrink-0 text-cyan-300" />{preset.title}</span>
                  <span className="mt-1 line-clamp-2 block text-xs text-white/55">{preset.blurb}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-5">
          <div className={`${panel} space-y-2 p-5`}>
            <label htmlFor="course-title" className={label} style={{ fontFamily: FLAP_FONT }}>Course title</label>
            <input id="course-title" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} className={`${field} text-lg font-semibold`} />
          </div>

          {lessons.length > 1 && (
            <div className={`${panel} space-y-2 border-amber-300/25 p-5`}>
              <label htmlFor="arc-task" className={`${label} flex items-center gap-2`} style={{ fontFamily: FLAP_FONT }}><Flag className="h-3.5 w-3.5" />Course task</label>
              <input id="arc-task" value={arcTask} onChange={(e) => setArcTask(e.target.value)} className={field} placeholder="e.g. Say three things about the food you like" />
              <p className="text-xs text-white/50">The class does this short task in lesson 1 and again in the last lesson, so everyone hears how far they came. Leave it empty to skip.</p>
            </div>
          )}

          <ol className="space-y-3">
            {lessons.map((l, i) => {
              const current = lessonTypeOf(l);
              return (
                <li key={l._id} className={`${panel} p-4`}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-cyan-300 text-xs font-bold text-cyan-300" style={{ fontFamily: FLAP_FONT }}>{i + 1}</span>
                      <button type="button" onClick={() => move(l._id, -1)} disabled={i === 0} aria-label="Move up" className="text-white/40 hover:text-white disabled:opacity-20"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => move(l._id, 1)} disabled={i === lessons.length - 1} aria-label="Move down" className="text-white/40 hover:text-white disabled:opacity-20"><ArrowDown className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <input value={l.title} onChange={(e) => updateLesson(l._id, { title: e.target.value })} aria-label={`Lesson ${i + 1} title`} className={`${field} font-semibold`} />
                        {l.arcRole && arcTask.trim() && (
                          <span className="shrink-0 rounded bg-amber-300/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300" style={{ fontFamily: FLAP_FONT }}>{l.arcRole === 'baseline' ? 'COURSE TASK' : 'TASK AGAIN'}</span>
                        )}
                      </div>
                      <input value={l.topic} onChange={(e) => updateLesson(l._id, { topic: e.target.value })} placeholder="The lesson's topic" aria-label={`Lesson ${i + 1} topic`} className={`${field} text-xs`} />
                      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Lesson type">
                        {LESSON_TYPES.filter((t) => !(junior && t.juniorHidden)).map((t) => {
                          const blocker = lessonTypeBlocker(t, l.suggestedSource, !!l.ownMaterial);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              role="radio"
                              aria-checked={current.id === t.id}
                              disabled={!!blocker}
                              title={blocker ?? undefined}
                              onClick={() => setType(l, t)}
                              className={`${chip(current.id === t.id)} disabled:cursor-not-allowed disabled:opacity-35`}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                      <LessonMaterial lesson={l} level={level} junior={junior} onChange={(patch) => updateLesson(l._id, patch)} />
                    </div>
                    <button type="button" onClick={() => removeLesson(l._id)} aria-label="Remove lesson" className="pt-1 text-white/40 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              );
            })}
          </ol>

          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setPhase('theme')} className="text-sm text-white/50 hover:text-white">← Back</button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || lessons.length === 0 || !courseTitle.trim()}
              className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 font-semibold text-[#03202a] hover:bg-cyan-300 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save course
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

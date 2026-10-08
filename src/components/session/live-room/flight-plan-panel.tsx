'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Headphones, Layers, MapPin, Plane, X } from 'lucide-react';
import { listeningClipsFor } from '@/lib/listening-pack';
import { getLibrarySourceMaterial, listBookLessons, listLibraryEntriesWithListeningPack } from '@/lib/library-source-material';
import type { SourceType } from '@/types/source-material';
import type { Course, CourseLesson } from '@/lib/course';
import { withCarryOver } from '@/lib/launch-course-lesson';
import { useSessionStore } from '@/stores/session-store';
import { GRAMMAR_TARGET_GROUPS, type GrammarTarget } from '@/lib/grammar';
import type { LessonPlanPayload } from '@/lib/lesson-plan-payload';
import { buildRoomFlightPlan, estimatePlanMinutes, roomFlightPresets } from '@/lib/live-room/room-flight-plan';
import { buildTripPack, findTripDestination } from '@/lib/world-flight/trip-pack';

/**
 * Launch a flight from inside the Live Room: preset cards, prefilled from the room (the topic,
 * the source on screen, the level, the grammar focus). Only what a preset genuinely needs is
 * asked (the grammar point for Grammar). Flies in this session; the room keeps the journey.
 */
export function FlightPlanPanel({ sessionId, destinationCity, destinationId, minutesLeft, onLaunch, onClose }: { sessionId: string; destinationCity: string; /** The room's destination (a World Flight city id) — Travel builds its trip there. */ destinationId?: string | null; /** Set while flying: the plan is sized to the time left. */ minutesLeft?: number | null; onLaunch: (plan: LessonPlanPayload) => void; onClose: () => void }) {
  const settings = useSessionStore((s) => s.settings);
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  // Travel flies to the room's destination with that city's trip pack (real stops, no AI).
  const tripDestination = useMemo(() => findTripDestination(destinationId, destinationCity), [destinationId, destinationCity]);
  const junior = useSessionStore((s) => s.junior);
  // Junior classes skip the debate and grammar flights (too much arguing and rule talk for 5-9s).
  const presets = useMemo(
    () => roomFlightPresets({ travel: !!tripDestination }).filter((p) => !junior || !/debate|grammar/.test(p.id)),
    [tripDestination, junior],
  );
  const [presetId, setPresetId] = useState(presets[0]?.id ?? '');
  const [topic, setTopic] = useState(settings.customTopic || sourceMaterial?.title || '');
  const [grammar, setGrammar] = useState<string>(settings.grammarTarget ?? '');
  const preset = presets.find((p) => p.id === presetId);

  // Continue a course: the teacher's own courses and the next lesson of each (one tap).
  const [courseNext, setCourseNext] = useState<Array<{ course: Course; lesson: CourseLesson }>>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetch('/api/course', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { courses: [] })) as { courses: Course[] };
        const own = (list.courses ?? []).filter((c) => !c.isTemplate).slice(0, 4);
        const details = await Promise.all(own.map((c) => fetch(`/api/course/${c.id}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null))) as Array<Course | null>;
        const rows = details.flatMap((c) => {
          const next = c?.lessons.find((l) => l.status === 'planned');
          return c && next ? [{ course: c, lesson: next }] : [];
        });
        if (!cancelled) setCourseNext(rows);
      } catch { /* courses are optional */ }
    })();
    return () => { cancelled = true; };
  }, []);
  const flyCourseLesson = (course: Course, lesson: CourseLesson) => {
    void fetch(`/api/course/lesson/${lesson.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'launched', sessionId }) }).catch(() => {});
    onLaunch(withCarryOver(lesson, course.lessons) as unknown as LessonPlanPayload);
  };
  const needsGrammar = presetId === 'grammar-60';
  const isTravel = presetId === 'travel-60';
  const isListening = presetId === 'listening-60';
  const isReading = presetId === 'reading-60';
  // Reading flies on a book lesson (library book courses, in course order).
  const bookLessons = useMemo(() => (isReading ? listBookLessons() : []), [isReading]);
  const [bookId, setBookId] = useState('');
  const bookLesson = bookLessons.find((b) => b.id === bookId) ?? null;
  const bookSource = useMemo(() => (bookLesson ? getLibrarySourceMaterial({ kind: 'library', sourceType: 'books' as SourceType, id: bookLesson.id, title: bookLesson.title }) : null), [bookLesson]);
  // Listening flies on a library clip with a listening pack, picked here (nearest the class level first).
  const clips = useMemo(() => (isListening ? listeningClipsFor(listLibraryEntriesWithListeningPack(), settings.difficulty) : []), [isListening, settings.difficulty]);
  const [clipId, setClipId] = useState('');
  const clip = clips.find((c) => c.id === clipId) ?? null;
  const clipSource = useMemo(() => (clip ? getLibrarySourceMaterial({ kind: 'library', sourceType: clip.sourceType as SourceType, id: clip.id, title: clip.title }) : null), [clip]);
  const ready = !!preset && (isTravel ? !!tripDestination : isListening ? !!clipSource : isReading ? !!bookSource : (topic.trim().length > 0 || !!sourceMaterial)) && (!needsGrammar || !!grammar);

  const build = () => (preset ? buildRoomFlightPlan({ preset, topic: isListening && clip ? clip.title : isReading && bookLesson ? `${bookLesson.book}: ${bookLesson.title}` : topic, difficulty: settings.difficulty, sourceMaterial: isListening ? clipSource : isReading ? bookSource : sourceMaterial, grammarTarget: (grammar || null) as GrammarTarget | null, minutesLeft: minutesLeft ?? null, tripPack: isTravel && tripDestination ? buildTripPack(tripDestination) : null }) : null);
  // Mid-air: show how the plan fits the time left (stages are trimmed to fit).
  const preview = useMemo(() => (preset && minutesLeft != null ? build() : null), [presetId, minutesLeft, sourceMaterial]); // eslint-disable-line react-hooks/exhaustive-deps
  const launch = () => {
    const plan = build();
    if (!plan || !ready) return;
    onLaunch(plan);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl space-y-5 rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-300">Flight plan · to {destinationCity}</p>
            <p className="mt-1 font-display text-3xl">What kind of flight today?</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/60 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        {courseNext.length > 0 && (
          <div className="space-y-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Continue a course</p>
            {courseNext.map(({ course, lesson }) => (
              <button key={lesson.id} type="button" onClick={() => flyCourseLesson(course, lesson)} className="flex w-full items-center gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-400/[0.06] px-4 py-3 text-left hover:border-emerald-300/60">
                <Layers className="h-5 w-5 shrink-0 text-emerald-300" />
                <span className="min-w-0 flex-1"><span className="block truncate text-white">{course.title}</span><span className="block truncate text-sm text-white/60">Lesson {lesson.orderIndex + 1}: {lesson.title}</span></span>
                <span className="shrink-0 rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-slate-950">Fly this lesson</span>
              </button>
            ))}
            <p className="pt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Or pick a flight</p>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {presets.map((p) => (
            <button key={p.id} type="button" onClick={() => setPresetId(p.id)} className={`rounded-2xl border p-4 text-left transition ${p.id === presetId ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}>
              <p className="font-display text-xl">{p.name}</p>
              <p className="text-sm text-white/60">{p.tagline ?? p.description}</p>
            </button>
          ))}
        </div>

        {isReading ? (
          <div className="space-y-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Choose a book lesson</p>
            <div className="grid max-h-56 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
              {bookLessons.map((b) => (
                <button key={b.id} type="button" onClick={() => setBookId(b.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${b.id === bookId ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}>
                  <BookOpen className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span className="min-w-0 flex-1 truncate text-white">{b.book} · {b.order}. {b.title}</span>
                  <span className="shrink-0 text-xs text-white/50">{b.ageBand}</span>
                </button>
              ))}
            </div>
          </div>
        ) : isListening ? (
          <div className="space-y-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Choose a listening clip ({settings.difficulty})</p>
            <div className="grid max-h-56 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
              {clips.map((c) => (
                <button key={`${c.sourceType}-${c.id}`} type="button" onClick={() => setClipId(c.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${c.id === clipId ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}>
                  <Headphones className="h-4 w-4 shrink-0 text-cyan-300" />
                  <span className="min-w-0 flex-1 truncate text-white">{c.title}</span>
                  <span className="shrink-0 text-xs text-white/50">{c.cefr} · {c.minutes} min</span>
                </button>
              ))}
            </div>
          </div>
        ) : isTravel && tripDestination ? (
          <p className="flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/[0.06] px-3 py-2 text-sm text-cyan-100">
            <MapPin className="h-4 w-4 shrink-0" /><span>A trip to <span className="text-white">{tripDestination.city}</span>: immigration, the station announcement, the stops the class votes for, and a postcard home.</span>
          </p>
        ) : (
        <div className="space-y-3">
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Topic</span>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What's today's flight about?" className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-2.5 text-lg text-white outline-none focus:border-amber-300/60" />
          </label>
          {sourceMaterial && (
            <p className="flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/[0.06] px-3 py-2 text-sm text-cyan-100"><FileText className="h-4 w-4 shrink-0" />Built from the source in focus: <span className="truncate text-white">{sourceMaterial.title}</span></p>
          )}
          {needsGrammar && (
            <label className="block">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Grammar point</span>
              <select value={grammar} onChange={(e) => setGrammar(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-2.5 text-lg text-white outline-none">
                <option value="">Choose…</option>
                {Object.entries(GRAMMAR_TARGET_GROUPS).map(([group, targets]) => (
                  <optgroup key={group} label={group}>{targets.map((t) => <option key={t} value={t}>{t}</option>)}</optgroup>
                ))}
              </select>
            </label>
          )}
        </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/50">
            {preview ? `Fits the ${Math.round(minutesLeft ?? 0)} minutes left: ${preview.slots.length} stages (~${estimatePlanMinutes(preview.slots)} min). ` : ''}
            Level: {settings.difficulty}. Students stay on board.
          </p>
          <button type="button" disabled={!ready} onClick={launch} className="flex items-center gap-2 rounded-full bg-amber-300 px-6 py-3 font-semibold text-slate-950 disabled:opacity-40">
            <Plane className="h-4 w-4" />Start the flight plan
          </button>
        </div>
      </motion.div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Layers, Plane, X } from 'lucide-react';
import type { Course, CourseLesson } from '@/lib/course';
import { withCarryOver } from '@/lib/launch-course-lesson';
import { useSessionStore } from '@/stores/session-store';
import { GRAMMAR_TARGET_GROUPS, type GrammarTarget } from '@/lib/grammar';
import type { LessonPlanPayload } from '@/lib/lesson-plan-payload';
import { buildRoomFlightPlan, estimatePlanMinutes, roomFlightPresets } from '@/lib/live-room/room-flight-plan';

/**
 * Launch a flight from inside the Live Room: preset cards, prefilled from the room (the topic,
 * the source on screen, the level, the grammar focus). Only what a preset genuinely needs is
 * asked (the grammar point for Grammar). Flies in this session; the room keeps the journey.
 */
export function FlightPlanPanel({ sessionId, destinationCity, minutesLeft, onLaunch, onClose }: { sessionId: string; destinationCity: string; /** Set while flying: the plan is sized to the time left. */ minutesLeft?: number | null; onLaunch: (plan: LessonPlanPayload) => void; onClose: () => void }) {
  const settings = useSessionStore((s) => s.settings);
  const sourceMaterial = useSessionStore((s) => s.sourceMaterial);
  const presets = useMemo(() => roomFlightPresets(), []);
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
  const ready = !!preset && (topic.trim().length > 0 || !!sourceMaterial) && (!needsGrammar || !!grammar);

  const build = () => (preset ? buildRoomFlightPlan({ preset, topic, difficulty: settings.difficulty, sourceMaterial, grammarTarget: (grammar || null) as GrammarTarget | null, minutesLeft: minutesLeft ?? null }) : null);
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

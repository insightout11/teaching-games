'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Loader2, Sparkles, X } from 'lucide-react';
import type { BoardRow } from '@/lib/home-board';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';
import { LESSON_TYPES, lessonTypeBlocker } from '@/lib/course-lesson-types';
import {
  buildPreparedLesson,
  PREPARED_TYPE_LABEL,
  PREPARED_TYPE_PREVIEW,
  savePreparedLesson,
  type PreparedLesson,
  type PreparedType,
} from '@/lib/prepared-lesson';
import { LessonMaterial, type MaterialLesson } from '@/components/course/lesson-material';
import { FLAP_FONT } from '@/components/ui/split-flap';
import type { SourceMaterial } from '@/types/source-material';

// "Prepare the next lesson" (Oct 2026, replaces the old planner): suggestions from the class's own history first,
// then three questions (what kind, about what, material), a plain-words preview, and Save as the class's next flight.

const DESCRIPTIONS: Record<PreparedType, string> = {
  speak: 'one real conversation',
  reading: 'a story or text',
  listening: 'a short clip',
  debate: 'argue a question',
  grammar: 'one grammar point',
  mix: 'games and talk',
  free: 'decide in the room',
};
const ORDER: PreparedType[] = ['speak', 'reading', 'listening', 'mix', 'free', 'debate', 'grammar'];

export function PrepareSheet({ row, onClose, onSaved }: { row: BoardRow; onClose: () => void; onSaved: (lesson: PreparedLesson | null) => void }) {
  const level: Difficulty = row.level && DIFFICULTIES.includes(row.level as Difficulty) ? (row.level as Difficulty) : 'Intermediate';
  const p = row.prepared;
  const [type, setType] = useState<PreparedType>(p?.type ?? (row.junior ? 'mix' : 'speak'));
  const [topic, setTopic] = useState(p?.topic ?? '');
  const [focusText, setFocusText] = useState<string | undefined>(p?.focus?.text);
  const [material, setMaterial] = useState<MaterialLesson>({ _id: 'prep', title: p?.materialTitle ?? '', topic: p?.topic ?? '', suggestedSource: null, ownMaterial: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const choose = (t: PreparedType, tp: string, text?: string) => {
    setType(t);
    setTopic(tp);
    setFocusText(text);
    setMaterial((m) => ({ ...m, topic: tp, title: tp }));
  };

  const suggestions: Array<{ key: string; label: React.ReactNode; tag: string; run: () => void }> = [];
  if (row.lastTopic) suggestions.push({ key: 'pickup', tag: 'LAST TIME', label: <><b>Pick up {row.lastTopic}</b> {row.junior ? 'with pictures and games' : 'with a Speak lesson'}</>, run: () => choose(row.junior ? 'mix' : 'speak', row.lastTopic!) });
  if (row.lastWords.length >= 3) suggestions.push({ key: 'review', tag: 'REVIEW', label: <><b>Review last lesson&apos;s {row.lastWords.length} words</b> in the room</>, run: () => choose('free', "Last lesson's words", `Review these words from last lesson: ${row.lastWords.join(', ')}.`) });
  if (row.freshTopics[0]) suggestions.push({ key: 'new', tag: 'SOMETHING NEW', label: <><b>{row.freshTopics[0]}</b>, a topic this class hasn&apos;t done</>, run: () => choose(row.junior ? 'mix' : 'speak', row.freshTopics[0]) });

  const save = async () => {
    if (!topic.trim()) { setError('Add a topic first.'); return; }
    setSaving(true);
    setError(null);
    try {
      let sourceMaterial: SourceMaterial | null = null;
      if (type !== 'free' && material.suggestedSource && !material.ownMaterial) {
        const res = await fetch(`/api/library/material?sourceType=${encodeURIComponent(material.suggestedSource.sourceType)}&id=${encodeURIComponent(material.suggestedSource.id)}`);
        if (res.ok) sourceMaterial = ((await res.json()) as { material: SourceMaterial }).material;
      }
      const lesson = buildPreparedLesson({
        type,
        topic,
        level,
        source: type === 'free' ? null : material.suggestedSource,
        sourceMaterial,
        ownText: type === 'free' ? null : material.ownMaterial ?? null,
        focusText,
      });
      await savePreparedLesson(row.classId, lesson);
      onSaved(lesson);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the lesson.');
      setSaving(false);
    }
  };

  const clear = async () => {
    setSaving(true);
    try {
      await savePreparedLesson(row.classId, null);
      onSaved(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not clear the lesson.');
      setSaving(false);
    }
  };

  const typeDef = LESSON_TYPES.find((t) => t.id === type);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Prepare the next lesson for ${row.name}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/55" />
      <div className="relative flex h-full w-full max-w-[560px] flex-col gap-5 overflow-y-auto border-l border-white/10 bg-[#0a121e] px-6 py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>
              {row.name} · {level}{row.junior ? ' · Junior' : ''}
            </p>
            <h2 className="mt-1 font-display text-3xl text-white">Prepare the <em className="text-amber-300">next lesson</em></h2>
            <p className="mt-1 text-sm text-white/50">Takes a minute. You can still change anything in the room.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        {(suggestions.length > 0 || row.next) && (
          <section className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300" style={{ fontFamily: FLAP_FONT }}>Suggested for this class</h3>
            {row.next && (
              <button type="button" onClick={() => void clear()} className="flex w-full items-center gap-3 rounded-xl border border-cyan-300/25 bg-cyan-300/[0.07] px-3 py-2.5 text-left text-sm text-white/85 hover:border-cyan-300/50">
                <BookOpen className="h-4 w-4 shrink-0 text-cyan-300" />
                <span className="min-w-0 flex-1"><b className="text-white">{row.next.courseTitle}</b> · {row.next.title}</span>
                <span className="shrink-0 text-[10px] font-bold tracking-[0.14em] text-cyan-300" style={{ fontFamily: FLAP_FONT }}>COURSE</span>
              </button>
            )}
            {suggestions.map((s) => (
              <button key={s.key} type="button" onClick={s.run} className="flex w-full items-center gap-3 rounded-xl border border-cyan-300/25 bg-cyan-300/[0.07] px-3 py-2.5 text-left text-sm text-white/85 hover:border-cyan-300/50">
                <Sparkles className="h-4 w-4 shrink-0 text-cyan-300" />
                <span className="min-w-0 flex-1">{s.label}</span>
                <span className="shrink-0 text-[10px] font-bold tracking-[0.14em] text-cyan-300" style={{ fontFamily: FLAP_FONT }}>{s.tag}</span>
              </button>
            ))}
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>1 · What kind of lesson?</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Kind of lesson">
            {ORDER.map((t) => {
              const def = LESSON_TYPES.find((x) => x.id === t);
              const blocked = def ? (row.junior && def.juniorHidden ? 'Not for Junior classes' : lessonTypeBlocker(def, material.suggestedSource, !!material.ownMaterial)) : null;
              const on = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!!blocked}
                  title={blocked ?? undefined}
                  onClick={() => setType(t)}
                  className={`flex flex-col rounded-xl border px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${on ? 'border-cyan-300 bg-cyan-300/[0.12]' : 'border-white/12 hover:border-white/30'}`}
                >
                  <span className="text-sm font-semibold text-white">{PREPARED_TYPE_LABEL[t]}</span>
                  <span className="text-[11.5px] leading-snug text-white/55">{blocked ?? DESCRIPTIONS[t]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <label htmlFor="prep-topic" className="block text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>2 · About what?</label>
          <input
            id="prep-topic"
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setFocusText(undefined); setMaterial((m) => ({ ...m, topic: e.target.value })); }}
            placeholder={row.junior ? 'e.g. Animals in the rainforest' : 'e.g. Ordering food at a café'}
            className="w-full rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2.5 text-sm text-lc-text placeholder:text-white/35 focus:border-cyan-300/60 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {[row.lastTopic, ...row.freshTopics].filter((t): t is string => !!t).slice(0, 5).map((t) => (
              <button key={t} type="button" onClick={() => choose(type, t)} className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/70 hover:border-white/35 hover:text-white">{t}</button>
            ))}
          </div>
        </section>

        {type !== 'free' && (
          <section className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>3 · Material <span className="normal-case tracking-normal text-white/40">(optional)</span></h3>
            <LessonMaterial lesson={material} level={level} junior={row.junior} onChange={(patch) => setMaterial((m) => ({ ...m, ...patch }))} />
            {typeDef?.needs && lessonTypeBlocker(typeDef, material.suggestedSource, !!material.ownMaterial) && (
              <p className="text-xs text-amber-200">{typeDef.label} needs {typeDef.needs === 'text' ? 'a book or text' : 'a listening clip'}: find one in the library, or pick another kind of lesson.</p>
            )}
          </section>
        )}

        <section className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45" style={{ fontFamily: FLAP_FONT }}>What students will do</h3>
          <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-[13px] text-white/75">
            {PREPARED_TYPE_PREVIEW[type].map((line) => <li key={line}>{line}</li>)}
          </ol>
        </section>

        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {p ? (
            <button type="button" onClick={() => void clear()} disabled={saving} className="text-sm text-white/50 hover:text-white">Remove prepared lesson</button>
          ) : (
            <button type="button" onClick={onClose} className="text-sm text-white/50 hover:text-white">Cancel</button>
          )}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !topic.trim() || (!!typeDef?.needs && !!lessonTypeBlocker(typeDef, material.suggestedSource, !!material.ownMaterial))}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 font-semibold text-[#03202a] hover:bg-cyan-300 disabled:opacity-40"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}Save as next flight
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Lock, NotebookPen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProgressReportModal } from '@/components/class/progress-report-modal';
import type { Student } from '@/lib/supabase/types';

/**
 * The class page's Students section (replaces the Control Room pages, Oct 2026): pick a student to see how they have
 * been doing, every note written about them in any lesson, and a progress report drafted from all of it. The list
 * and the numbers are free; notes and reports are Pro. Never shown on the lesson screen, only on the class page.
 */
export interface StudentSummary {
  id: string;
  lessons: number;
  answered: number;
  accuracy: number | null;
  recent: Array<{ sessionId: string; at: string; title: string; answered: number; accuracy: number | null }>;
  notes: Array<{ sessionId: string; at: string; title: string; note: string }>;
  /** The latest lesson this student was in: where a new note is filed. */
  lastSessionId: string | null;
}

const day = (at: string) => new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export function StudentsSection({ classId, teacherId, students, summaries, totalLessons, isPro }: {
  classId: string;
  teacherId: string;
  students: Student[];
  summaries: Record<string, StudentSummary>;
  totalLessons: number;
  isPro: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(students[0]?.id ?? null);
  const [extraNotes, setExtraNotes] = useState<Record<string, StudentSummary['notes']>>({});
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [reportFor, setReportFor] = useState<Student | null>(null);

  const selected = students.find((s) => s.id === selectedId) ?? null;
  const summary = selected ? summaries[selected.id] : undefined;
  const notes = useMemo(() => (selected ? [...(extraNotes[selected.id] ?? []), ...(summary?.notes ?? [])] : []), [selected, extraNotes, summary]);

  // A note is filed under the student's latest lesson (one note per student per lesson: a new line is added to it).
  const saveNote = async () => {
    const text = draft.trim();
    if (!selected || !text) { setSaveError('Write the note first.'); return; }
    if (!summary?.lastSessionId) { setSaveError(`Notes are filed under a lesson. ${selected.name} has not been in one yet.`); return; }
    setSaving(true);
    setSaveError('');
    const supabase = createClient();
    const { data: existing } = await supabase.from('student_session_notes').select('note').eq('session_id', summary.lastSessionId).eq('student_id', selected.id).maybeSingle();
    const before = (existing as { note?: string } | null)?.note?.trim();
    const { error } = await supabase.from('student_session_notes').upsert({
      session_id: summary.lastSessionId,
      student_id: selected.id,
      class_id: classId,
      teacher_id: teacherId,
      note: before ? `${before}\n${text}` : text,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id,student_id' });
    setSaving(false);
    if (error) { setSaveError('Could not save the note. Try again.'); return; }
    const lesson = summary.recent.find((r) => r.sessionId === summary.lastSessionId);
    setExtraNotes((m) => ({ ...m, [selected.id]: [{ sessionId: summary.lastSessionId!, at: new Date().toISOString(), title: lesson?.title ?? 'Latest lesson', note: text }, ...(m[selected.id] ?? [])] }));
    setDraft('');
  };

  if (students.length === 0) {
    return (
      <section id="students" className="scroll-mt-24 rounded-2xl border border-white/[0.07] bg-[#0a121e]/85 p-5">
        <h2 className="text-lg font-semibold text-white">Students</h2>
        <p className="mt-1 text-sm text-white/60">Add your students to the class list, and each one gets a card here: how they are doing, your notes, and progress reports.</p>
      </section>
    );
  }

  return (
    <section id="students" className="scroll-mt-24 rounded-2xl border border-white/[0.07] bg-[#0a121e]/85 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">Students</h2>
        <span className="text-sm text-white/50">{students.length} student{students.length === 1 ? '' : 's'} · {totalLessons} lesson{totalLessons === 1 ? '' : 's'}</span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <ul className="flex max-h-[28rem] flex-col gap-1.5 overflow-y-auto pr-1">
          {students.map((s) => {
            const sm = summaries[s.id];
            const n = (sm?.notes.length ?? 0) + (extraNotes[s.id]?.length ?? 0);
            const on = s.id === selectedId;
            return (
              <li key={s.id}>
                <button type="button" onClick={() => { setSelectedId(s.id); setSaveError(''); setDraft(''); }} className={`w-full rounded-xl border px-3 py-2 text-left transition ${on ? 'border-amber-300/60 bg-amber-300/10' : 'border-white/[0.08] hover:border-white/25'}`}>
                  <span className="block text-sm font-semibold text-white">{s.name}</span>
                  <span className="block text-xs text-white/55">{sm?.lessons ?? 0} of {totalLessons} lessons{isPro ? ` · ${n ? `${n} note${n === 1 ? '' : 's'}` : 'no notes'}` : ''}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {selected && (
          <div className="min-w-0 rounded-xl border border-white/[0.08] bg-[#0d1726] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300/15 font-semibold text-amber-200">{selected.name.charAt(0).toUpperCase()}</span>
              <p className="min-w-0 flex-1 truncate text-lg font-semibold text-white">{selected.name}</p>
              {isPro ? (
                <button type="button" onClick={() => setReportFor(selected)} className="flex items-center gap-1.5 rounded-lg border border-amber-300/50 bg-amber-300/10 px-3 py-1.5 text-sm font-semibold text-amber-100 hover:bg-amber-300/20">
                  <FileText className="h-4 w-4" /> Progress report
                </button>
              ) : (
                <Link href="/pro" className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/70 hover:text-white">
                  <Lock className="h-4 w-4" /> Progress report · Pro
                </Link>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2">
              {[
                ['Lessons', `${summary?.lessons ?? 0} of ${totalLessons}`],
                ['Answers right', summary?.accuracy == null ? '-' : `${summary.accuracy}%`],
                ['Answers given', String(summary?.answered ?? 0)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-white/[0.04] px-3 py-2">
                  <dt className="text-xs text-white/50">{k}</dt>
                  <dd className="text-lg font-semibold text-white">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 text-sm font-semibold text-white/80">Recent lessons</p>
            {summary && summary.recent.length > 0 ? (
              <ul className="mt-1 divide-y divide-white/[0.06] text-sm">
                {summary.recent.map((r) => (
                  <li key={r.sessionId} className="flex items-center justify-between gap-3 py-1.5">
                    <Link href={`/classes/${classId}/sessions/${r.sessionId}/control-room`} className="min-w-0 truncate text-white/85 hover:text-white">{day(r.at)} · {r.title}</Link>
                    <span className="shrink-0 text-white/50">{r.answered ? `answered ${r.answered}${r.accuracy != null ? ` · ${r.accuracy}%` : ''}` : 'no answers'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-white/50">Not in a lesson yet.</p>
            )}

            <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-white/80"><NotebookPen className="h-4 w-4" /> Your notes</p>
            {isPro ? (
              <>
                {notes.length > 0 ? (
                  <ul className="mt-1 space-y-1.5 text-sm">
                    {notes.map((nt, i) => (
                      <li key={`${nt.sessionId}-${i}`} className="whitespace-pre-line rounded-lg bg-white/[0.04] px-3 py-2 text-white/85">
                        <span className="text-white/45">{day(nt.at)}, {nt.title} · </span>{nt.note}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-white/50">No notes yet. What did you notice about {selected.name}?</p>
                )}
                <div className="mt-2 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => { setDraft(e.target.value.slice(0, 500)); setSaveError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') void saveNote(); }}
                    placeholder={`A note about ${selected.name}`}
                    className="min-w-0 flex-1 rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-amber-300/60 focus:outline-none"
                  />
                  <button type="button" disabled={saving} onClick={() => void saveNote()} className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
                </div>
                {saveError && <p className="mt-1 text-xs text-rose-300">{saveError}</p>}
              </>
            ) : (
              <p className="mt-1 text-sm text-white/55">Notes on each student, kept from every lesson, are part of <Link href="/pro" className="text-amber-200 underline underline-offset-2">Pro</Link>.</p>
            )}
          </div>
        )}
      </div>

      <ProgressReportModal student={reportFor} classId={classId} open={!!reportFor} onClose={() => setReportFor(null)} />
    </section>
  );
}

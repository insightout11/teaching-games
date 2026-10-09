import Link from 'next/link';
import { flightResultLine, formatMeasure, type FlightResult } from '@/lib/flight-result';
import type { LessonEntry } from '@/lib/lesson-memory';
import { ClassLogbookShareControl } from '@/components/class/class-logbook-share-control';
import { FLAP_FONT } from '@/components/ui/split-flap';

export interface TimelineItem {
  id: string;
  at: string;
  active: boolean;
  topic: string | null;
  activities: number;
  entry: LessonEntry | null;
  result: FlightResult | null;
}

/**
 * The class logbook as a timeline (Oct 2026 class page): one entry per lesson with what it covered, its flight result
 * and its words. Class counts only, no names, so it is safe on a shared screen.
 */
export function ClassTimeline({
  classId,
  items,
  shareEnabled,
  shareToken,
}: {
  classId: string;
  items: TimelineItem[];
  shareEnabled: boolean;
  shareToken: string | null;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-2xl border border-white/[0.07] bg-[#0a121e]/85 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300" style={{ fontFamily: FLAP_FONT }}>Logbook</h2>
        <div className="flex items-center gap-3">
          {shareEnabled && shareToken && (
            <Link href={`/logbook/${shareToken}`} target="_blank" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">View parents&apos; page</Link>
          )}
          <ClassLogbookShareControl classId={classId} initialShareEnabled={shareEnabled} initialShareToken={shareToken} />
        </div>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/50">After this class&apos;s first lesson, each lesson shows up here: what you talked about, the words, and how it went.</p>
      ) : (
        <ol className="divide-y divide-white/[0.06]">
          {items.map((it) => {
            const title = it.result ? [it.result.city, it.result.flight, it.result.topic].filter(Boolean).join(' · ') : it.topic || (it.entry?.topics.at(-1) ?? 'Lesson');
            const lead = it.result?.measures[0];
            return (
              <li key={it.id} className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-3 py-3.5">
                <span className="pt-0.5 text-xs font-bold uppercase text-white/45" style={{ fontFamily: FLAP_FONT }}>
                  {new Date(it.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 font-semibold text-white">{title}</p>
                    {it.active ? (
                      <Link href={`/sessions/${it.id}`} className="shrink-0 text-xs font-bold uppercase tracking-wide text-emerald-300 hover:text-emerald-200">Resume</Link>
                    ) : (
                      <Link href={`/classes/${classId}/sessions/${it.id}/control-room`} className="shrink-0 text-xs text-cyan-300 hover:text-cyan-200">Debrief</Link>
                    )}
                  </div>
                  {it.entry && it.entry.topics.length > 0 && (
                    <p className="mt-0.5 text-[13.5px] text-white/70">Talked about: {it.entry.topics.join(' → ')}</p>
                  )}
                  {it.entry && it.entry.activities.length > 0 && (
                    <p className="mt-0.5 text-[13.5px] text-white/70">Did: {it.entry.activities.join(', ')}</p>
                  )}
                  {!it.entry && !it.result && it.activities > 0 && (
                    <p className="mt-0.5 text-[13.5px] text-white/50">{it.activities} activit{it.activities === 1 ? 'y' : 'ies'}</p>
                  )}
                  {lead && (
                    <span className="mt-1.5 inline-block rounded-md bg-emerald-400/12 px-2 py-0.5 text-[11px] font-bold text-emerald-300" style={{ fontFamily: FLAP_FONT }} title={it.result ? flightResultLine(it.result) : undefined}>
                      {lead.label}: {formatMeasure(lead)}
                    </span>
                  )}
                  {it.entry && it.entry.words.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {it.entry.words.slice(0, 6).map((w) => <span key={w} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/70">{w}</span>)}
                      {it.entry.words.length + it.entry.moreWords > 6 && <span className="px-1 text-xs text-white/40">+{it.entry.words.length + it.entry.moreWords - 6}</span>}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

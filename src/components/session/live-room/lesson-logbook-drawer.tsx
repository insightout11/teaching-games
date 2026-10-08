'use client';

import { BookOpen, Compass, CornerUpLeft, History, MessageCircle, PlaneTakeoff, X } from 'lucide-react';
import type { LessonEntry, LessonMemory } from '@/lib/lesson-memory';

/**
 * Live memory step 4: "Today's logbook" in the room. What this lesson has covered so far (topics in order, words,
 * activities, material) with one tap back to an earlier topic, plus last lesson for reference. Safe on the shared
 * screen: no names, no individual answers.
 */
export function LessonLogbookDrawer({
  memory,
  currentTopic,
  lastTime,
  onBackTo,
  onClose,
}: {
  memory: LessonMemory;
  currentTopic: string | null;
  lastTime: LessonEntry | null;
  onBackTo: (title: string) => void;
  onClose: () => void;
}) {
  const topics = memory.topics.filter((t, i, all) => all.findIndex((x) => x.title === t.title) === i);
  const activities = memory.activities.map((a) => a.name).filter((n, i, all) => all.indexOf(n) === i);
  const empty = !topics.length && !memory.words.length && !activities.length && !memory.material.length;
  const head = 'mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/50';

  return (
    <div className="absolute bottom-3 right-3 top-16 z-[60] flex w-[360px] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-[#2A3854] bg-[#0c1322] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#2A3854] px-3 py-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">Today&apos;s logbook</p>
        <button type="button" onClick={onClose} aria-label="Close"><X className="h-4 w-4 text-white/60" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3 text-sm text-white/85">
        {empty && <p className="text-white/50">Nothing yet. Topics, words and activities from this lesson appear here as you go.</p>}

        {topics.length > 0 && (
          <section>
            <p className={head}><MessageCircle className="h-3.5 w-3.5" />Talked about</p>
            <ol className="space-y-1">
              {topics.map((t) => {
                const now = t.title === currentTopic;
                return (
                  <li key={t.title} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/[0.04]">
                    <span className={`min-w-0 flex-1 truncate ${now ? 'text-cyan-200' : ''}`}>{t.title}</span>
                    {now ? (
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-300">Now</span>
                    ) : (
                      <button type="button" onClick={() => onBackTo(t.title)} className="flex shrink-0 items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-xs text-white/70 hover:border-cyan-300/60 hover:text-white">
                        <CornerUpLeft className="h-3 w-3" />Back to this
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {memory.words.length > 0 && (
          <section>
            <p className={head}><BookOpen className="h-3.5 w-3.5" />Words ({memory.words.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {memory.words.map((w) => <span key={w} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs">{w}</span>)}
            </div>
          </section>
        )}

        {activities.length > 0 && (
          <section>
            <p className={head}><PlaneTakeoff className="h-3.5 w-3.5" />Did</p>
            <p className="text-white/75">{activities.join(', ')}</p>
          </section>
        )}

        {memory.material.length > 0 && (
          <section>
            <p className={head}><Compass className="h-3.5 w-3.5" />Explored</p>
            <ul className="space-y-0.5 text-white/75">{memory.material.map((m) => <li key={m.title} className="truncate">{m.title}</li>)}</ul>
          </section>
        )}

        {lastTime && (
          <section className="border-t border-[#2A3854] pt-3">
            <p className={head}><History className="h-3.5 w-3.5" />Last lesson</p>
            {lastTime.topics.length > 0 && <p className="text-white/70">{lastTime.topics.join(' → ')}</p>}
            {lastTime.words.length > 0 && <p className="mt-1 text-xs text-white/50">{lastTime.words.join(', ')}{lastTime.moreWords ? ` +${lastTime.moreWords}` : ''}</p>}
          </section>
        )}
      </div>
    </div>
  );
}

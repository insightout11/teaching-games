import { BookOpen, CheckCircle2, Flame, Gauge, PlaneTakeoff, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ClassLogbookSummary } from '@/lib/class-logbook';

function plural(value: number, singular: string, pluralLabel = `${singular}s`) {
  return `${value.toLocaleString()} ${value === 1 ? singular : pluralLabel}`;
}

function statValue(value: number | string | null) {
  return value === null ? '-' : value;
}

export function ClassLogbookMiniCard({
  summary,
  currentTopic,
}: {
  summary: ClassLogbookSummary;
  currentTopic?: string | null;
}) {
  const flightLabel = summary.completedFlights > 0
    ? `Flight ${summary.completedFlights + 1}`
    : 'First flight';

  return (
    <section className="glass rounded-2xl border border-cyan-300/15 bg-slate-950/40 p-3">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
          <BookOpen className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/65">Class Logbook</p>
          <h2 className="mt-1 text-sm font-bold text-lc-text">{flightLabel} for {summary.className}</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-lc-text3">
            {summary.completedFlights > 0
              ? `Last lesson: ${summary.lastTopic ?? 'class lesson'}`
              : 'This class is starting its shared record.'}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
        <div className="border-r border-white/10 px-2 py-2 text-center">
          <p className="text-sm font-bold text-cyan-100">{summary.completedFlights}</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-wide text-lc-text3">Lessons</p>
        </div>
        <div className="border-r border-white/10 px-2 py-2 text-center">
          <p className="text-sm font-bold text-emerald-200">{summary.totalResponses}</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-wide text-lc-text3">Responses</p>
        </div>
        <div className="px-2 py-2 text-center">
          <p className="text-sm font-bold text-amber-200">{statValue(summary.averageAccuracy)}{summary.averageAccuracy !== null ? '%' : ''}</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-wide text-lc-text3">Accuracy</p>
        </div>
      </div>

      {currentTopic && (
        <div className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/75">Today&apos;s entry</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-lc-text">{currentTopic}</p>
        </div>
      )}
    </section>
  );
}

export function ClassLogbookDepositCard({
  summary,
  sessionResponses,
  sessionAccuracy,
  sessionBestStreak,
  currentTopic,
  alreadyRecorded = false,
}: {
  summary: ClassLogbookSummary;
  sessionResponses: number;
  sessionAccuracy: number | null;
  sessionBestStreak: number;
  currentTopic?: string | null;
  alreadyRecorded?: boolean;
}) {
  const totalFlights = summary.completedFlights + (alreadyRecorded ? 0 : 1);
  const totalResponses = summary.totalResponses + (alreadyRecorded ? 0 : sessionResponses);
  const recentTopics = [
    currentTopic?.trim() || null,
    ...summary.recentTopics,
  ].filter((topic, index, topics): topic is string => Boolean(topic) && topics.indexOf(topic) === index).slice(0, 3);

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-cyan-300/25 bg-slate-950/60 text-left backdrop-blur-md">
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">Class Logbook</p>
          <h2 className="mt-1 text-xl font-bold text-lc-text">
            {alreadyRecorded ? 'Class record updated' : 'Added to the class logbook'}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-lc-text3">
            Every completed LessonCaptain lesson becomes part of this class&apos;s shared flight record.
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-3 text-right">
          <p className="text-[11px] uppercase tracking-wide text-cyan-100/65">Class total</p>
          <p className="mt-1 text-sm font-semibold text-cyan-100">{plural(totalFlights, 'lesson')}</p>
        </div>
      </div>

      <div className="grid gap-px bg-white/10 sm:grid-cols-4">
        <LogbookStat
          icon={<PlaneTakeoff className="h-4 w-4" aria-hidden />}
          label="Lessons"
          value={totalFlights.toLocaleString()}
          detail={alreadyRecorded ? 'Already recorded' : '+1 this lesson'}
        />
        <LogbookStat
          icon={<Sparkles className="h-4 w-4" aria-hidden />}
          label="Responses"
          value={totalResponses.toLocaleString()}
          detail={`${sessionResponses.toLocaleString()} this lesson`}
        />
        <LogbookStat
          icon={<Gauge className="h-4 w-4" aria-hidden />}
          label="Accuracy"
          value={sessionAccuracy === null ? '-' : `${sessionAccuracy}%`}
          detail="This landing"
        />
        <LogbookStat
          icon={<Flame className="h-4 w-4" aria-hidden />}
          label="Best Streak"
          value={sessionBestStreak.toLocaleString()}
          detail={`Class best: ${summary.bestStreak.toLocaleString()}`}
        />
      </div>

      {recentTopics.length > 0 && (
        <div className="px-5 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lc-text3">Recent entries</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentTopics.map((topic) => (
              <span
                key={topic}
                className="max-w-full truncate rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-semibold text-lc-text2"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function LogbookStat({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-slate-950/50 px-5 py-4">
      <div className="flex items-center gap-2 text-cyan-100/75">
        {icon}
        <p className="text-xs font-semibold">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-lc-text">{value}</p>
      <p className="mt-1 text-[11px] text-lc-text3">{detail}</p>
    </div>
  );
}

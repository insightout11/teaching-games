import Link from 'next/link';
import type { ReactNode } from 'react';
import { BookOpen, Flame, MessageSquareText, PlaneTakeoff, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ClassLogbookSummary } from '@/lib/class-logbook';
import { ClassLogbookShareControl } from '@/components/class/class-logbook-share-control';

export function ClassLogbookHubCard({
  summary,
  shareEnabled,
  shareToken,
}: {
  summary: ClassLogbookSummary;
  shareEnabled: boolean;
  shareToken: string | null;
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 shrink-0 text-lc-blue" aria-hidden />
        <h2 className="text-sm font-semibold text-lc-text">Class Logbook</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 font-instrument text-sm">
        <LogbookMetric icon={<PlaneTakeoff className="h-3.5 w-3.5" />} value={summary.completedFlights.toLocaleString()} label="lessons" />
        <LogbookMetric icon={<MessageSquareText className="h-3.5 w-3.5" />} value={summary.totalResponses.toLocaleString()} label="responses" />
        <LogbookMetric
          icon={<Target className="h-3.5 w-3.5" />}
          value={summary.averageAccuracy === null ? '-' : `${summary.averageAccuracy}%`}
          label="accuracy"
        />
        <LogbookMetric icon={<Flame className="h-3.5 w-3.5" />} value={summary.bestStreak.toLocaleString()} label="best streak" />
      </div>

      {summary.recentTopics.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-lc-text3">Recent entries</p>
          <div className="flex flex-wrap gap-1.5">
            {summary.recentTopics.slice(0, 3).map((topic) => (
              <span key={topic} className="max-w-full truncate rounded-full border border-lc-border bg-lc-surface px-2 py-1 text-[11px] text-lc-text2">
                {topic}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-lc-text3">Completed lessons will appear here after this class starts flying.</p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-lc-border/60 pt-3">
        {shareEnabled && shareToken ? (
          <Link href={`/logbook/${shareToken}`} target="_blank" className="text-xs font-semibold text-lc-blue transition-colors hover:text-lc-blue-hover">
            View public page
          </Link>
        ) : (
          <span className="text-xs text-lc-text3">Safe class-only progress page</span>
        )}
        <ClassLogbookShareControl
          classId={summary.classId}
          initialShareEnabled={shareEnabled}
          initialShareToken={shareToken}
        />
      </div>
    </Card>
  );
}

function LogbookMetric({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-lc-border/70 bg-lc-surface px-3 py-2">
      <p className="flex items-center gap-1.5 text-lc-text">
        <span className="text-lc-blue">{icon}</span>
        <span className="font-bold">{value}</span>
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-lc-text3">{label}</p>
    </div>
  );
}

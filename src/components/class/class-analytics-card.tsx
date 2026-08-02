import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Flame, Plane, Target } from 'lucide-react';

const TOP_ACCURACY_THRESHOLD = 80;

function accuracyColor(accuracy: number | null): string {
  if (accuracy === null) return 'text-lc-text3';
  if (accuracy >= TOP_ACCURACY_THRESHOLD) return 'text-lc-success';
  if (accuracy >= 50) return 'text-lc-warn';
  return 'text-lc-danger';
}

export function ClassAnalyticsCard({
  classId,
  accuracy,
  flightCount,
  topStreak,
}: {
  classId: string;
  accuracy: number | null;
  flightCount: number;
  topStreak: number;
}) {
  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-lc-text3 shrink-0" />
        <h2 className="text-sm font-semibold text-lc-text">Analytics</h2>
      </div>
      <div className="space-y-1.5 font-instrument text-sm">
        <p className={`flex items-center gap-1.5 ${accuracyColor(accuracy)}`}>
          <Target className="w-3.5 h-3.5" />
          {accuracy !== null ? `${accuracy}% accuracy` : 'No accuracy data yet'}
        </p>
        <p className="flex items-center gap-1.5 text-lc-text2">
          <Plane className="w-3.5 h-3.5 text-lc-text3" />
          {flightCount} lesson{flightCount === 1 ? '' : 's'}
        </p>
        {topStreak >= 2 && (
          <p className="flex items-center gap-1.5 text-lc-text2">
            <Flame className="w-3.5 h-3.5 text-lc-warn" />
            Best streak: {topStreak}
          </p>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-lc-border/60">
        <Link href={`/classes/${classId}/control-room`} className="text-xs font-semibold text-lc-blue hover:text-lc-blue-hover transition-colors">
          Open Control Room →
        </Link>
      </div>
    </Card>
  );
}

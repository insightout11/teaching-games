import { Target } from 'lucide-react';

interface ClassAccuracyGaugeProps {
  accuracy: number | null;
  scorableAttempts: number;
  correctCount: number;
}

export function ClassAccuracyGauge({ accuracy, scorableAttempts, correctCount }: ClassAccuracyGaugeProps) {
  const color = accuracy === null ? 'text-lc-text3'
    : accuracy >= 80 ? 'text-lc-success'
    : accuracy >= 50 ? 'text-lc-warn'
    : 'text-lc-danger';

  const barColor = accuracy === null ? 'bg-lc-border'
    : accuracy >= 80 ? 'bg-lc-success'
    : accuracy >= 50 ? 'bg-lc-warn'
    : 'bg-lc-danger';

  return (
    <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-lc-text3 shrink-0" />
        <h2 className="font-semibold text-lc-text">Hit Rate</h2>
      </div>
      {scorableAttempts === 0 ? (
        <p className="text-lc-text3 text-sm">No scoring data</p>
      ) : (
        <>
          <div className="flex items-baseline gap-3 mb-1">
            <span className={`text-5xl font-bold tabular-nums ${color}`}>{accuracy ?? '—'}%</span>
            <span className="text-sm text-lc-text3">{correctCount} / {scorableAttempts} correct</span>
          </div>
          <div className="w-full bg-lc-surface rounded-full h-2.5 overflow-hidden mt-4">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${accuracy ?? 0}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

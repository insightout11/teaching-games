interface ClassAccuracyGaugeProps {
  accuracy: number | null;
  scorableAttempts: number;
  correctCount: number;
}

export function ClassAccuracyGauge({ accuracy, scorableAttempts, correctCount }: ClassAccuracyGaugeProps) {
  if (scorableAttempts === 0) {
    return (
      <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
        <h2 className="font-semibold text-lc-text mb-4">Class Accuracy</h2>
        <p className="text-lc-text3 text-sm">No scoring data</p>
      </div>
    );
  }

  return (
    <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
      <h2 className="font-semibold text-lc-text mb-4">Class Accuracy</h2>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl font-bold text-lc-success">{accuracy ?? '—'}%</span>
      </div>
      <p className="text-sm text-lc-text3 mb-4">
        {correctCount} correct of {scorableAttempts} scorable attempts
      </p>
      <div className="w-full bg-lc-surface rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full bg-lc-blue transition-all duration-500"
          style={{ width: `${accuracy ?? 0}%` }}
        />
      </div>
    </div>
  );
}

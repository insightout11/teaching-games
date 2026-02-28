interface ParticipationRow {
  studentId: string;
  name: string;
  attempts: number;
  coverage: number | null;
  accuracy: number | null;
}

interface ParticipationGridProps {
  rows: ParticipationRow[];
  maxPromptIndex: number | null;
}

function accuracyColor(accuracy: number | null): string {
  if (accuracy === null) return 'text-lc-text3';
  if (accuracy >= 80) return 'text-lc-success';
  if (accuracy >= 50) return 'text-lc-text';
  return 'text-lc-text3';
}

export function ParticipationGrid({ rows, maxPromptIndex }: ParticipationGridProps) {
  const sorted = [...rows].sort((a, b) => {
    if (a.coverage === null && b.coverage === null) return a.name.localeCompare(b.name);
    if (a.coverage === null) return 1;
    if (b.coverage === null) return -1;
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
      <h2 className="font-semibold text-lc-text mb-4">Participation</h2>

      {maxPromptIndex === null && (
        <div className="mb-4 text-sm text-lc-text3 bg-lc-surface rounded-lg px-4 py-3">
          Participation coverage requires sessions recorded after the v1.1 update.
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-lc-text3 text-sm">No students</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-2 px-0">
            <span className="w-32 shrink-0" />
            <span className="w-16 shrink-0" />
            <span className="flex-1 text-xs text-lc-text3">Coverage</span>
            <span className="w-10 text-xs text-lc-text3 text-right shrink-0">Cov</span>
            <span className="w-10 text-xs text-lc-text3 text-right shrink-0">Acc</span>
          </div>
          <div className="space-y-3">
            {sorted.map((row) => (
              <div key={row.studentId} className="flex items-center gap-3">
                <span className="w-32 text-sm text-lc-text truncate shrink-0">{row.name}</span>
                <span className="w-16 text-xs text-lc-text3 text-right shrink-0">{row.attempts} turns</span>
                <div className="flex-1 bg-lc-surface rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-lc-blue transition-all duration-500"
                    style={{ width: `${row.coverage ?? 0}%` }}
                  />
                </div>
                <span className="w-10 text-xs text-lc-text3 text-right shrink-0">
                  {row.coverage !== null ? `${row.coverage}%` : 'N/A'}
                </span>
                <span className={`w-10 text-xs font-medium text-right shrink-0 ${accuracyColor(row.accuracy)}`}>
                  {row.accuracy !== null ? `${row.accuracy}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

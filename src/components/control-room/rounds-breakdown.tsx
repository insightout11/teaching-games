// Free-tier round caps per game, hardcoded until subscription.ts exists
const FREE_ROUNDS_PER_SESSION: Record<string, number> = {
  'vocab-sprint': 4,
  'synonym-showdown': 4,
  'sentence-scramble': 4,
  'grammar-boss': 4,
  'dialogue-detective': 4,
  'error-hunter': 4,
};

function prettyGameName(gameType: string): string {
  return gameType
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const TOP_ACCURACY_THRESHOLD = 80;

function accuracyColor(accuracy: number | null): string {
  if (accuracy === null) return 'text-lc-text3';
  if (accuracy >= TOP_ACCURACY_THRESHOLD) return 'text-lc-success';
  if (accuracy >= 50) return 'text-lc-text2';
  return 'text-lc-text3';
}

interface RoundsBreakdownRow {
  gameType: string;
  rounds: number;
  accuracy?: number | null;
}

interface RoundsBreakdownProps {
  rows: RoundsBreakdownRow[];
}

export function RoundsBreakdown({ rows }: RoundsBreakdownProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
        <h2 className="font-semibold text-lc-text mb-2">Games Played</h2>
        <p className="text-sm text-lc-text3">No round data recorded for this session.</p>
      </div>
    );
  }

  return (
    <div className="bg-lc-card rounded-2xl border border-lc-border p-6">
      <h2 className="font-semibold text-lc-text mb-4">Games Played</h2>
      <div className="space-y-2">
        {rows.map(({ gameType, rounds, accuracy }) => {
          const cap = FREE_ROUNDS_PER_SESSION[gameType] ?? null;
          const capReached = cap !== null && rounds >= cap;

          return (
            <div key={gameType} className="flex items-center justify-between">
              <span className="text-sm text-lc-text">{prettyGameName(gameType)}</span>
              <div className="flex items-center gap-3">
                {accuracy !== null && accuracy !== undefined && (
                  <span className={`text-sm font-semibold ${accuracyColor(accuracy)}`}>
                    {accuracy}%
                  </span>
                )}
                <span className="text-sm text-lc-text3">
                  {rounds} {rounds === 1 ? 'round' : 'rounds'}
                  {cap !== null && <span className="text-lc-text3"> / {cap} free</span>}
                </span>
                {capReached && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-lc-warn/15 text-lc-warn">
                    cap reached
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

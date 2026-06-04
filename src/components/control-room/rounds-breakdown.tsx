import { Layers } from 'lucide-react';
import { Surface } from '@/components/ui/surface';

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
  if (accuracy >= 50) return 'text-lc-warn';
  return 'text-lc-danger';
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
  return (
    <Surface variant="card">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-lc-text3 shrink-0" />
        <h2 className="font-semibold text-lc-text">Mission Debrief</h2>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-lc-text3">No activity recorded for this flight.</p>
      ) : (
        <div className="space-y-2">
          {rows.map(({ gameType, rounds, accuracy }) => {
            const cap = FREE_ROUNDS_PER_SESSION[gameType] ?? null;
            const capReached = cap !== null && rounds >= cap;

            return (
              <div key={gameType} className="flex items-center gap-3 py-1">
                <span className="flex-1 text-sm text-lc-text">{prettyGameName(gameType)}</span>
                {accuracy !== null && accuracy !== undefined && (
                  <span className={`text-sm font-semibold tabular-nums ${accuracyColor(accuracy)}`}>
                    {accuracy}%
                  </span>
                )}
                <span className="text-sm text-lc-text3 tabular-nums">
                  {rounds} {rounds === 1 ? 'round' : 'rounds'}
                  {cap !== null && <span className="text-lc-text3/60"> / {cap} free</span>}
                </span>
                {capReached && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-lc-warn/15 text-lc-warn">
                    cap
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Surface>
  );
}

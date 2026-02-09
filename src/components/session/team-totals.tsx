'use client';

import { useMemo } from 'react';
import { useSessionStore } from '@/stores/session-store';

export function TeamTotals() {
  const scores = useSessionStore((s) => s.scores);

  const teamTotals = useMemo(() => {
    const totals: Record<string, number> = { red: 0, blue: 0 };

    scores.forEach((score) => {
      const team = score.team;
      if (team && (team === 'red' || team === 'blue')) {
        totals[team] += score.points + score.streak_bonus;
      }
    });

    return totals;
  }, [scores]);

  // Only show if there are team scores
  const hasTeamScores = teamTotals.red > 0 || teamTotals.blue > 0;

  if (!hasTeamScores) {
    return null;
  }

  const redPercentage = teamTotals.red + teamTotals.blue > 0
    ? Math.round((teamTotals.red / (teamTotals.red + teamTotals.blue)) * 100)
    : 50;

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3">Team Battle</h3>

      {/* Score Display */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{teamTotals.red}</div>
          <div className="text-xs text-gray-400">Red Team</div>
        </div>
        <div className="text-gray-500 text-sm">vs</div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{teamTotals.blue}</div>
          <div className="text-xs text-gray-400">Blue Team</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-gray-700 overflow-hidden flex">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
          style={{ width: `${redPercentage}%` }}
        />
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
          style={{ width: `${100 - redPercentage}%` }}
        />
      </div>
    </div>
  );
}

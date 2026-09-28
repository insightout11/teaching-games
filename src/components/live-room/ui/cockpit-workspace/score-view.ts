/**
 * What a scoreboard shows, for each scoring mode.
 *
 * One function, used by the pinned strip, the scores overlay and the public
 * view, so the three can never disagree about what "Teams" or "Off" means.
 *
 * It arranges totals it is given. It calculates nothing: no points are awarded,
 * adjusted or recounted here, and nothing is read from or written to a scoring
 * system.
 */

import type { ScoreMode } from './types';

export interface ScoreRow {
  id: string;
  name: string;
  points: number;
}

export interface ScoreView {
  mode: ScoreMode;
  label: string;
  /** False when scoring is off. The totals are still shown, just not counted. */
  counting: boolean;
  rows: ScoreRow[];
  /** One line of context when the rows need it. */
  note: string | null;
}

export const SCORE_MODE_LABEL: Record<ScoreMode, string> = {
  class: 'Whole class',
  team: 'Teams',
  competitive: 'Individual',
  off: 'Not scoring',
};

export function scoreViewFor(
  mode: ScoreMode,
  students: ScoreRow[],
  teams: { name: string; points: number }[],
): ScoreView {
  const ranked = [...students].sort((a, b) => b.points - a.points);
  switch (mode) {
    case 'class':
      // One shared total: the class plays together, nobody is ranked.
      return {
        mode,
        label: SCORE_MODE_LABEL[mode],
        counting: true,
        rows: [
          {
            id: 'whole-class',
            name: 'Whole class',
            points: students.reduce((sum, student) => sum + student.points, 0),
          },
        ],
        note: null,
      };
    case 'team':
      return {
        mode,
        label: SCORE_MODE_LABEL[mode],
        counting: true,
        rows: [...teams]
          .sort((a, b) => b.points - a.points)
          .map(team => ({ id: `team-${team.name}`, name: team.name, points: team.points })),
        note: null,
      };
    case 'competitive':
      return { mode, label: SCORE_MODE_LABEL[mode], counting: true, rows: ranked, note: null };
    case 'off':
      // A preference, not an absence: what the class already had stays visible.
      return {
        mode,
        label: SCORE_MODE_LABEL[mode],
        counting: false,
        rows: ranked,
        note: 'Scoring is off. These are the totals the class already had; nothing new is being counted.',
      };
  }
}

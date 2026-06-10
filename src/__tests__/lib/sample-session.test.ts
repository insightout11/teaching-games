import { describe, it, expect } from 'vitest';
import {
  SAMPLE_STUDENTS,
  SAMPLE_ROUNDS,
  SAMPLE_PROFILES,
  buildSampleScores,
} from '@/lib/sample-session';
import { outcomeToPoints, type ScoreOutcome } from '@/lib/score-engine';
import { getGame } from '@/games/registry';
import { getActivity } from '@/activities/registry';

const STUDENT_IDS: Record<string, string> = Object.fromEntries(
  SAMPLE_STUDENTS.map((s, i) => [s.name, `student-${i + 1}`]),
);

const START = new Date('2026-06-01T09:00:00Z');

describe('buildSampleScores', () => {
  const rows = buildSampleScores('session-1', STUDENT_IDS, START);

  it('produces 9 rows per student (5 vocab + 2 WYR + 2 council)', () => {
    expect(rows.length).toBe(SAMPLE_STUDENTS.length * 9);
    for (const s of SAMPLE_STUDENTS) {
      expect(rows.filter((r) => r.display_name === s.name).length).toBe(9);
    }
  });

  it('every row matches the score-engine point ladder for its outcome', () => {
    for (const row of rows) {
      expect(row.points).toBe(outcomeToPoints(row.outcome as ScoreOutcome));
      expect(row.scoring_version).toBe(2);
      expect(row.counts_for_leaderboard).toBe(true);
    }
  });

  it('only vocab-sprint rows count for accuracy', () => {
    for (const row of rows) {
      const isVocab = row.response_data.gameKey === 'vocab-sprint';
      expect(row.counts_for_accuracy).toBe(isVocab);
      if (!isVocab) expect(row.accuracy_status).toBe('not_applicable');
    }
  });

  it('respects module outcome support (no standout outside decision-council)', () => {
    for (const row of rows) {
      if (row.outcome === 'standout') {
        expect(row.response_data.activityKey).toBe('decision-council');
      }
    }
    // The sample must include at least one standout — it demos the ladder.
    expect(rows.some((r) => r.outcome === 'standout')).toBe(true);
  });

  it('prompt_index restarts per module and answers carry real text', () => {
    const miaVocab = rows.filter((r) => r.display_name === 'Mia' && r.response_data.gameKey === 'vocab-sprint');
    expect(miaVocab.map((r) => r.prompt_index)).toEqual([1, 2, 3, 4, 5]);
    for (const row of rows) {
      expect(String(row.response_data.answer).length).toBeGreaterThan(2);
      expect(row.response_data.sample).toBe(true);
    }
  });

  it('staggers created_at within the session window', () => {
    const times = rows.map((r) => new Date(r.created_at).getTime());
    expect(Math.min(...times)).toBeGreaterThan(START.getTime());
    expect(Math.max(...times)).toBeLessThan(START.getTime() + 45 * 60_000);
    expect(new Set(times).size).toBeGreaterThan(rows.length / 2); // mostly distinct
  });
});

describe('SAMPLE_PROFILES stay in sync with the real plugin registry', () => {
  it.each(SAMPLE_ROUNDS.map((r) => r.gameType))('%s', (key) => {
    const plugin = getGame(key) ?? getActivity(key);
    expect(plugin?.scoringProfile, `${key} must be a registered module`).toBeDefined();
    expect(SAMPLE_PROFILES[key]).toEqual(plugin!.scoringProfile);
  });
});

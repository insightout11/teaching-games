import { describe, expect, it } from 'vitest';
import {
  buildGridRushRound2InputSpec,
  getGridRushFlightPhase,
  GRID_RUSH_ROUND2_DURATION,
} from './lifecycle';
import { GamePhase, type WordEntry } from './types';

describe('Grid Rush Captain\'s Flight lifecycle', () => {
  it('does not report completion between rounds or during Sentence Showdown', () => {
    expect(getGridRushFlightPhase(GamePhase.ROUND1)).toBe('round1');
    expect(getGridRushFlightPhase(GamePhase.ROUND1_ENDING)).toBe('between-rounds');
    expect(getGridRushFlightPhase(GamePhase.ROUND2)).toBe('round2');
  });

  it('reports completion only when the results are ready', () => {
    expect(getGridRushFlightPhase(GamePhase.REVEALING)).toBe('finished');
  });

  it('broadcasts the second-round sentence input with each student\'s words', () => {
    const words: WordEntry[] = [
      { word: 'repair', points: 3, hasBonusLetter: false, isTopicWord: true, submittedAt: 1 },
      { word: 'reuse', points: 2, hasBonusLetter: true, isTopicWord: false, submittedAt: 2 },
    ];

    const spec = buildGridRushRound2InputSpec({
      startedAt: 12_345,
      studentWords: { 'student-1': words },
      studentSentences: {},
      studentIdToClientId: { 'student-1': 'client-1' },
    });

    expect(spec).toMatchObject({
      type: 'textarea',
      gameKey: 'grid-rush',
      timerSeconds: GRID_RUSH_ROUND2_DURATION,
      startedAt: 12_345,
      perStudentData: {
        'client-1': { round1Words: ['repair', 'reuse'] },
      },
    });
  });
});

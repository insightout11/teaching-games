import type { InputSpec } from '@/lib/input-spec';
import { GamePhase, type SentenceEntry, type WordEntry } from './types';

export const GRID_RUSH_ROUND2_DURATION = 60;

export type GridRushFlightPhase =
  | 'idle'
  | 'generating'
  | 'round1'
  | 'between-rounds'
  | 'round2'
  | 'finished';

export function getGridRushFlightPhase(phase: GamePhase): GridRushFlightPhase {
  switch (phase) {
    case GamePhase.GENERATING:
      return 'generating';
    case GamePhase.ROUND1:
      return 'round1';
    case GamePhase.ROUND1_ENDING:
      return 'between-rounds';
    case GamePhase.ROUND2:
      return 'round2';
    case GamePhase.REVEALING:
      return 'finished';
    case GamePhase.IDLE:
    default:
      return 'idle';
  }
}

export function buildGridRushRound2InputSpec({
  startedAt,
  studentWords,
  studentSentences,
  studentIdToClientId,
}: {
  startedAt: number;
  studentWords: Record<string, WordEntry[]>;
  studentSentences: Record<string, SentenceEntry>;
  studentIdToClientId: Record<string, string>;
}): InputSpec {
  const perStudentData: Record<string, { round1Words: string[]; sentenceResult?: SentenceEntry }> = {};

  for (const [studentId, entries] of Object.entries(studentWords)) {
    const clientId = studentIdToClientId[studentId] ?? studentId;
    perStudentData[clientId] = {
      round1Words: entries.map((entry) => entry.word),
      sentenceResult: studentSentences[studentId],
    };
  }

  return {
    type: 'textarea',
    gameKey: 'grid-rush',
    prompt: 'Write ONE sentence using 2 or more of your Round 1 words.',
    placeholder: 'Your sentence...',
    maxLength: 300,
    perStudentData,
    timerSeconds: GRID_RUSH_ROUND2_DURATION,
    startedAt,
  };
}

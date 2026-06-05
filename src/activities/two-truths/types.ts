import type { TwoTruthsContent, TwoTruthsRound } from '../types';

// Activity states
export enum ActivityStatus {
  IDLE = 'IDLE',
  PRESENTING = 'PRESENTING',
  GUESSING = 'GUESSING',
  REVEAL = 'REVEAL',
  FINISHED = 'FINISHED',
}

// Student guess tracking
export interface Guess {
  clientId: string;
  studentId: string | null;
  studentName: string;
  guessIndex: number; // Which statement they think is false (0, 1, or 2)
}

// Re-export content types
export type { TwoTruthsContent, TwoTruthsRound };

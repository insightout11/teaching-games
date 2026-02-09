import type { RankItContent, RankItChallenge, RankItItem } from '../types';

// Activity states
export enum ActivityStatus {
  IDLE = 'IDLE',
  RANKING = 'RANKING',
  DISCUSSING = 'DISCUSSING',
  REVEALING = 'REVEALING',
  RE_RANKING = 'RE_RANKING',
  FINISHED = 'FINISHED',
}

// Student ranking
export interface StudentRanking {
  studentId: string;
  studentName: string;
  ranking: string[]; // Array of item IDs in ranked order
}

// Re-export content types
export type { RankItContent, RankItChallenge, RankItItem };

import type { FactDetectiveContent, FactDetectiveClaim } from '../types';

// Activity states
export enum ActivityStatus {
  IDLE = 'IDLE',
  CLAIM = 'CLAIM',
  VOTING = 'VOTING',
  REVEAL = 'REVEAL',
  VOCABULARY = 'VOCABULARY',
  FINISHED = 'FINISHED',
}

// Student vote
export interface Vote {
  studentId: string;
  studentName: string;
  believesTrue: boolean;
}

// Re-export content types
export type { FactDetectiveContent, FactDetectiveClaim };

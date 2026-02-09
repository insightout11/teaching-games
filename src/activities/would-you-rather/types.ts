import type { WouldYouRatherContent, WouldYouRatherDilemma } from '../types';

// Activity states
export enum ActivityStatus {
  IDLE = 'IDLE',
  PRESENTING = 'PRESENTING',
  VOTING = 'VOTING',
  DISCUSSING = 'DISCUSSING',
  FOLLOW_UP = 'FOLLOW_UP',
  FINISHED = 'FINISHED',
}

// Vote tracking
export interface Vote {
  studentId: string;
  studentName: string;
  choice: 'A' | 'B';
}

// Discussion point from AI follow-up
export interface DiscussionPoint {
  question: string;
  targetVoters?: 'A' | 'B' | 'all';
}

// Re-export the content type for convenience
export type { WouldYouRatherContent, WouldYouRatherDilemma };

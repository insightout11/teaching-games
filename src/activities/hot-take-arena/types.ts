import type { HotTakeArenaContent } from '../types';

// Activity states
export enum ActivityStatus {
  IDLE = 'IDLE',
  PRESENTING = 'PRESENTING',
  SIDE_SELECTION = 'SIDE_SELECTION',
  DEBATE = 'DEBATE',
  DEVILS_ADVOCATE = 'DEVILS_ADVOCATE',
  REBUTTAL = 'REBUTTAL',
  SUMMARY = 'SUMMARY',
  FINISHED = 'FINISHED',
}

// Side selection
export type Side = 'pro' | 'con';

export interface SideSelection {
  studentId: string;
  studentName: string;
  side: Side;
}

// Argument tracking
export interface Argument {
  id: string;
  studentId: string;
  studentName: string;
  side: Side;
  content: string;
  timestamp: number;
  replyToArgId?: string;
}

// Devil's advocate challenge
export interface DevilsAdvocateChallenge {
  targetSide: Side;
  challenge: string;
  isAnswered: boolean;
}

// Re-export content type
export type { HotTakeArenaContent };

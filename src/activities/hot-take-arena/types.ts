import type { HotTakeArenaContent } from '../types';

export enum ActivityStatus {
  IDLE = 'IDLE',
  PRESENTING = 'PRESENTING',
  SIDE_SELECTION = 'SIDE_SELECTION',
  DEBATE = 'DEBATE',
  MIND_CHANGE_VOTE = 'MIND_CHANGE_VOTE',
  RESULTS = 'RESULTS',
  FINISHED = 'FINISHED',
}

export type Side = 'pro' | 'con';

export interface SideSelection {
  studentId: string;
  studentName: string;
  side: Side;
}

export interface SpokeEntry {
  id: string;
  studentId: string;
  studentName: string;
  side: Side;
  claimTag: string;
  timestamp: number;
  isStarred: boolean;
}

export interface MindChangeVote {
  studentId: string;
  displayName: string;
  side: Side;
  wasConvinced: boolean;
}

export interface DevilsAdvocateChallenge {
  targetSide: Side;
  challenge: string;
}

export type { HotTakeArenaContent };

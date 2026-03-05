import type {
  ProblemSolversContent,
  ProblemStatement,
  ProblemComplication,
} from '../types';

// Activity states
export enum ActivityStatus {
  IDLE = 'IDLE',
  PROBLEM = 'PROBLEM',
  BRAINSTORMING = 'BRAINSTORMING',
  PRESENTING = 'PRESENTING',
  COMPLICATION = 'COMPLICATION',
  ADAPTING = 'ADAPTING',
  FINISHED = 'FINISHED',
}

// Team solution — includes clientId for dedup and studentName for display
export interface TeamSolution {
  id: string;
  description: string;
  resourcesUsed: string[];
  clientId: string;
  studentName: string;
  pinned: boolean;
}

// Adaptation submitted by a student during ADAPTING phase
export interface Adaptation {
  text: string;
  studentName: string;
  clientId: string;
}

// Re-export content types
export type { ProblemSolversContent, ProblemStatement, ProblemComplication };

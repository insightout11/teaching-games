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

// Team solution
export interface TeamSolution {
  id: string;
  description: string;
  resourcesUsed: string[];
}

// Re-export content types
export type { ProblemSolversContent, ProblemStatement, ProblemComplication };

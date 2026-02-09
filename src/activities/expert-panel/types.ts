import type { ExpertPanelContent, ExpertRole, ExpertQuestion } from '../types';

// Activity states
export enum ActivityStatus {
  IDLE = 'IDLE',
  ASSIGNING = 'ASSIGNING',
  PANEL = 'PANEL',
  QUESTION = 'QUESTION',
  RESPONSE = 'RESPONSE',
  FINISHED = 'FINISHED',
}

// Role assignment
export interface RoleAssignment {
  studentId: string;
  studentName: string;
  roleId: string;
}

// Response tracking
export interface ExpertResponse {
  questionId: string;
  studentId: string;
  roleId: string;
  responseNotes: string;
  vocabularyUsed: string[];
}

// Re-export content types
export type { ExpertPanelContent, ExpertRole, ExpertQuestion };

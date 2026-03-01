export type ExpertPanelPhase =
  | 'idle'
  | 'questioning'
  | 'responded'
  | 'audience-vote'
  | 'summary';

// One expert slot: a student assigned to one of the 3 panel roles
export interface ExpertSlot {
  roleIndex: number;    // 0, 1, or 2 → indexes into content.roles[]
  studentId: string;
  studentName: string;
}

export type { ExpertPanelContent, ExpertPanelRole, ExpertPanelQuestion } from '../types';

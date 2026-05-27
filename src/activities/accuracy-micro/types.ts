export type { AccuracyMicroContent } from '../types';

export interface AccuracyMicroVote {
  clientId: string;
  studentId?: string | null;
  displayName: string;
  choice: 'A' | 'B';
}

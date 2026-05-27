export type { OpinionMicroContent } from '../types';

export interface OpinionMicroVote {
  clientId: string;
  displayName: string;
  choice: 'A' | 'B';
}

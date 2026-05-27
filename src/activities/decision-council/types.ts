export type CouncilPhase =
  | 'idle'
  | 'briefing'
  | 'proposal-collect'
  | 'signal-pass'
  | 'council-select'
  | 'presenting'
  | 'challenge'
  | 'voting'
  | 'results';

export interface Proposal {
  id: string;
  submissionId?: string;  // student_submissions.id — used by spotlight API
  clientId: string;
  displayName: string;
  text: string;
  selected: boolean;
}

export interface ChallengePoint {
  id: string;
  submissionId?: string;
  clientId: string;
  displayName: string;
  text: string;
  spotlit: boolean;
}

export interface VoteRecord {
  clientId: string;
  displayName: string;
  choice: string;  // e.g. "A: Maya"
}

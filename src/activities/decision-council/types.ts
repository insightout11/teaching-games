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

export type CouncilSupportTab = 'for' | 'against' | 'evidence' | 'prompt';

export interface ProposalSupport {
  proposalId: string;
  proposalLabel: string;
  forPoints: string[];
  againstPoints: string[];
  evidence: string[];
  speakerPrompt?: string;
}

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
  kind?: 'support' | 'challenge';
  targetLabel?: string;
  spotlit: boolean;
}

export interface VoteRecord {
  clientId: string;
  displayName: string;
  choice: string;  // e.g. "A: Proposal A"
}

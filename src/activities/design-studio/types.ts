export type {
  DesignStudioBrief,
  DesignStudioContent,
  DesignStudioDecision,
  DesignStudioOption,
  DesignStudioRound,
  DesignStudioState,
} from '../types';

export type DesignStudioPhase =
  | 'idle'
  | 'generating'
  | 'question'
  | 'argue'
  | 'voting'
  | 'decision'
  | 'finalizing'
  | 'complete';

export interface DesignStudioVote {
  clientId: string;
  studentId: string | null;
  displayName: string;
  choice: string;
}

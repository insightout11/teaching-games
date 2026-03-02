export enum ActivityStatus {
  IDLE = 'IDLE',
  READING = 'READING',
  VOTING = 'VOTING',
  CONSEQUENCE = 'CONSEQUENCE',
  FINALE_SUBMIT = 'FINALE_SUBMIT',
  FINALE_PICKING = 'FINALE_PICKING',
  FINALE_VOTE = 'FINALE_VOTE',
  OUTCOME = 'OUTCOME',
}

export interface VoteRecord {
  clientId: string;
  studentId: string | null;
  displayName: string;
  choice: string;
}

export interface AssignedLine {
  line: string;
  reader: { id: string; name: string } | null;
}

export interface FinaleSubmission {
  clientId: string;
  displayName: string;
  text: string;
}

export type { ScenarioSimulatorContent, ScenarioRound, ScenarioChoice, FinaleOption } from '../types';

import type {
  ScenarioSimulatorContent,
  ScenarioSetup,
  ScenarioRole,
  ScenarioBranch,
  ScenarioChoice,
} from '../types';

// Activity states
export enum ActivityStatus {
  IDLE = 'IDLE',
  SETUP = 'SETUP',
  ASSIGNING = 'ASSIGNING',
  SITUATION = 'SITUATION',
  DISCUSSING = 'DISCUSSING',
  CHOOSING = 'CHOOSING',
  CONSEQUENCE = 'CONSEQUENCE',
  FINISHED = 'FINISHED',
}

// Role assignment
export interface RoleAssignment {
  studentId: string;
  studentName: string;
  roleId: string;
}

// Decision history
export interface DecisionRecord {
  branchId: string;
  choiceId: string;
  choiceText: string;
  consequence: string;
}

// Re-export content types
export type {
  ScenarioSimulatorContent,
  ScenarioSetup,
  ScenarioRole,
  ScenarioBranch,
  ScenarioChoice,
};

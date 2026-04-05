// Activity states
export enum ActivityStatus {
  IDLE = 'IDLE',
  COLLECTING = 'COLLECTING',
  SPOTLIGHTING = 'SPOTLIGHTING',
  REVEALING = 'REVEALING',
  FINISHED = 'FINISHED',
}

// One student's submitted data
export interface StudentEntry {
  clientId: string;
  displayName: string;
  statements: [string, string, string];
  lieIndex: number | null; // null until teacher reveals
}

// Vote tracking per spotlight round
export interface VoteRecord {
  clientId: string;
  studentId: string | null;
  displayName: string;
  choiceIndex: number; // 0, 1, or 2
}

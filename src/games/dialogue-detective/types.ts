export interface Challenge {
  speakerA_before: string;
  speakerB_blank: boolean;
  speakerA_after: string;
  context: string;
  goal: string;
}

export interface EvaluationResult {
  contextFit: number;
  naturalness: number;
  leadIn: number;
  creativityBonus: number;
  score: number;
  feedback: string;
  exampleResponse: string;
}

export enum GameStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  CHALLENGE_READY = 'challenge_ready',
  EVALUATING = 'evaluating',
  SHOWING_RESULT = 'showing_result'
}

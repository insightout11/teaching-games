export interface ErrorLocation {
  position: number;
  word: string;
  errorType: string;
  correction: string;
}

export interface Challenge {
  paragraph: string;
  errorCount: number;
  difficulty: string;
}

export interface UserCorrection {
  position: number;
  original: string;
  correction: string;
}

export interface EvaluationResult {
  totalErrors: number;
  found: number;
  correctFixes: number;
  falsePositives: number;
  score: number;
  feedback: string;
  solutions: ErrorLocation[];
}

export enum GameStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  PLAYING = 'playing',
  EVALUATING = 'evaluating',
  SHOWING_RESULT = 'showing_result'
}

export interface ConnectionChallenge {
  word1: string;
  word2: string;
  category: string;
  hint?: string;
}

export interface ConnectionResult {
  isCorrect: boolean;
  score: number;
  quality: 'wrong' | 'partial' | 'correct' | 'creative';
  feedback: string;
  actualConnection: string;
}

export enum GameStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  PLAYING = 'playing',
  EVALUATING = 'evaluating',
  SHOWING_RESULT = 'showing_result'
}

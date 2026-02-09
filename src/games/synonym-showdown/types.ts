export interface Challenge {
  targetWord: string;
  contextSentence: string;
  hint: string;
}

export interface SynonymValidation {
  isValid: boolean;
  score: number;
  quality: 'basic' | 'good' | 'excellent';
  feedback: string;
}

export interface GameState {
  challenge: Challenge | null;
  submittedSynonyms: string[];
  validSynonyms: Array<{ word: string; score: number; quality: string }>;
  currentStreak: number;
  totalScore: number;
  timeRemaining: number;
  isRunning: boolean;
}

export enum GameStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  PLAYING = 'playing',
  EVALUATING = 'evaluating',
  FINISHED = 'finished'
}

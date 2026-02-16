export interface ChainLink {
  word: string;
  connectionStrength: 'weak' | 'moderate' | 'strong' | 'creative';
  score: number;
}

export interface ExtendedChainLink extends ChainLink {
  studentId: string;
  studentName: string;
  team?: 'A' | 'B';
}

export interface ValidationResult {
  isValid: boolean;
  connectionStrength: 'weak' | 'moderate' | 'strong' | 'creative';
  score: number;
  feedback: string;
  chainLength: number;
}

export interface GameState {
  startingWord: string;
  chain: ChainLink[];
  currentWord: string;
  totalScore: number;
  isPlaying: boolean;
}

export enum GameStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  PLAYING = 'playing',
  EVALUATING = 'evaluating',
  CHAIN_BROKEN = 'chain_broken',
  FINISHED = 'finished'
}

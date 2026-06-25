export { GrammarTarget } from '@/lib/grammar';
import { GrammarTarget } from '@/lib/grammar';

export interface Challenge {
  target: GrammarTarget;
  task: string;
  exampleSentence: string;
  /** Opening words for the student to complete — scaffolds active production. Optional (older content omits it). */
  sentenceStarter?: string;
}

export interface EvaluationResult {
  grammarScore: number;
  fluencyScore: number;
  correctedSentence: string;
  feedback: string;
}

export enum GameStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  CHALLENGE_READY = 'challenge_ready',
  EVALUATING = 'evaluating',
  SHOWING_RESULT = 'showing_result'
}

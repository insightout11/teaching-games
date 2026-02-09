export enum TargetTone {
  Formal = 'formal',
  Casual = 'casual',
  Professional = 'professional',
  Persuasive = 'persuasive',
  Academic = 'academic',
  Friendly = 'friendly'
}

export const TONE_DESCRIPTIONS: Record<TargetTone, string> = {
  [TargetTone.Formal]: 'Polite, respectful, and proper language suitable for official contexts',
  [TargetTone.Casual]: 'Relaxed, everyday language used with friends and family',
  [TargetTone.Professional]: 'Clear, efficient business communication',
  [TargetTone.Persuasive]: 'Convincing language that motivates action',
  [TargetTone.Academic]: 'Scholarly, precise language for educational contexts',
  [TargetTone.Friendly]: 'Warm, approachable language that builds rapport'
};

export interface Challenge {
  originalSentence: string;
  currentTone: string;
  targetTone: TargetTone;
  context: string;
}

export interface EvaluationResult {
  toneMatch: number;
  meaningPreserved: number;
  grammarScore: number;
  score: number;
  feedback: string;
  alternatives: string[];
}

export enum GameStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  CHALLENGE_READY = 'challenge_ready',
  EVALUATING = 'evaluating',
  SHOWING_RESULT = 'showing_result'
}

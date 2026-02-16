export enum GrammarTarget {
  // Tenses
  PresentSimple = 'present simple',
  PresentContinuous = 'present continuous',
  PastSimple = 'past simple',
  PastContinuous = 'past continuous',
  PresentPerfect = 'present perfect',
  PresentPerfectContinuous = 'present perfect continuous',
  PastPerfect = 'past perfect',
  FutureWill = 'future (will)',
  FutureGoingTo = 'future (going to)',
  FutureContinuous = 'future continuous',
  // Structures
  Conditional = 'conditional',
  Passive = 'passive voice',
  RelativeClause = 'relative clause',
  ReportedSpeech = 'reported speech'
}

export interface Challenge {
  target: GrammarTarget;
  task: string;
  exampleSentence: string;
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

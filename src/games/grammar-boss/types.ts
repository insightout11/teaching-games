export enum GrammarTarget {
  Tense = 'tense',
  Conditional = 'conditional',
  Passive = 'passive',
  RelativeClause = 'relative clause',
  ReportedSpeech = 'reported speech',
  AdvancedStructure = 'advanced structure'
}

export enum FeedbackTone {
  Coach = 'Professional Coach',
  Mentor = 'Encouraging Mentor',
  Examiner = 'Strict Examiner',
  Peer = 'Friendly Peer'
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

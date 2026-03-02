export interface GridContent {
  letters: string[];       // 9 uppercase letters
  bonusLetter: string;
  bonusIndex: number;      // 0-8 position in letters[]
  topicWords: string[];    // 3-6 lowercase words for +2 topic bonus (exact match)
}

export interface WordEntry {
  word: string;            // lowercase
  points: number;
  hasBonusLetter: boolean;
  isTopicWord: boolean;
  submittedAt: number;     // Date.now()
  rejected?: boolean;      // true if AI later rejected the optimistic add
}

export interface SentenceEntry {
  sentence: string;
  wordsUsed: string[];     // which of the student's R1 words appeared in sentence
  score: number;           // 1-5 from AI
  feedback: string;
  totalPoints: number;     // score * 2
}

export interface SpecialAwards {
  longestWord: { studentId: string; displayName: string; word: string };
  mostTopicWords: { studentId: string; displayName: string; count: number };
  bestSentence: { studentId: string; displayName: string; sentence: string; score: number };
}

export enum GamePhase {
  IDLE = 'idle',
  GENERATING = 'generating',
  ROUND1 = 'round1',
  ROUND1_ENDING = 'round1_ending',
  ROUND2 = 'round2',
  REVEALING = 'revealing',
}

export interface WordValidationResult {
  isValid: boolean;
  isTopicWord: boolean;
  hasBonusLetter: boolean;
  points: number;
  reason?: string;
}

export interface SentenceEvaluationResult {
  score: number;           // 1-5
  feedback: string;
  wordsFound: string[];
  meetsMinWords: boolean;
}

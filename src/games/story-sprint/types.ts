export interface StorySentence {
  id: string;
  studentId: string;
  studentName: string;
  text: string;
  scores: {
    grammar: number;
    creativity: number;
    flow: number;
    topicRelevance?: number;
  };
  totalScore: number;
  feedback: string;
  timestamp: number;
  isStarter?: boolean;
}

export interface AIScoreResponse {
  grammarScore: number;
  creativityScore: number;
  flowScore: number;
  topicRelevanceScore?: number;
  feedback: string;
}

export interface FinalStoryResult {
  title: string;
  overallScore: number;
  coherenceScore: number;
  creativityScore: number;
  endingScore: number;
  topicRelevance?: number;
  bestLine?: {
    text: string;
    studentName: string;
    reason: string;
  };
  summary: string;
}

export enum GameStatus {
  IDLE = 'idle',
  WRITING = 'writing',
  ANALYZING = 'analyzing',
  SHOWING_RESULT = 'showing_result',
  GENERATING_STARTER = 'generating_starter',
  ENDING = 'ending',
  FINAL_RESULTS = 'final_results',
}

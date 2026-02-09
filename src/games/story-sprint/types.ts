export interface StorySentence {
  id: string;
  studentId: string;
  studentName: string;
  text: string;
  scores: {
    grammar: number;
    creativity: number;
    flow: number;
  };
  totalScore: number;
  feedback: string;
  timestamp: number;
}

export interface AIScoreResponse {
  grammarScore: number;
  creativityScore: number;
  flowScore: number;
  feedback: string;
}

export enum GameStatus {
  IDLE = 'idle',
  WRITING = 'writing',
  ANALYZING = 'analyzing',
  SHOWING_RESULT = 'showing_result'
}

import type { InterviewLabContent, InterviewCharacter } from '../types';

// Activity states
export enum ActivityStatus {
  IDLE = 'IDLE',
  INTRO = 'INTRO',
  INTERVIEWING = 'INTERVIEWING',
  AI_RESPONSE = 'AI_RESPONSE',
  FEEDBACK = 'FEEDBACK',
  FINISHED = 'FINISHED',
}

// Register type (formal/casual)
export type RegisterType = 'formal' | 'casual';

// Interview exchange
export interface InterviewExchange {
  id: string;
  studentId: string;
  studentName: string;
  question: string;
  aiResponse: string;
  register: RegisterType;
  timestamp: number;
}

// Re-export content types
export type { InterviewLabContent, InterviewCharacter };

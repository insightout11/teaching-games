export enum GameStatus {
  IDLE = 'idle',
  PICKING_HOST = 'picking_host',
  WAITING_FOR_SECRET = 'waiting_for_secret',
  COLLECTING_QUESTIONS = 'collecting_questions',
  ANSWERING = 'answering',
  GUESSING = 'guessing',
  ENDED = 'ended',
}

export interface Question {
  id: string;
  text: string;
  askerName: string;
  askerId: string;
  answer: string | null;
  roundNumber: number;
}

export interface Guess {
  text: string;
  guesserName: string;
  guesserId: string;
  isCorrect: boolean;
  roundNumber: number;
}

/** One clear question-form choice instead of overlapping (and contradictory) booleans. */
export type QuestionStyle = 'any' | 'yesno' | 'wh';

export interface GameConstraints {
  questionStyle: QuestionStyle;
  questionLimit: number;
  turnTimerSeconds: number;
}

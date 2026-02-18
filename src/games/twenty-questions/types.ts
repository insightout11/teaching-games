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

export interface GameConstraints {
  yesNoOnly: boolean;
  wQuestionRequired: boolean;
  noYesNo: boolean;
  fullSentenceRequired: boolean;
  questionLimit: number;
  turnTimerSeconds: number;
}

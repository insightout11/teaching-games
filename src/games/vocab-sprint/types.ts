export interface GameSentence {
  sentence: string;
  weakWord: string;
  hint: string;
  level: 'easy' | 'medium' | 'hard';
  targetWord?: string; // hard rounds only: the precise term expected
}

export interface EvaluationResult {
  score: number;
  comment: string;
  isValid: boolean;
  suggestions: string[];
}

export enum GameStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  RUNNING = 'running',
  TIME_UP = 'time_up',
  EVALUATING = 'evaluating',
  FINISHED = 'finished'
}

export const ENGLISH_FACTS = [
  "The word 'set' has the most definitions in the English language (over 430!).",
  "Shakespeare invented over 1,700 words, including 'lonely', 'swagger', and 'gossip'.",
  "A 'pangram' is a sentence that uses every letter of the alphabet at least once.",
  "The most common adjective used in English is 'good'.",
  "A new word is added to the dictionary every two hours.",
  "The dot over the letter 'i' and 'j' is called a 'tittle'.",
  "'Queue' is the only word in English that is pronounced the same when the last four letters are removed.",
  "The longest word in English has 189,819 letters and takes 3.5 hours to pronounce.",
  "English is the official language of the skies; all pilots speak English regardless of origin.",
  "The word 'alphabet' comes from the first two letters of the Greek alphabet: alpha and beta.",
  "A 'contranym' is a word with two opposite meanings, like 'dust' (to remove or to add dust).",
  "The word 'clue' originally meant a ball of thread."
];

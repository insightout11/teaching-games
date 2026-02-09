import type { GamePlugin } from '../types';
import { SentenceScrambleGame } from './game';

export const sentenceScramblePlugin: GamePlugin = {
  key: 'sentence-scramble',
  name: 'Sentence Scramble',
  description: 'Tap words to build sentences in the correct order',
  skills: ['Grammar', 'Sentence Structure', 'Reading'],
  component: SentenceScrambleGame,
  configSchema: [
    {
      key: 'difficulty',
      label: 'Difficulty',
      type: 'select',
      options: [
        { label: 'Easy (4-6 words)', value: 'easy' },
        { label: 'Medium (6-8 words)', value: 'medium' },
        { label: 'Hard (8-12 words)', value: 'hard' },
      ],
      default: 'medium',
    },
  ],
  maxPointsPerTurn: 10,
};

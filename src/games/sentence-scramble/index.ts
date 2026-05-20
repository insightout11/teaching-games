import type { GamePlugin } from '../types';
import { SentenceScrambleGame } from './game';
import { PenLine } from 'lucide-react';

export const sentenceScramblePlugin: GamePlugin = {
  key: 'sentence-scramble',
  name: 'Sentence Scramble',
  description: 'Tap words to build sentences in the correct order',
  category: 'grammar-writing',
  pppStage: 'practice',
  icon: PenLine,
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
  defaultTimerSeconds: 30,
  estimatedMinutes: 8,
  scoringProfile: { displayMode: 'competitive', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
};

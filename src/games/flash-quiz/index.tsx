import { Zap } from 'lucide-react';
import type { GamePlugin } from '../types';
import { FlashQuizGame } from './game';

export const flashQuizPlugin: GamePlugin = {
  key: 'flash-quiz',
  name: 'Flash Quiz',
  description: 'topic-generated quiz race. All students answer simultaneously — speed and accuracy both earn points.',
  category: 'quiz',
  pppStage: 'practice',
  icon: Zap,
  skills: ['Critical Thinking', 'Vocabulary', 'Grammar'],
  component: FlashQuizGame,
  configSchema: [
    {
      key: 'questionCount',
      label: 'Number of Questions',
      type: 'select',
      options: [
        { label: '10 questions (~12 min)', value: '10' },
        { label: '20 questions (~25 min)', value: '20' },
      ],
      default: '10',
    },
  ],
  maxPointsPerTurn: 125,
  defaultTimerSeconds: 30,
  estimatedMinutes: 12,
};

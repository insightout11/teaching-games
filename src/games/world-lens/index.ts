import { Globe2 } from 'lucide-react';
import type { GamePlugin } from '../types';
import { WorldLensGame } from './game';

export const worldLensPlugin: GamePlugin = {
  key: 'world-lens',
  name: 'World Lens',
  description: 'Guess real places from image clues, then reveal pins on a world map.',
  category: 'quiz',
  pppStage: 'practice',
  icon: Globe2,
  skills: ['Geography', 'Observation', 'Critical Thinking', 'Culture'],
  component: WorldLensGame,
  configSchema: [
    {
      key: 'roundCount',
      label: 'Number of Rounds',
      type: 'select',
      options: [
        { label: '3 rounds (~8 min)', value: '3' },
        { label: '5 rounds (~12 min)', value: '5' },
        { label: '8 rounds (~18 min)', value: '8' },
      ],
      default: '5',
    },
  ],
  maxPointsPerTurn: 7,
  defaultTimerSeconds: 0,
  estimatedMinutes: 12,
  scoringProfile: {
    displayMode: 'competitive',
    supportsOnTask: true,
    supportsStandout: true,
    tracksAccuracy: false,
    defaultOutcome: 'genuine',
  },
};

import { Radar } from 'lucide-react';
import type { GamePlugin } from '../types';
import { RadarFixGame } from './game';

export const radarFixPlugin: GamePlugin = {
  key: 'radar-fix',
  name: 'Radar Fix',
  description: 'Plot cities on a world radar map, then reveal the closest positions.',
  category: 'quiz',
  pppStage: 'practice',
  icon: Radar,
  skills: ['Geography', 'Critical Thinking', 'Observation'],
  component: RadarFixGame,
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
  maxPointsPerTurn: 5000,
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

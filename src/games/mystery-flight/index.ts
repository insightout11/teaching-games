import type { GamePlugin } from '../types';
import { MysteryFlightGame } from './game';
import { Plane } from 'lucide-react';

export const mysteryFlightPlugin: GamePlugin = {
  key: 'mystery-flight',
  name: 'Mystery Flight',
  description: 'Fly to a secret city: clues arrive one at a time (weather, food, a photo, culture…). Talk it through, then pin it on your phone. Early and close wins.',
  category: 'quiz',
  pppStage: 'practice',
  icon: Plane,
  skills: ['Speaking', 'Listening', 'Reasoning', 'Culture'],
  component: MysteryFlightGame,
  configSchema: [
    {
      key: 'roundCount',
      label: 'Number of flights',
      type: 'select',
      options: [
        { label: '3 flights (~12 min)', value: '3' },
        { label: '5 flights (~20 min)', value: '5' },
      ],
      default: '3',
    },
  ],
  maxPointsPerTurn: 12,
  defaultTimerSeconds: 0,
  estimatedMinutes: 12,
  scoringProfile: { displayMode: 'competitive', supportsOnTask: true, supportsStandout: true, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 2, max: null },
  deviceFree: false,
};

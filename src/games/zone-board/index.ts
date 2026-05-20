import type { GamePlugin } from '../types';
import { ZoneBoardGame } from './game';
import { LayoutGrid } from 'lucide-react';

export const zoneBoardPlugin: GamePlugin = {
  key: 'zone-board',
  name: 'Zone Board',
  description: 'Race to the finish! Shoot your puck through the course, answer questions, and dodge traps.',
  category: 'quiz',
  pppStage: 'practice',
  icon: LayoutGrid,
  skills: ['Recall', 'Teamwork', 'Listening'],
  component: ZoneBoardGame,
  configSchema: [
    {
      key: 'numberOfTeams',
      label: 'Number of Teams',
      type: 'select',
      options: [
        { label: '2 Teams', value: '2' },
        { label: '3 Teams', value: '3' },
        { label: '4 Teams', value: '4' },
      ],
      default: '2',
    },
  ],
  maxPointsPerTurn: 0,
  defaultTimerSeconds: 20,
  estimatedMinutes: 20,
  scoringProfile: { displayMode: 'team', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
};

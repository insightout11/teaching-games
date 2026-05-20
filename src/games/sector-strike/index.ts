import type { GamePlugin } from '../types';
import { SectorStrikeGame } from './game';
import { LayoutGrid } from 'lucide-react';

export const sectorStrikePlugin: GamePlugin = {
  key: 'sector-strike',
  name: 'Sector Strike',
  description: 'Two teams battle to claim 4 sectors in a row on an 8×8 grid — answer questions to capture territory',
  category: 'quiz',
  pppStage: 'practice',
  icon: LayoutGrid,
  skills: ['Speaking', 'Recall', 'Teamwork'],
  component: SectorStrikeGame,
  configSchema: [
    {
      key: 'questionMode',
      label: 'Question Mode',
      type: 'select',
      options: [
        { label: 'Both (speaking & written)', value: 'both' },
        { label: 'Speaking only', value: 'speaking' },
        { label: 'Written only', value: 'written' },
      ],
      default: 'both',
    },
  ],
  maxPointsPerTurn: 10,
  defaultTimerSeconds: 1200,
  estimatedMinutes: 20,
  scoringProfile: { displayMode: 'team', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
};

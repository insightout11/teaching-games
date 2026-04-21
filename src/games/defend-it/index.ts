import type { GamePlugin } from '../types';
import { DefendItGame } from './game';
import { Flame } from 'lucide-react';

export const defendItPlugin: GamePlugin = {
  key: 'defend-it',
  name: 'Defend the Indefensible',
  description: 'Students are randomly assigned to DEFEND or ATTACK a wild statement — then compete for live audience reactions!',
  category: 'logic-puzzles',
  pppStage: 'production',
  icon: Flame,
  skills: ['Speaking', 'Persuasion', 'Critical Thinking'],
  component: DefendItGame,
  configSchema: [
    {
      key: 'roundCount',
      label: 'Number of Rounds',
      type: 'select',
      options: [
        { label: '3 Rounds', value: '3' },
        { label: '4 Rounds', value: '4' },
        { label: '5 Rounds', value: '5' },
      ],
      default: '3',
    },
  ],
  maxPointsPerTurn: 15,
  defaultTimerSeconds: 60,
  estimatedMinutes: 10,
};

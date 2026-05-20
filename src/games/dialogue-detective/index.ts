import type { GamePlugin } from '../types';
import { DialogueDetectiveGame } from './game';
import { Brain } from 'lucide-react';

export const dialogueDetectivePlugin: GamePlugin = {
  key: 'dialogue-detective',
  name: 'Dialogue Detective',
  description: 'Fill in missing conversation lines. Master pragmatics and conversational flow!',
  category: 'logic-puzzles',
  pppStage: 'practice',
  icon: Brain,
  skills: ['Speaking', 'Pragmatics', 'Context'],
  component: DialogueDetectiveGame,
  configSchema: [],
  maxPointsPerTurn: 10,
  defaultTimerSeconds: 45,
  estimatedMinutes: 10,
  scoringProfile: { displayMode: 'competitive', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
};

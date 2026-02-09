import type { GamePlugin } from '../types';
import { DialogueDetectiveGame } from './game';

export const dialogueDetectivePlugin: GamePlugin = {
  key: 'dialogue-detective',
  name: 'Dialogue Detective',
  description: 'Fill in missing conversation lines. Master pragmatics and conversational flow!',
  skills: ['Speaking', 'Pragmatics', 'Context'],
  component: DialogueDetectiveGame,
  configSchema: [],
  maxPointsPerTurn: 10,
};

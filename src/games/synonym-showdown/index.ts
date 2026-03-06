import type { GamePlugin } from '../types';
import { SynonymShowdownGame } from './game';
import { BookA } from 'lucide-react';

export const synonymShowdownPlugin: GamePlugin = {
  key: 'synonym-showdown',
  name: 'Synonym Showdown',
  description: 'Race to list synonyms before time runs out. Build streaks for bonus points!',
  category: 'vocabulary',
  pppStage: 'practice',
  icon: BookA,
  skills: ['Vocabulary', 'Speed', 'Word Knowledge'],
  component: SynonymShowdownGame,
  configSchema: [],
  maxPointsPerTurn: 10,
  defaultTimerSeconds: 30,
  estimatedMinutes: 8,
};

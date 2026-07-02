import type { ActivityPlugin } from '../types';
import { BluffDefinitionActivity } from './activity';
import { Pencil } from 'lucide-react';

export const bluffDefinitionPlugin: ActivityPlugin = {
  key: 'bluff-definition',
  name: 'Bluff Definition',
  description: 'Everyone writes a fake definition for the secret word. Can you fool the class — and spot the real one?',
  category: 'practice',
  pppStage: 'practice',
  skills: ['Vocabulary', 'Critical Thinking', 'Creativity'],
  component: BluffDefinitionActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  defaultTimerSeconds: 0,
  icon: Pencil,
  flightPlanOnly: false,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 2,
  idealStudents: { min: 4, max: null },
  deviceFree: false,
};

export { BluffDefinitionActivity };

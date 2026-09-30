import type { ActivityPlugin } from '../types';
import { TabooSprintActivity } from './activity';
import { Ban } from 'lucide-react';

export const tabooSprintPlugin: ActivityPlugin = {
  key: 'taboo-sprint',
  name: 'Taboo Sprint',
  description: 'One student describes a secret word from their phone without saying it or 4 forbidden words; the class races to guess. Everyone or two teams.',
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Listening', 'Vocabulary'],
  component: TabooSprintActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  defaultTimerSeconds: 30,
  icon: Ban,
  flightPlanOnly: false,
  scoringProfile: { displayMode: 'team', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 2,
  idealStudents: { min: 4, max: null },
  deviceFree: false,
};

export { TabooSprintActivity };

import { BookOpen } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { LanguageToolkitActivity } from './activity';

export const languageToolkitPlugin: ActivityPlugin = {
  key: 'language-toolkit',
  name: 'Language Toolkit',
  description: 'Source vocabulary in context — students pick a term and write one sentence using it.',
  category: 'practice',
  pppStage: 'practice',
  skills: ['Vocabulary', 'Speaking'],
  component: LanguageToolkitActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 5,
  defaultTimerSeconds: 0,
  icon: BookOpen,
  flightPlanOnly: true,
  scoringProfile: {
    displayMode: 'class',
    supportsOnTask: true,
    supportsStandout: true,
    tracksAccuracy: false,
    defaultOutcome: 'on-task',
  },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: true,
};

import type { ActivityPlugin } from '../types';
import { InYourWordsActivity } from './activity';
import { PenLine } from 'lucide-react';

export const inYourWordsPlugin: ActivityPlugin = {
  key: 'in-your-words',
  name: 'In Your Words',
  description: 'Students pick one of the lesson\'s key vocabulary words and write a real sentence using it — vocabulary production as the closing act.',
  category: 'closing',
  pppStage: 'landing',
  skills: ['Vocabulary', 'Speaking'],
  component: InYourWordsActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 5,
  defaultTimerSeconds: 60,
  icon: PenLine,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { InYourWordsActivity };

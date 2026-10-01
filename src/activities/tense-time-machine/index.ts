import type { ActivityPlugin } from '../types';
import { TenseTimeMachineActivity } from './activity';
import { Clock } from 'lucide-react';

export const tenseTimeMachinePlugin: ActivityPlugin = {
  key: 'tense-time-machine',
  name: 'Tense Time Machine',
  description: "The time dial swings to the past, present or future, and the class retells the same scene in that tense, one spoken sentence each. Phones show the scene, starters and a verb bank.",
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Creativity'],
  component: TenseTimeMachineActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 12,
  defaultTimerSeconds: 0,
  icon: Clock,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: true, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 2, max: null },
  deviceFree: false,
};

export { TenseTimeMachineActivity };

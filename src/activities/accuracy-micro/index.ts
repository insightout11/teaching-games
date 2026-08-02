import { Target } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { AccuracyMicroActivity } from './activity';

export const accuracyMicroPlugin: ActivityPlugin = {
  key: 'accuracy-micro',
  name: 'Accuracy Check',
  description: 'One sentence with one error — students choose the correct version, and the teacher reveals and explains. Quick check in the Flight Plan; ends after a single round.',
  category: 'practice',
  pppStage: 'practice',
  skills: ['Vocabulary', 'Critical Thinking'],
  component: AccuracyMicroActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 3,
  defaultTimerSeconds: 0,
  icon: Target,
  flightPlanOnly: true,
  scoringProfile: {
    displayMode: 'class',
    supportsOnTask: false,
    supportsStandout: false,
    tracksAccuracy: true,
  },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

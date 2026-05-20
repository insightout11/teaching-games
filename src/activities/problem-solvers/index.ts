import type { ActivityPlugin } from '../types';
import { ProblemSolversActivity } from './activity';
import { Users } from 'lucide-react';

export const problemSolversPlugin: ActivityPlugin = {
  key: 'problem-solvers',
  name: 'Problem Solvers',
  description: 'Teams brainstorm solutions with limited resources. topic-generated complications force adaptation and defense of ideas.',
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Critical Thinking', 'Collaboration', 'Creativity'],
  component: ProblemSolversActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 20,
  defaultTimerSeconds: 120,
  icon: Users,
  scoringProfile: { displayMode: 'team', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
};

export { ProblemSolversActivity };
export * from './types';

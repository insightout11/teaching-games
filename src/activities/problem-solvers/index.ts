import type { ActivityPlugin } from '../types';
import { ProblemSolversActivity } from './activity';
import { Users } from 'lucide-react';

export const problemSolversPlugin: ActivityPlugin = {
  key: 'problem-solvers',
  name: 'Problem Solvers',
  description: 'Teams brainstorm solutions with limited resources. AI introduces complications that force adaptation and defense of ideas.',
  category: 'practice',
  skills: ['Speaking', 'Critical Thinking', 'Collaboration', 'Creativity'],
  component: ProblemSolversActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 20,
  defaultTimerSeconds: 120,
  icon: Users,
};

export { ProblemSolversActivity };
export * from './types';

import type { ActivityPlugin } from '../types';
import { FinalAnswerActivity } from './activity';
import { CheckCircle } from 'lucide-react';

export const finalAnswerPlugin: ActivityPlugin = {
  key: 'final-answer',
  name: 'Final Answer',
  description: 'One prompt. Every student writes their best sentence. Instantly highlights the standouts.',
  category: 'closing',
  pppStage: 'landing',
  skills: ['Vocabulary', 'Critical Thinking'],
  component: FinalAnswerActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 4,
  defaultTimerSeconds: 60,
  icon: CheckCircle,
  flightPlanOnly: true,
};

export { FinalAnswerActivity };

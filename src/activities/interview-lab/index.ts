import type { ActivityPlugin } from '../types';
import { InterviewLabActivity } from './activity';
import { Users } from 'lucide-react';

export const interviewLabPlugin: ActivityPlugin = {
  key: 'interview-lab',
  name: 'Interview Lab',
  description: 'A smart character to interview. Practice question-forming and conversation skills with formal/casual registers.',
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Question Formation', 'Listening', 'Vocabulary'],
  component: InterviewLabActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  defaultTimerSeconds: 90,
  icon: Users,
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: true,
};

export { InterviewLabActivity };
export * from './types';

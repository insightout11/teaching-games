import type { ActivityPlugin } from '../types';
import { InterviewLabActivity } from './activity';

export const interviewLabPlugin: ActivityPlugin = {
  key: 'interview-lab',
  name: 'Interview Lab',
  description: 'AI roleplays as a character for students to interview. Practice question-forming and conversation skills with formal/casual registers.',
  category: 'practice',
  skills: ['Speaking', 'Question Formation', 'Listening', 'Vocabulary'],
  component: InterviewLabActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  icon: '🎙️',
};

export { InterviewLabActivity };
export * from './types';

import type { ActivityPlugin } from '../types';
import { ExpertPanelActivity } from './activity';
import { BookOpen } from 'lucide-react';

export const expertPanelPlugin: ActivityPlugin = {
  key: 'expert-panel',
  name: 'Expert Panel',
  description: 'Students are assigned specialist roles and answer questions from their expert perspective. AI generates follow-up questions based on responses.',
  category: 'learning',
  skills: ['Speaking', 'Vocabulary', 'Role-play', 'Critical Thinking'],
  component: ExpertPanelActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  icon: BookOpen,
};

export { ExpertPanelActivity };
export * from './types';

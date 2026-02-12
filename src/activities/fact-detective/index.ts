import type { ActivityPlugin } from '../types';
import { FactDetectiveActivity } from './activity';
import { BookOpen } from 'lucide-react';

export const factDetectivePlugin: ActivityPlugin = {
  key: 'fact-detective',
  name: 'Fact Detective',
  description: 'AI presents claims mixing true facts with plausible myths. Students discuss, predict, then learn the truth with highlighted vocabulary.',
  category: 'learning',
  skills: ['Vocabulary', 'Critical Thinking', 'Listening'],
  component: FactDetectiveActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 12,
  icon: BookOpen,
};

export { FactDetectiveActivity };
export * from './types';

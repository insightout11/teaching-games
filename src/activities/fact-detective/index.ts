import type { ActivityPlugin } from '../types';
import { FactDetectiveActivity } from './activity';
import { BookOpen } from 'lucide-react';

export const factDetectivePlugin: ActivityPlugin = {
  key: 'fact-detective',
  name: 'Fact Detective',
  description: 'topic-generated claims mixing true facts with plausible myths. Students discuss, predict, then learn the truth with highlighted vocabulary.',
  category: 'learning',
  pppStage: 'practice',
  skills: ['Vocabulary', 'Critical Thinking', 'Listening'],
  component: FactDetectiveActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 12,
  defaultTimerSeconds: 45,
  icon: BookOpen,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
};

export { FactDetectiveActivity };
export * from './types';

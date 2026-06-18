import type { ActivityPlugin } from '../types';
import { GrammarClarifyActivity } from './activity';
import { BookOpen } from 'lucide-react';

export const grammarClarifyPlugin: ActivityPlugin = {
  key: 'grammar-clarify',
  name: 'Grammar Clarify',
  description: 'A quick teach of the target structure — how it works, examples on your topic, when to use it, and a common pitfall — before the drills.',
  category: 'learning',
  pppStage: 'presentation',
  skills: ['Critical Thinking'],
  component: GrammarClarifyActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 4,
  defaultTimerSeconds: 30,
  icon: BookOpen,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
};

export { GrammarClarifyActivity };

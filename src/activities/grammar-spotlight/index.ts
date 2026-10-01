import type { ActivityPlugin } from '../types';
import { GrammarSpotlightActivity } from './activity';
import { Lightbulb } from 'lucide-react';

export const grammarSpotlightPlugin: ActivityPlugin = {
  key: 'grammar-spotlight',
  name: 'Grammar Spotlight',
  description: 'Present a grammar point three ways: Discover it (spot the pattern in sentences from your source), Watch it (a short grammar video while phones tap "Heard it!"), or Explain it (the rule card).',
  category: 'learning',
  pppStage: 'presentation',
  skills: ['Listening', 'Critical Thinking'],
  component: GrammarSpotlightActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 8,
  defaultTimerSeconds: 0,
  icon: Lightbulb,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: true,
};

export { GrammarSpotlightActivity };

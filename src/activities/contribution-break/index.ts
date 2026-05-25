import { PenLine } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { ContributionBreakActivity } from './activity';

export const contributionBreakPlugin: ActivityPlugin = {
  key: 'contribution-break',
  name: 'Contribution Break',
  description: 'Students submit one idea, question, or phrase that seeds the next stage. Teacher reviews and spotlights selected contributions.',
  category: 'practice',
  pppStage: 'practice',
  skills: ['Critical Thinking', 'Creativity'],
  component: ContributionBreakActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 3,
  defaultTimerSeconds: 0,
  icon: PenLine,
  flightPlanOnly: true,
  scoringProfile: {
    displayMode: 'class',
    supportsOnTask: true,
    supportsStandout: false,
    tracksAccuracy: false,
    defaultOutcome: 'genuine',
  },
};

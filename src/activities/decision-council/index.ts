import type { ActivityPlugin } from '../types';
import { DecisionCouncilActivity } from './activity';
import { Scale } from 'lucide-react';

export const decisionCouncilPlugin: ActivityPlugin = {
  key: 'decision-council',
  name: 'Decision Council',
  description: 'Students propose, defend, challenge, and vote on the strongest solution using source material.',
  category: 'debate',
  pppStage: 'production',
  skills: ['Speaking', 'Critical Thinking', 'Debate', 'Persuasion', 'Collaboration'],
  component: DecisionCouncilActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 12,
  defaultTimerSeconds: 120,
  icon: Scale,
  scoringProfile: {
    displayMode: 'class',
    supportsOnTask: true,
    supportsStandout: true,
    tracksAccuracy: false,
    defaultOutcome: 'genuine',
  },
};

export { DecisionCouncilActivity };
export * from './types';

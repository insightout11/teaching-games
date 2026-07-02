import type { ActivityPlugin } from '../types';
import { ExpertPanelActivity } from './activity';
import { Users } from 'lucide-react';

export const expertPanelPlugin: ActivityPlugin = {
  key: 'expert-panel',
  name: 'Expert Panel',
  description: 'Talk-show panel: 3 experts answer 6 questions in rotation with optional audience vote.',
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking', 'Role-play', 'Critical Thinking'],
  component: ExpertPanelActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  defaultTimerSeconds: 0,
  icon: Users,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 1,
  // Needs a real audience beyond the 3 panelists for the vote to mean anything —
  // shines in a full classroom, not a small group.
  idealStudents: { min: 7, max: null },
  deviceFree: false,
};

export { ExpertPanelActivity };
export * from './types';

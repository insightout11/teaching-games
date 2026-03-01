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
};

export { ExpertPanelActivity };
export * from './types';

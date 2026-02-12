import type { ActivityPlugin } from '../types';
import { ScenarioSimulatorActivity } from './activity';
import { Users } from 'lucide-react';

export const scenarioSimulatorPlugin: ActivityPlugin = {
  key: 'scenario-simulator',
  name: 'Scenario Simulator',
  description: 'Students are assigned roles in an evolving scenario. Group decisions lead to different outcomes through branching narrative.',
  category: 'practice',
  skills: ['Speaking', 'Collaboration', 'Critical Thinking', 'Role-play'],
  component: ScenarioSimulatorActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 20,
  icon: Users,
};

export { ScenarioSimulatorActivity };
export * from './types';

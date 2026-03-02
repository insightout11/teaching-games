import type { ActivityPlugin } from '../types';
import { ScenarioSimulatorActivity } from './activity';
import { Users } from 'lucide-react';

export const scenarioSimulatorPlugin: ActivityPlugin = {
  key: 'scenario-simulator',
  name: 'Scenario Simulator',
  description: 'A live group decision sprint: read dramatic lines, vote on A/B/C choices, and watch the story escalate over 5 rounds to a cinematic finale.',
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Collaboration', 'Critical Thinking'],
  component: ScenarioSimulatorActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  defaultTimerSeconds: 20,
  icon: Users,
};

export { ScenarioSimulatorActivity };
export * from './types';

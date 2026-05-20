import type { ActivityPlugin } from '../types';
import { MissionSelectorActivity } from './activity';
import { Crosshair } from 'lucide-react';

export const missionSelectorPlugin: ActivityPlugin = {
  key: 'mission-selector',
  name: 'Mission Selector',
  description: 'Students choose a personal mission question to answer by the end of the lesson.',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: ['Critical Thinking', 'Speaking'],
  component: MissionSelectorActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 4,
  defaultTimerSeconds: 30,
  icon: Crosshair,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'genuine' },
};

export { MissionSelectorActivity };

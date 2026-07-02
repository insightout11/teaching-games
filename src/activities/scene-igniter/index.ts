import type { ActivityPlugin } from '../types';
import { SceneIgniterActivity } from './activity';
import { Theater } from 'lucide-react';

export const sceneIgniterPlugin: ActivityPlugin = {
  key: 'scene-igniter',
  name: 'Scene Igniter',
  description: 'Short scripted scene — auto-assigned roles, equal speaking turns',
  category: 'icebreaker',
  pppStage: 'presentation',
  skills: ['Speaking', 'Role-play'],
  component: SceneIgniterActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 5,
  defaultTimerSeconds: 0,
  icon: Theater,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 1,
  idealStudents: { min: 2, max: 8 },
  deviceFree: true,
};

export { SceneIgniterActivity };

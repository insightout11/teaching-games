import type { ActivityPlugin } from '../types';
import { VideoPlayerActivity } from './activity';
import { Play } from 'lucide-react';

export const videoPlayerPlugin: ActivityPlugin = {
  key: 'video-player',
  name: 'Video Player',
  description: 'Watch a video together — push comprehension questions to student devices at any moment',
  category: 'learning',
  pppStage: 'presentation',
  skills: ['Listening', 'Critical Thinking'],
  component: VideoPlayerActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 10,
  defaultTimerSeconds: 30,
  icon: Play,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

export { VideoPlayerActivity };

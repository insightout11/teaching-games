import { Megaphone } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { RadioCheckActivity } from '../radio-check/activity';
export { buildTripAnnouncementContent } from './content';

// Travel v2 listening break: the city's station announcement on the Radio Check engine.
export const tripAnnouncementPlugin: ActivityPlugin = {
  key: 'trip-announcement',
  name: 'Announcement',
  description: 'Listen to a station announcement in the city and catch the platform, time and destination.',
  category: 'learning',
  pppStage: 'practice',
  skills: ['Listening'],
  component: RadioCheckActivity,
  supportsCustomTopic: false,
  estimatedMinutes: 4,
  defaultTimerSeconds: 0,
  icon: Megaphone,
  // Only meaningful inside the Travel arc (built from the destination's announcement data).
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 1, max: null },
  deviceFree: false,
};

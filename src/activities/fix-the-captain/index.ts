import type { ActivityPlugin } from '../types';
import { FixTheCaptainActivity } from './activity';
import { Megaphone } from 'lucide-react';

export const fixTheCaptainPlugin: ActivityPlugin = {
  key: 'fix-the-captain',
  name: 'Fix the Captain',
  description: "The captain's cabin announcements each hide one grammar mistake. Tap \"Found it!\" on your phone; first in says the fix out loud. Short, funny, and built from the lesson's grammar target.",
  category: 'practice',
  pppStage: 'practice',
  skills: ['Listening', 'Speaking', 'Critical Thinking'],
  component: FixTheCaptainActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 8,
  defaultTimerSeconds: 0,
  icon: Megaphone,
  scoringProfile: { displayMode: 'competitive', supportsOnTask: true, supportsStandout: true, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 2, max: null },
  deviceFree: false,
};

export { FixTheCaptainActivity };

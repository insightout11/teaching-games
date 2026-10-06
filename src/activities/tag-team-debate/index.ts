import { Scale } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { TagTeamDebateActivity } from './activity';

// Debate v2 main event: tap-to-claim prep, then short alternating turns for everyone
// (openings, answers, closing) and a Switch Sides round. Team Debate stays in the catalogue.
export const tagTeamDebatePlugin: ActivityPlugin = {
  key: 'tag-team-debate',
  name: 'Tag-team Debate',
  description: 'Two teams, short turns, everyone speaks: openings, answers to the other side, closing, then Switch Sides.',
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking', 'Listening', 'Critical Thinking'],
  component: TagTeamDebateActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 15,
  defaultTimerSeconds: 0,
  icon: Scale,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  minStudents: 2,
  idealStudents: { min: 4, max: null },
  deviceFree: false,
};

export { TagTeamDebateActivity };

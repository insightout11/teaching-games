import { MessageSquare } from 'lucide-react';
import { ConversationRoundsActivity } from './activity';
import type { ActivityPlugin } from '../types';

export const conversationRoundsPlugin: ActivityPlugin = {
  key: 'conversation-rounds',
  name: 'Conversation Rounds',
  description: 'Two students improvise a role-play scenario while the class watches. Every student takes a turn.',
  category: 'learning',
  pppStage: 'production',
  skills: ['Speaking', 'Role-play', 'Listening'],
  component: ConversationRoundsActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 20,
  defaultTimerSeconds: 0,
  icon: MessageSquare,
  flightPlanOnly: false,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: false, tracksAccuracy: false, defaultOutcome: 'on-task' },
  // Two-role paired dialogue — with one student, both roles resolve to the same
  // person, so this genuinely needs a second student.
  minStudents: 2,
  idealStudents: { min: 2, max: null },
  deviceFree: false,
};

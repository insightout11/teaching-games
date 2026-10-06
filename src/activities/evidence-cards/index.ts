import { FileSearch } from 'lucide-react';
import type { ActivityPlugin } from '../types';
import { EvidenceCardsActivity } from './activity';

// Debate v2 evidence stage: sort real, sourced facts FOR / AGAINST the motion, then vote the strongest.
export const evidenceCardsPlugin: ActivityPlugin = {
  key: 'evidence-cards',
  name: 'Evidence Cards',
  description: 'Real, sourced facts about the motion: does each help FOR or AGAINST? Then the class picks the strongest.',
  category: 'learning',
  pppStage: 'presentation',
  skills: ['Critical Thinking', 'Speaking'],
  component: EvidenceCardsActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 8,
  defaultTimerSeconds: 0,
  icon: FileSearch,
  flightPlanOnly: true,
  scoringProfile: { displayMode: 'class', supportsOnTask: false, supportsStandout: false, tracksAccuracy: true },
  minStudents: 1,
  idealStudents: { min: 2, max: null },
  deviceFree: false,
};

export { EvidenceCardsActivity };

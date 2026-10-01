import type { ActivityPlugin } from '../types';
import { AnswerFirstActivity } from './activity';
import { MessageCircleQuestion } from 'lucide-react';

export const answerFirstPlugin: ActivityPlugin = {
  key: 'answer-first',
  name: 'Answer First',
  description: "The screen shows an answer (\"At 7 o'clock.\"); when it's your turn, ask a question that fits, out loud. Phones show question words and patterns.",
  category: 'practice',
  pppStage: 'production',
  skills: ['Speaking', 'Question Formation'],
  component: AnswerFirstActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 10,
  defaultTimerSeconds: 0,
  icon: MessageCircleQuestion,
  scoringProfile: { displayMode: 'class', supportsOnTask: true, supportsStandout: true, tracksAccuracy: false, defaultOutcome: 'genuine' },
  minStudents: 1,
  idealStudents: { min: 2, max: null },
  deviceFree: false,
};

export { AnswerFirstActivity };

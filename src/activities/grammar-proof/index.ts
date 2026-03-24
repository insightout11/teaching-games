import type { ActivityPlugin } from '../types';
import { GrammarProofActivity } from './activity';
import { CheckSquare } from 'lucide-react';

export const grammarProofPlugin: ActivityPlugin = {
  key: 'grammar-proof',
  name: 'Grammar Proof',
  description: 'Students write 2 sentences using the target grammar — AI scores for that structure specifically',
  category: 'closing',
  pppStage: 'landing',
  skills: ['Vocabulary', 'Critical Thinking'],
  component: GrammarProofActivity,
  supportsCustomTopic: true,
  estimatedMinutes: 5,
  defaultTimerSeconds: 60,
  icon: CheckSquare,
};

export { GrammarProofActivity };

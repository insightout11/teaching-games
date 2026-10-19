import type { InputSpec } from '@/lib/input-spec';
import type { RankItChallenge } from './types';

export function rankItPhoneSpec(challenge: RankItChallenge, again: boolean): InputSpec {
  return {
    type: 'ranking', gameKey: 'rank-it',
    prompt: again ? `New evidence! Rank again: ${challenge.prompt}` : challenge.prompt,
    options: challenge.items.map(item => item.name),
    context: again ? challenge.items.filter(item => item.hiddenFact).map(item => ({ text: `${item.name}: ${item.hiddenFact}` })) : undefined,
  };
}

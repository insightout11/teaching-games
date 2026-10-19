import type { InputSpec } from '@/lib/input-spec';

export function councilChallengePhoneSpec(question: string, cards: Array<{ label: string; proposal: { text: string } }>): InputSpec {
  return {
    type: 'choice', gameKey: 'decision-council', prompt: 'Where should the discussion go next?',
    instruction: 'Choose one discussion signal',
    context: [{ text: question }, ...cards.map(({ label, proposal }) => ({ text: `${label}: ${proposal.text}` }))],
    options: cards.flatMap(({ label }) => [`support:${label}`, `challenge:${label}`, `evidence:${label}`]),
    optionLabels: cards.flatMap(({ label, proposal }) => {
      const short = proposal.text.length > 100 ? proposal.text.slice(0, 97) + '…' : proposal.text;
      return [`Support ${label}: ${short}`, `Challenge ${label}: ${short}`, `Need evidence ${label}: ${short}`];
    }),
  };
}

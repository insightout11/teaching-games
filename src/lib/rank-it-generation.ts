import type { RankItContent } from '@/activities/types';
import type { AISchema } from '@/lib/ai';
import type { SourceGroundingContract } from '@/lib/source-grounding';
import { validateGroundedStrings } from '@/lib/source-grounding';

type RawRankIt = { challenges: RankItContent['challenges'] };

function stringsFromRankIt(content: RawRankIt): string[] {
  return (content.challenges ?? []).flatMap((challenge) => [
    challenge.prompt,
    challenge.correctRationale ?? '',
    ...challenge.items.flatMap((item) => [item.name, item.hiddenFact]),
  ]);
}

export function validateGroundedRankIt(
  content: RawRankIt,
  contract: SourceGroundingContract | null,
): { valid: boolean; reason?: string } {
  if (!Array.isArray(content.challenges) || content.challenges.length === 0) {
    return { valid: false, reason: 'No ranking challenges were generated.' };
  }
  if (content.challenges.some((challenge) => !Array.isArray(challenge.items) || challenge.items.length < 3)) {
    return { valid: false, reason: 'Every ranking challenge needs at least three items.' };
  }
  return validateGroundedStrings(stringsFromRankIt(content), contract);
}

function sourceFallback(contract: SourceGroundingContract, topic: string): RankItContent {
  const terms = contract.terms.filter((term) => term.length >= 4).slice(0, 5);
  const items = (terms.length >= 3 ? terms : ['source', 'detail', 'example']).map((term, index) => ({
    id: `source-${index + 1}`,
    name: term.charAt(0).toUpperCase() + term.slice(1),
    hiddenFact: `This word or detail appears in ${contract.title}.`,
  }));
  return {
    activityKey: 'rank-it',
    topicContext: topic,
    challenges: [{
      id: 'source-priority',
      prompt: `Rank these details from ${contract.title} by importance.`,
      items,
    }],
  };
}

export async function generateGroundedRankIt(options: {
  topic: string;
  prompt: string;
  schema: AISchema;
  contract: SourceGroundingContract | null;
  generate: (prompt: string, schema: AISchema) => Promise<RawRankIt>;
}): Promise<RankItContent> {
  const first = await options.generate(options.prompt, options.schema);
  const firstCheck = validateGroundedRankIt(first, options.contract);
  if (firstCheck.valid || !options.contract) {
    return { activityKey: 'rank-it', topicContext: options.topic, challenges: first.challenges };
  }

  const correction = `${options.prompt}\n\nCORRECTION REQUIRED: The previous output was rejected: ${firstCheck.reason} Every item name and hidden fact must clearly reuse people, foods, objects, actions, or facts from "${options.contract.title}". Do not use unrelated generic objects.`;
  try {
    const corrected = await options.generate(correction, options.schema);
    if (validateGroundedRankIt(corrected, options.contract).valid) {
      return { activityKey: 'rank-it', topicContext: options.topic, challenges: corrected.challenges };
    }
  } catch {
    // A bounded retry may fail independently; the source-derived fallback stays playable.
  }
  return sourceFallback(options.contract, options.topic);
}

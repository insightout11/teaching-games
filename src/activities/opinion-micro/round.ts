import type { InputSpec } from '@/lib/input-spec';
import type { OpinionMicroContent } from './types';

export interface OpinionMicroActivityInstance {
  id: string;
  startedAt: number;
}

export function createOpinionMicroActivityInstance(
  startedAt: number,
  sequence: number,
): OpinionMicroActivityInstance {
  return {
    id: `opinion-micro:${startedAt}:${sequence}`,
    startedAt,
  };
}

export function opinionMicroRoundId(instanceId: string): string {
  return `${instanceId}:vote`;
}

export function buildOpinionMicroInputSpec(
  dilemma: OpinionMicroContent['dilemma'],
  instance: OpinionMicroActivityInstance,
): InputSpec {
  return {
    type: 'binary',
    gameKey: 'opinion-micro',
    prompt: 'Would you rather...',
    options: [dilemma.optionA, dilemma.optionB],
    optionLabels: ['A', 'B'],
    activityInstanceId: instance.id,
    activityInstanceStartedAt: instance.startedAt,
    activitySequence: 0,
    roundId: opinionMicroRoundId(instance.id),
  };
}

export function isOpinionMicroVoteForRound(
  voteRoundId: string | null | undefined,
  activeRoundId: string,
): boolean {
  return !voteRoundId || voteRoundId === activeRoundId;
}

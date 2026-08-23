import { describe, expect, it } from 'vitest';
import {
  buildOpinionMicroInputSpec,
  createOpinionMicroActivityInstance,
  isOpinionMicroVoteForRound,
} from './round';

const dilemma = {
  optionA: 'Repair the bicycle',
  optionB: 'Replace it',
  discussionPrompt: 'Which choice is better for the community?',
};

describe('Opinion Pulse round identity', () => {
  it('exposes one stable active round to refreshing students', () => {
    const instance = createOpinionMicroActivityInstance(1_000, 1);
    const first = buildOpinionMicroInputSpec(dilemma, instance);
    const refresh = buildOpinionMicroInputSpec(dilemma, instance);

    expect(refresh.roundId).toBe(first.roundId);
    expect(refresh.activityInstanceId).toBe(first.activityInstanceId);
  });

  it('rejects a vote from an older same-type restart', () => {
    const oldRound = buildOpinionMicroInputSpec(
      dilemma,
      createOpinionMicroActivityInstance(1_000, 1),
    ).roundId!;
    const restartedRound = buildOpinionMicroInputSpec(
      dilemma,
      createOpinionMicroActivityInstance(2_000, 2),
    ).roundId!;

    expect(restartedRound).not.toBe(oldRound);
    expect(isOpinionMicroVoteForRound(oldRound, restartedRound)).toBe(false);
    expect(isOpinionMicroVoteForRound(restartedRound, restartedRound)).toBe(true);
  });
});

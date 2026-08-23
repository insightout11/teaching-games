import { describe, expect, it } from 'vitest';
import {
  getActivityInstanceIdentity,
  getInputSpecRevision,
  shouldApplyActivityInstanceUpdate,
  type InputSpec,
} from '@/lib/input-spec';

function promptSpec(instance: number, prompt: number): InputSpec {
  const id = `quick-pulse:${instance}:1`;
  return {
    type: prompt === 1 ? 'binary' : 'choice',
    gameKey: 'quick-pulse',
    prompt: `Prompt ${prompt}`,
    activityInstanceId: id,
    activityInstanceStartedAt: instance,
    activitySequence: (prompt - 1) * 2,
    roundId: `${id}:prompt-${prompt}`,
  };
}

describe('Quick Pulse activity instance ordering', () => {
  it('distinguishes a same-type restart after completion', () => {
    const completedRun = promptSpec(100, 1);
    const restartedRun = promptSpec(200, 1);

    expect(getInputSpecRevision(restartedRun)).not.toBe(getInputSpecRevision(completedRun));
    expect(shouldApplyActivityInstanceUpdate(
      getActivityInstanceIdentity(completedRun),
      getActivityInstanceIdentity(restartedRun),
    )).toBe(true);
  });

  it('rejects an event from the previous activity instance after restart', () => {
    const previous = getActivityInstanceIdentity(promptSpec(100, 3));
    const restarted = getActivityInstanceIdentity(promptSpec(200, 1));

    expect(shouldApplyActivityInstanceUpdate(restarted, previous)).toBe(false);
  });

  it('rejects a delayed active prompt after that prompt was cleared for reveal', () => {
    const active = getActivityInstanceIdentity(promptSpec(100, 1))!;
    const revealed = { ...active, sequence: active.sequence + 1 };

    expect(shouldApplyActivityInstanceUpdate(revealed, active)).toBe(false);
  });
});

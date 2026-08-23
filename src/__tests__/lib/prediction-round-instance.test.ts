import { describe, expect, it } from 'vitest';
import {
  getActivityInstanceIdentity,
  getInputSpecRevision,
  shouldApplyActivityInstanceUpdate,
  type InputSpec,
} from '@/lib/input-spec';
import { validateRoundSubmission, verifiedParticipantStudentId } from '@/lib/direct-submission';

function question(instance: number, index: number): InputSpec {
  const id = `prediction-round:${instance}:1`;
  return {
    type: 'binary',
    gameKey: 'prediction-round',
    prompt: `Question ${index}`,
    activityInstanceId: id,
    activityInstanceStartedAt: instance,
    activitySequence: (index - 1) * 2,
    roundId: `${id}:question-${index}`,
  };
}

describe('Prediction Round instance and submission identity', () => {
  it('distinguishes a restart and rejects a previous-instance event', () => {
    const prior = question(100, 3);
    const restarted = question(200, 1);
    expect(getInputSpecRevision(restarted)).not.toBe(getInputSpecRevision(prior));
    expect(shouldApplyActivityInstanceUpdate(
      getActivityInstanceIdentity(restarted),
      getActivityInstanceIdentity(prior),
    )).toBe(false);
  });

  it('accepts only the authoritative open question identity', () => {
    const active = question(100, 2);
    expect(validateRoundSubmission(active, {
      gameKey: active.gameKey, inputType: active.type, roundId: active.roundId,
    })).toBeNull();
    expect(validateRoundSubmission(active, {
      gameKey: active.gameKey, inputType: active.type, roundId: question(100, 1).roundId,
    })).toBe('Stale round identity');
    expect(validateRoundSubmission(null, {
      gameKey: active.gameKey, inputType: active.type, roundId: active.roundId,
    })).toBe('Response window is closed');
  });

  it('allows only a matching registered identity through the stale-session exception', () => {
    expect(verifiedParticipantStudentId({ student_id: 'student-1' }, 'student-1')).toEqual({
      allowed: true, studentId: 'student-1',
    });
    expect(verifiedParticipantStudentId({ student_id: 'student-1' }, 'student-2').allowed).toBe(false);
    expect(verifiedParticipantStudentId(null, null).allowed).toBe(false);
  });
});
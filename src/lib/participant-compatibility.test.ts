import { describe, expect, it } from 'vitest';
import { compatibleParticipantItems, isParticipantCompatible, participantRequirementLabel } from './participant-compatibility';

const options = [
  { key: 'flash-quiz', minStudents: 1 },
  { key: 'imposter', minStudents: 3 },
  { key: 'password', minStudents: 4 },
  { key: 'pair-only', minStudents: 2, maxStudents: 2 },
];

describe('participant compatibility', () => {
  it.each([
    [1, ['flash-quiz']],
    [2, ['flash-quiz', 'pair-only']],
    [3, ['flash-quiz', 'imposter']],
    [8, ['flash-quiz', 'imposter', 'password']],
  ])('filters automatic pools for %i joined students', (count, expected) => {
    expect(compatibleParticipantItems(options, count).map((item) => item.key)).toEqual(expected);
  });

  it('supports typed hard maximums and visible requirement copy', () => {
    expect(isParticipantCompatible(options[3], 3)).toBe(false);
    expect(participantRequirementLabel(options[3])).toBe('Requires exactly 2 students');
    expect(participantRequirementLabel(options[2])).toBe('Requires 4+ students');
  });
});

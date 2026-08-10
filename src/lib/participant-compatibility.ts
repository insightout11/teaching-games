export interface ParticipantRequirement {
  minStudents: number;
  maxStudents?: number | null;
}

export function isParticipantCompatible(
  requirement: ParticipantRequirement,
  participantCount: number,
): boolean {
  if (participantCount < requirement.minStudents) return false;
  return requirement.maxStudents == null || participantCount <= requirement.maxStudents;
}

export function participantRequirementLabel(requirement: ParticipantRequirement): string {
  if (requirement.maxStudents != null) {
    return requirement.minStudents === requirement.maxStudents
      ? `Requires exactly ${requirement.minStudents} students`
      : `Requires ${requirement.minStudents}-${requirement.maxStudents} students`;
  }
  return requirement.minStudents > 1 ? `Requires ${requirement.minStudents}+ students` : 'Works with 1+ students';
}

export function compatibleParticipantItems<T extends ParticipantRequirement>(
  items: readonly T[],
  participantCount: number,
): T[] {
  return items.filter((item) => isParticipantCompatible(item, participantCount));
}

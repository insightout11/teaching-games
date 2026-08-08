export function getActivityInstanceKey(
  slotIndex: number,
  slotIdentity: string | null | undefined,
  activityKey: string,
): string {
  return `lesson-slot:${slotIndex}:${slotIdentity ?? activityKey}:${activityKey}`;
}

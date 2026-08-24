const PREFIX = 'destinationBriefingDismissed';

export function destinationBriefingStorageKey(
  sessionId: string,
  destinationId: string,
  slotIndex: number,
): string {
  return `${PREFIX}:${sessionId}:${destinationId}:${slotIndex}`;
}

export function readDestinationBriefingDismissed(storage: Pick<Storage, 'getItem'>, key: string): boolean {
  try {
    return storage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export function writeDestinationBriefingDismissed(storage: Pick<Storage, 'setItem'>, key: string): void {
  try {
    storage.setItem(key, 'true');
  } catch {
    // Lesson recovery is best-effort; blocked storage must not interrupt class.
  }
}

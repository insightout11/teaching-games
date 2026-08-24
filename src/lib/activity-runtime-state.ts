export interface ActivityRuntimeSnapshot<T = unknown> {
  version: 1;
  state: T;
  updatedAt: number;
}

const MAX_SNAPSHOT_AGE_MS = 12 * 60 * 60 * 1000;

export function activityRuntimeStorageKey(sessionId: string, activityKey: string): string {
  return `activityRuntime:${sessionId}:${activityKey}`;
}

export function parseActivityRuntimeSnapshot<T = unknown>(
  value: string | null | undefined,
  now = Date.now(),
): ActivityRuntimeSnapshot<T> | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<ActivityRuntimeSnapshot<T>>;
    if (parsed.version !== 1 || parsed.state == null) return null;
    if (typeof parsed.updatedAt !== 'number') return null;
    if (now < parsed.updatedAt || now - parsed.updatedAt > MAX_SNAPSHOT_AGE_MS) return null;
    return parsed as ActivityRuntimeSnapshot<T>;
  } catch {
    return null;
  }
}

export function readActivityRuntimeState<T = unknown>(
  sessionId: string | null,
  activityKey: string,
): T | null {
  if (typeof window === 'undefined' || !sessionId) return null;
  try {
    return parseActivityRuntimeSnapshot<T>(
      localStorage.getItem(activityRuntimeStorageKey(sessionId, activityKey)),
    )?.state ?? null;
  } catch {
    return null;
  }
}

export function writeActivityRuntimeState(
  sessionId: string | null,
  activityKey: string,
  state: unknown,
): void {
  if (typeof window === 'undefined' || !sessionId) return;
  try {
    localStorage.setItem(activityRuntimeStorageKey(sessionId, activityKey), JSON.stringify({
      version: 1,
      state,
      updatedAt: Date.now(),
    } satisfies ActivityRuntimeSnapshot));
  } catch {
    // Recovery is best-effort; never interrupt a live lesson for blocked storage.
  }
}

export function clearActivityRuntimeState(sessionId: string | null, activityKey: string): void {
  if (typeof window === 'undefined' || !sessionId) return;
  try {
    localStorage.removeItem(activityRuntimeStorageKey(sessionId, activityKey));
  } catch {
    // Recovery is best-effort; never interrupt a live lesson for blocked storage.
  }
}


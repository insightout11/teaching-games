import type { LessonSlot } from '@/lib/lesson-plan-payload';

export type RecoverableLessonPhase = 'mission-select' | 'live' | 'landing';

export interface LessonRuntimeSnapshot {
  version: 1;
  phase: RecoverableLessonPhase;
  currentSlotIndex: number;
  lessonSlots: LessonSlot[];
  updatedAt: number;
}

const MAX_SNAPSHOT_AGE_MS = 12 * 60 * 60 * 1000;

export function lessonRuntimeStorageKey(sessionId: string): string {
  return `lessonRuntime:${sessionId}`;
}

export function parseLessonRuntimeSnapshot(
  value: string | null | undefined,
  fallbackSlots: LessonSlot[],
  now = Date.now(),
): LessonRuntimeSnapshot | null {
  if (!value || fallbackSlots.length === 0) return null;

  try {
    const parsed = JSON.parse(value) as Partial<LessonRuntimeSnapshot>;
    if (parsed.version !== 1) return null;
    if (!['mission-select', 'live', 'landing'].includes(parsed.phase ?? '')) return null;
    if (!Number.isInteger(parsed.currentSlotIndex) || (parsed.currentSlotIndex ?? -1) < 0) return null;
    if (typeof parsed.updatedAt !== 'number' || now - parsed.updatedAt > MAX_SNAPSHOT_AGE_MS) return null;

    const lessonSlots = Array.isArray(parsed.lessonSlots) && parsed.lessonSlots.length === fallbackSlots.length
      ? parsed.lessonSlots
      : fallbackSlots;
    const currentSlotIndex = Math.min(parsed.currentSlotIndex ?? 0, lessonSlots.length - 1);

    return {
      phase: parsed.phase as RecoverableLessonPhase,
      version: 1,
      currentSlotIndex,
      lessonSlots,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function readLessonRuntimeSnapshot(
  sessionId: string,
  fallbackSlots: LessonSlot[],
): LessonRuntimeSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    return parseLessonRuntimeSnapshot(
      localStorage.getItem(lessonRuntimeStorageKey(sessionId)),
      fallbackSlots,
    );
  } catch {
    return null;
  }
}

export function writeLessonRuntimeSnapshot(sessionId: string, snapshot: LessonRuntimeSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(lessonRuntimeStorageKey(sessionId), JSON.stringify(snapshot));
  } catch {
    // Recovery is best-effort; never interrupt a live lesson for blocked storage.
  }
}

export function clearLessonRuntimeSnapshot(sessionId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(lessonRuntimeStorageKey(sessionId));
  } catch {
    // Recovery is best-effort; never interrupt a live lesson for blocked storage.
  }
}

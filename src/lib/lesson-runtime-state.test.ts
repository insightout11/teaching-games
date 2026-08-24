import { describe, expect, it } from 'vitest';
import { parseLessonRuntimeSnapshot } from '@/lib/lesson-runtime-state';
import type { LessonSlot } from '@/lib/lesson-plan-payload';

const slots: LessonSlot[] = [
  { key: 'prediction-round', name: 'Prediction Round', type: 'activity' },
  { key: 'grid-rush', name: 'GridRush', type: 'game' },
];

describe('lesson runtime recovery', () => {
  it('restores the active slot and resolved slot list', () => {
    const resolved = [{ ...slots[0] }, { ...slots[1], name: 'GridRush: Sentence Showdown' }];
    expect(parseLessonRuntimeSnapshot(JSON.stringify({
      version: 1,
      phase: 'live',
      currentSlotIndex: 1,
      lessonSlots: resolved,
      updatedAt: 1_000,
    }), slots, 2_000)).toMatchObject({
      phase: 'live',
      currentSlotIndex: 1,
      lessonSlots: resolved,
    });
  });

  it('rejects stale or non-live snapshots', () => {
    expect(parseLessonRuntimeSnapshot(JSON.stringify({
      version: 1,
      phase: 'lobby', currentSlotIndex: 0, lessonSlots: slots, updatedAt: 1_000,
    }), slots, 2_000)).toBeNull();
    expect(parseLessonRuntimeSnapshot(JSON.stringify({
      version: 1,
      phase: 'live', currentSlotIndex: 0, lessonSlots: slots, updatedAt: 1_000,
    }), slots, 50_000_000)).toBeNull();
  });
});

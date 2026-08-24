import { describe, expect, it } from 'vitest';
import { parseActivityRuntimeSnapshot } from '@/lib/activity-runtime-state';

describe('activity runtime recovery', () => {
  it('restores an in-progress activity payload', () => {
    expect(parseActivityRuntimeSnapshot(JSON.stringify({
      version: 1,
      state: { phase: 'revealing', currentIndex: 1, votes: { 1: { mia: '4' } } },
      updatedAt: 1_000,
    }), 2_000)).toEqual({
      version: 1,
      state: { phase: 'revealing', currentIndex: 1, votes: { 1: { mia: '4' } } },
      updatedAt: 1_000,
    });
  });

  it('rejects stale, future, and malformed payloads', () => {
    expect(parseActivityRuntimeSnapshot(JSON.stringify({
      version: 1, state: { phase: 'prompting' }, updatedAt: 1_000,
    }), 50_000_000)).toBeNull();
    expect(parseActivityRuntimeSnapshot(JSON.stringify({
      version: 1, state: { phase: 'prompting' }, updatedAt: 3_000,
    }), 2_000)).toBeNull();
    expect(parseActivityRuntimeSnapshot('{broken', 2_000)).toBeNull();
  });
});


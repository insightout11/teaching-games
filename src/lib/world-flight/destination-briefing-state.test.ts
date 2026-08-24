import { describe, expect, it, vi } from 'vitest';
import {
  destinationBriefingStorageKey,
  readDestinationBriefingDismissed,
  writeDestinationBriefingDismissed,
} from './destination-briefing-state';

describe('destination briefing recovery state', () => {
  it('persists dismissal per session, destination, and first activity', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    const key = destinationBriefingStorageKey('session-1', 'shanghai', 0);

    expect(readDestinationBriefingDismissed(storage, key)).toBe(false);
    writeDestinationBriefingDismissed(storage, key);
    expect(readDestinationBriefingDismissed(storage, key)).toBe(true);
    expect(readDestinationBriefingDismissed(storage, destinationBriefingStorageKey('session-2', 'shanghai', 0))).toBe(false);
  });

  it('keeps a live lesson usable when browser storage is blocked', () => {
    const storage = {
      getItem: vi.fn(() => { throw new Error('blocked'); }),
      setItem: vi.fn(() => { throw new Error('blocked'); }),
    };

    expect(readDestinationBriefingDismissed(storage, 'key')).toBe(false);
    expect(() => writeDestinationBriefingDismissed(storage, 'key')).not.toThrow();
  });
});

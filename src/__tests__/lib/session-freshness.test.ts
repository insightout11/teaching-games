import { describe, it, expect } from 'vitest';
import { isSessionStale, SESSION_MAX_AGE_HOURS } from '@/lib/session-freshness';

describe('isSessionStale', () => {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

  it('returns false for a null started_at', () => {
    expect(isSessionStale(null)).toBe(false);
  });

  it('returns false for a fresh session', () => {
    expect(isSessionStale(hoursAgo(1))).toBe(false);
  });

  it('returns false just under the max age', () => {
    expect(isSessionStale(hoursAgo(SESSION_MAX_AGE_HOURS - 0.1))).toBe(false);
  });

  it('returns true for a session older than the max age', () => {
    expect(isSessionStale(hoursAgo(SESSION_MAX_AGE_HOURS + 1))).toBe(true);
  });

  it('returns true for a 13-hour-old session (default 12h window)', () => {
    expect(isSessionStale(hoursAgo(13))).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { defaultMinutes, deviceModeFor, readClassProfile } from '@/lib/class-profile';

describe('class profile', () => {
  it('reads a stored profile and drops junk', () => {
    expect(readClassProfile({ type: 'free-talk', screens: 'some', place: 'online', minutes: 60, age: 'teens', extra: 1 }))
      .toEqual({ type: 'free-talk', screens: 'some', place: 'online', minutes: 60, age: 'teens', gameVote: undefined });
    expect(readClassProfile({ type: 'party', minutes: 999 })).toEqual({ type: undefined, age: undefined, screens: undefined, place: undefined, minutes: undefined, gameVote: undefined });
  });
  it('a class with nothing stored has no type (works as before)', () => {
    expect(readClassProfile(null).type).toBeUndefined();
    expect(readClassProfile('x').type).toBeUndefined();
  });
  it('keeps the devices column in step', () => {
    expect(deviceModeFor('none')).toBe('shared-screen');
    expect(deviceModeFor('some')).toBe('devices');
  });
  it('Game time defaults to 20 game minutes', () => {
    expect(defaultMinutes('game-time')).toBe(20);
    expect(defaultMinutes('free-talk')).toBe(60);
  });
});

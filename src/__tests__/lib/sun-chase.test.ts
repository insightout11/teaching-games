import { describe, expect, it } from 'vitest';
import { sunChase } from '@/lib/live-room/sun';

describe('chasing the sun', () => {
  const at = new Date('2026-10-20T03:45:00Z'); // 10:45 in Bangkok
  it('is never true flying north-east (Bangkok towards Laos)', () => {
    expect(sunChase({ lat: 15, lng: 101 }, { lat: 16.2, lng: 102.4 }, at, 120000)).toBe(false);
  });
  it('is never true flying east', () => {
    expect(sunChase({ lat: 15, lng: 101 }, { lat: 15, lng: 103 }, at, 120000)).toBe(false);
  });
});

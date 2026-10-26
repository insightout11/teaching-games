import { describe, expect, it } from 'vitest';
import { assignSeats, cabinSeatLabel } from '@/lib/live-room/seats';

describe('assignSeats', () => {
  it('seats people in boarding order when nobody picked', () => {
    const cabin = assignSeats<{ id: string; seat?: number }>([{ id: 'a' }, { id: 'b' }]);
    expect(cabin.map((p) => p?.id)).toEqual(['a', 'b']);
  });
  it('keeps picked seats and fills the gaps around them', () => {
    const cabin = assignSeats([{ id: 'a' }, { id: 'b', seat: 0 }, { id: 'c', seat: 5 }, { id: 'd' }]);
    expect(cabin[0]?.id).toBe('b');
    expect(cabin[1]?.id).toBe('a');
    expect(cabin[2]?.id).toBe('d');
    expect(cabin[5]?.id).toBe('c');
    expect(cabinSeatLabel(5)).toBe('2B');
  });
  it('gives a clashing pick to the first to board; the second fills a free seat', () => {
    const cabin = assignSeats([{ id: 'a', seat: 1 }, { id: 'b', seat: 1 }]);
    expect(cabin[1]?.id).toBe('a');
    expect(cabin[0]?.id).toBe('b');
  });
});

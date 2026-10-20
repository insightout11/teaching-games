import { describe, expect, it } from 'vitest';
import { countryAt, toShapes } from '@/lib/live-room/places-below';
import type { Ring } from '@/lib/live-room/land-outlines';

// A Fiji-like country on both sides of the 180° line, and a block of Australia.
const fiji: Ring = [[177, -16], [180, -16], [180, -19], [177, -19], [177, -16]];
const fijiEast: Ring = [[-180, -16], [-179, -16], [-179, -19], [-180, -19], [-180, -16]];
const australia: Ring = [[114, -12], [153, -12], [153, -38], [114, -38], [114, -12]];
const shapes = toShapes([['Fiji', [fiji, fijiEast]], ['Australia', [australia]]]);

describe('countries across the 180° line', () => {
  it('does not put Fiji under central Australia', () => {
    expect(countryAt(shapes, { lat: -18, lng: 125 })).toBe('Australia');
  });
  it('still finds Fiji on both sides of the line', () => {
    expect(countryAt(shapes, { lat: -17.5, lng: 178 })).toBe('Fiji');
    expect(countryAt(shapes, { lat: -17.5, lng: -179.5 })).toBe('Fiji');
  });
});

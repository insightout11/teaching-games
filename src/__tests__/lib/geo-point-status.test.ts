import { describe, expect, it } from 'vitest';
import { formatGeoPositionStatus } from '@/lib/geo-point-status';

describe('Radar Fix position status', () => {
  it('never shows unselected copy after a response is locked', () => {
    expect(formatGeoPositionStatus(null, true)).toBe('Position saved');
  });

  it('shows empty and coordinate states before lock', () => {
    expect(formatGeoPositionStatus(null, false)).toBe('No position selected');
    expect(formatGeoPositionStatus({ lat: 25.2, lng: 55.3 }, false)).toBe('25.2 deg N, 55.3 deg E');
  });
});

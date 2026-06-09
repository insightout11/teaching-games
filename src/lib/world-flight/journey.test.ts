import { describe, expect, it } from 'vitest';
import { parseWorldFlightLaunchContext, resolveWorldFlightMovement } from '@/lib/world-flight/journey';

describe('World Flight journey movement', () => {
  it('allows any destination to establish a class first location', () => {
    expect(resolveWorldFlightMovement({
      originDestinationId: null,
      destinationId: 'sydney',
      distanceKm: 0,
      rangeKm: 5200,
      requestedMove: true,
    })).toEqual({
      isFirstFlight: true,
      isWithinRange: true,
      movesClass: true,
    });
  });

  it('moves an established class only for an in-range flight', () => {
    expect(resolveWorldFlightMovement({
      originDestinationId: 'tokyo',
      destinationId: 'seoul',
      distanceKm: 1150,
      rangeKm: 5200,
      requestedMove: true,
    }).movesClass).toBe(true);

    expect(resolveWorldFlightMovement({
      originDestinationId: 'tokyo',
      destinationId: 'paris',
      distanceKm: 9710,
      rangeKm: 5200,
      requestedMove: true,
    })).toMatchObject({
      isFirstFlight: false,
      isWithinRange: false,
      movesClass: false,
    });
  });

  it('keeps a reachable lesson stationary when movement is not requested', () => {
    expect(resolveWorldFlightMovement({
      originDestinationId: 'tokyo',
      destinationId: 'seoul',
      distanceKm: 1150,
      rangeKm: 5200,
      requestedMove: false,
    }).movesClass).toBe(false);
  });

  it('rejects malformed launch context', () => {
    expect(parseWorldFlightLaunchContext({ destinationId: 'tokyo' })).toBeNull();
    expect(parseWorldFlightLaunchContext({
      destinationId: 'tokyo',
      focusId: 'rail',
      requestedMove: true,
    })).toEqual({
      destinationId: 'tokyo',
      focusId: 'rail',
      requestedMove: true,
    });
  });
});


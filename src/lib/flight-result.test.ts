import { describe, expect, it } from 'vitest';
import { flightResultLine, formatMeasure, sanitizeFlightResult } from './flight-result';

describe('flight results', () => {
  const raw = {
    preset: 'speak-60', flight: 'Speak', topic: 'Café', city: 'Lisbon',
    measures: [
      { label: 'Natural replies', before: { count: 3, of: 8 }, after: { count: 7, of: 8 } },
      { label: 'Confident', before: null, after: { count: 6, of: 8 } },
    ],
    phrases: ['Could I have…', 'How much is…'],
  };

  it('keeps the known shape and writes the logbook line, lead measure first', () => {
    const r = sanitizeFlightResult(raw)!;
    expect(flightResultLine(r)).toBe('Lisbon · Speak · Café · natural replies 3 → 7 of 8');
    expect(formatMeasure(r.measures[1])).toBe('6 of 8');
  });

  it('drops a topic that only repeats the city', () => {
    const r = sanitizeFlightResult({ preset: 'travel-60', flight: 'Travel', topic: 'Trip to Lisbon', city: 'Lisbon', measures: [{ label: 'Can-do stamps', before: { count: 1, of: 5 }, after: { count: 4, of: 5 } }] })!;
    expect(flightResultLine(r)).toBe('Lisbon · Travel · can-do stamps 1 → 4 of 5');
  });

  it('rejects junk and clamps counts', () => {
    expect(sanitizeFlightResult({ flight: 'Speak' })).toBeNull();
    expect(sanitizeFlightResult({ ...raw, measures: [] })).toBeNull();
    const r = sanitizeFlightResult({ ...raw, measures: [{ label: 'x', before: null, after: { count: 99, of: 8 } }], names: ['Ana'] })!;
    expect(r.measures[0].after).toEqual({ count: 8, of: 8 });
    expect((r as unknown as Record<string, unknown>).names).toBeUndefined();
  });
});

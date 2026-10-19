import { describe, expect, it } from 'vitest';
import { MAX_MOMENTS, momentQuestion, planMoments } from '@/lib/live-room/moments';

const LONDON = { lat: 51.5, lng: -0.13 };
const CAIRO = { lat: 30.04, lng: 31.24 };
const NAIROBI = { lat: -1.29, lng: 36.82 };

describe('look outside moments', () => {
  it('never more than 3, all inside the cruise, spaced out', () => {
    const m = planMoments({ origin: CAIRO, destination: NAIROBI, flightMinutes: 50, stops: [] });
    expect(m.length).toBeGreaterThan(0);
    expect(m.length).toBeLessThanOrEqual(MAX_MOMENTS);
    for (const x of m) { expect(x.at).toBeGreaterThanOrEqual(4); expect(x.at).toBeLessThanOrEqual(44); }
    for (let i = 1; i < m.length; i++) expect(m[i].at - m[i - 1].at).toBeGreaterThanOrEqual(10);
  });
  it('a famous mountain on the way comes first (London to Cairo passes Mont Blanc)', () => {
    expect(planMoments({ origin: LONDON, destination: CAIRO, flightMinutes: 50, stops: [] }).some((x) => x.title === 'Mont Blanc')).toBe(true);
  });
  it('border crossings and live events count', () => {
    const m = planMoments({
      origin: LONDON, destination: CAIRO, flightMinutes: 50,
      stops: [{ at: 20, text: 'Cross into Greece', crossing: true }],
      events: [{ id: 'e1', title: 'Wildfire near Athens', category: 'Wildfires', lat: 38, lng: 23.7 }],
    });
    expect(m.some((x) => x.kind === 'event')).toBe(true);
  });
  it('a very short flight has none', () => {
    expect(planMoments({ origin: LONDON, destination: CAIRO, flightMinutes: 8, stops: [] })).toEqual([]);
  });
  it('asks a question for each kind', () => {
    expect(momentQuestion({ kind: 'country', title: 'Greece' })).toContain('Greece');
    expect(momentQuestion({ kind: 'event', title: 'x' })).toMatch(/safe/);
  });
});

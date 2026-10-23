import { describe, expect, it } from 'vitest';
import { actualAnswer, firstCountryPrediction, landingTimePrediction, pickPrediction } from '@/lib/live-room/flight-prediction';
import { loadCountries } from '@/lib/live-room/places-below';
import { DESTINATION_TIME_ZONES } from '@/data/world-flight/time-zones';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';

const city = (id: string) => { const d = WORLD_DESTINATIONS.find((c) => c.id === id)!; return { id, city: d.city, lat: d.lat, lng: d.lng }; };

describe('pre-flight prediction', () => {
  it('Madrid to Berlin: France is the first country we fly over, among four countries', async () => {
    const p = firstCountryPrediction(city('madrid'), city('berlin'), await loadCountries())!;
    expect(p.answer).toBe('France');
    expect(p.options).toHaveLength(4);
    expect(new Set(p.options).size).toBe(4);
    expect(p.options).toContain('France');
    expect(p.revealAt).toBeGreaterThan(0.1);
    expect(p.revealAt).toBeLessThan(0.3);
  });

  it('a route that crosses no border gets no first-country question', async () => {
    expect(firstCountryPrediction(city('beijing'), city('shanghai'), await loadCountries())).toBeNull();
  });

  it('landing time: the right local time, and our own clock as the tempting wrong answer', () => {
    const landAt = Date.UTC(2026, 9, 23, 13, 2); // 13:02 UTC -> 3:00 PM in Berlin (summer time), 8:00 PM in Bangkok
    const p = landingTimePrediction({ city: 'Berlin' }, 'Europe/Berlin', landAt, 'Asia/Bangkok');
    expect(p.answer).toBe('3:00 PM');
    expect(p.options).toContain('8:00 PM');
    expect(new Set(p.options).size).toBe(4);
    expect(p.revealAt).toBeNull();
    // the class was extended by 5 minutes after the briefing: the reveal uses the real landing time
    expect(actualAnswer(p, { city: 'Berlin' }, landAt + 5 * 60_000).answer).toBe('3:05 PM');
  });

  it('alternates between the two kinds, and every destination has a valid time zone', async () => {
    const countries = await loadCountries();
    const o = { origin: city('madrid'), destination: city('berlin'), countries, destinationZone: 'Europe/Berlin', landAt: Date.UTC(2026, 9, 23, 13, 0), localZone: 'Asia/Bangkok' };
    expect(pickPrediction({ ...o, seed: 0 })!.kind).not.toBe(pickPrediction({ ...o, seed: 1 })!.kind);
    for (const d of WORLD_DESTINATIONS.filter((c) => c.scene)) {
      const zone = DESTINATION_TIME_ZONES[d.id];
      expect(zone, d.id).toBeTruthy();
      expect(() => new Intl.DateTimeFormat('en-US', { timeZone: zone }).format(0)).not.toThrow();
    }
  });
});

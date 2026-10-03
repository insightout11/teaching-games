import { describe, expect, it } from 'vitest';
import { WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import { buildTripAnnouncementContent } from './content';

describe('buildTripAnnouncementContent', () => {
  it('builds 3 valid questions for every city with an announcement', () => {
    WORLD_DESTINATIONS.forEach((d) => {
      const c = buildTripAnnouncementContent(d);
      c.segments.forEach((s) => {
        expect(new Set(s.options).size, `${d.city}: ${s.question}`).toBe(s.options.length);
        expect(s.options.length).toBeGreaterThanOrEqual(3);
        expect(s.script).toContain(s.options[s.correctIndex]);
      });
      const a = d.announcement!;
      expect(c.segments[0].options[c.segments[0].correctIndex]).toBe(a.platform);
      expect(c.segments[1].options[c.segments[1].correctIndex]).toBe(a.time);
      expect(c.segments[2].options[c.segments[2].correctIndex]).toBe(a.destination);
    });
  });
});

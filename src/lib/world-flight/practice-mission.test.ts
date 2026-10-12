import { describe, expect, it } from 'vitest';
import { WORLD_FLIGHT_INVESTIGATIONS } from '@/lib/world-flight/investigations';
import { buildPracticeDesignMission } from '@/lib/world-flight/practice-mission';

describe('practice design mission', () => {
  it('builds a mission from three different real cities for every investigation', () => {
    for (const investigation of WORLD_FLIGHT_INVESTIGATIONS) {
      const mission = buildPracticeDesignMission(investigation.id);
      expect(mission, investigation.id).toBeTruthy();
      expect(mission!.practice).toBe(true);
      expect(mission!.evidence).toHaveLength(3);
      expect(new Set(mission!.evidence.map((e) => e.city)).size).toBe(3);
      mission!.evidence.forEach((e) => expect(e.focusTitle, `${investigation.id} ${e.city}`).toBeTruthy());
    }
  });

  it('returns null for an unknown investigation', () => {
    expect(buildPracticeDesignMission('nope')).toBeNull();
  });
});

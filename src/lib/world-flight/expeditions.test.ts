import { describe, expect, it } from 'vitest';
import {
  advanceWorldFlightExpedition,
  buildWorldFlightExpeditionSnapshot,
  deriveWorldFlightExpeditionProgress,
  validateWorldFlightExpeditionCatalog,
  WORLD_FLIGHT_EXPEDITIONS,
} from '@/lib/world-flight/expeditions';
import { WORLD_FLIGHT_INVESTIGATIONS } from '@/lib/world-flight/investigations';

describe('World Flight expeditions', () => {
  it('references real destinations and recommended lesson sources', () => {
    expect(validateWorldFlightExpeditionCatalog()).toEqual([]);
  });

  it('does not duplicate an automatic Flight Mission', () => {
    const missionIds = new Set(WORLD_FLIGHT_INVESTIGATIONS.map((mission) => mission.id));
    const missionTitles = new Set(WORLD_FLIGHT_INVESTIGATIONS.map((mission) => mission.title.toLowerCase()));
    const missionQuestions = new Set(WORLD_FLIGHT_INVESTIGATIONS.map((mission) => mission.question.toLowerCase()));

    for (const expedition of WORLD_FLIGHT_EXPEDITIONS) {
      expect(missionIds.has(expedition.id)).toBe(false);
      expect(missionTitles.has(expedition.title.toLowerCase())).toBe(false);
      expect(missionQuestions.has(expedition.centralQuestion.toLowerCase())).toBe(false);
    }
  });

  it('tracks flexible stop completion without requiring a fixed route', () => {
    const expedition = WORLD_FLIGHT_EXPEDITIONS[0];
    const progress = deriveWorldFlightExpeditionProgress(expedition, ['miami', 'bangkok', 'vancouver', 'recife']);

    expect(progress.complete).toBe(true);
    expect(progress.completedStopCount).toBe(4);
  });

  it('ignores detours while preserving them elsewhere in the journey', () => {
    const expedition = WORLD_FLIGHT_EXPEDITIONS[1];
    const snapshot = buildWorldFlightExpeditionSnapshot(expedition);
    const afterDetour = advanceWorldFlightExpedition(snapshot, ['vancouver'], 'berlin');
    const afterStop = advanceWorldFlightExpedition(snapshot, afterDetour.visitedDestinationIds, 'honolulu');

    expect(afterDetour.visitedDestinationIds).toEqual(['vancouver']);
    expect(afterStop.visitedDestinationIds).toEqual(['vancouver', 'honolulu']);
  });
});

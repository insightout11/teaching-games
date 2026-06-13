import { describe, expect, it } from 'vitest';
import {
  advanceWorldFlightExpedition,
  buildWorldFlightExpeditionSnapshot,
  deriveWorldFlightExpeditionProgress,
  recommendWorldFlightExpeditionRoute,
  validateWorldFlightExpeditionCatalog,
  WORLD_FLIGHT_EXPEDITIONS,
} from '@/lib/world-flight/expeditions';
import { WORLD_FLIGHT_INVESTIGATIONS } from '@/lib/world-flight/investigations';
import { STARTER_PLANE_RANGE_KM, WORLD_DESTINATIONS } from '@/data/world-flight/destinations';
import type { DestinationPack } from '@/lib/world-flight/types';

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

  it('recommends a reachable expedition stop before a bridge route', () => {
    const expedition = WORLD_FLIGHT_EXPEDITIONS[0];
    const route = recommendWorldFlightExpeditionRoute(expedition, [], 'miami', STARTER_PLANE_RANGE_KM);

    expect(route?.direct).toBe(true);
    expect(route?.targetDestinationId).toBe('miami');
    expect(route?.nextDestinationId).toBe('miami');
  });

  it('recommends the first ordinary bridge city when no expedition stop is directly reachable', () => {
    const mockDestination = (id: string, lng: number) => ({ id, lat: 0, lng } as DestinationPack);
    const expedition = {
      ...WORLD_FLIGHT_EXPEDITIONS[0],
      requiredStopCount: 1,
      stops: [{ destinationId: 'target', recommendedFocusId: 'focus', reason: 'Test target' }],
    };
    const route = recommendWorldFlightExpeditionRoute(
      expedition,
      [],
      'origin',
      2500,
      [mockDestination('origin', 0), mockDestination('bridge', 20), mockDestination('target', 40)],
    );

    expect(route).toEqual({
      targetDestinationId: 'target',
      nextDestinationId: 'bridge',
      routeDestinationIds: ['bridge', 'target'],
      direct: false,
    });
  });

  it('keeps every expedition stop reachable through the starter-plane city network', () => {
    for (const expedition of WORLD_FLIGHT_EXPEDITIONS) {
      for (const stop of expedition.stops) {
        const singleStopExpedition = { ...expedition, requiredStopCount: 1, stops: [stop] };
        for (const origin of WORLD_DESTINATIONS) {
          expect(
            recommendWorldFlightExpeditionRoute(singleStopExpedition, [], origin.id, STARTER_PLANE_RANGE_KM),
            `${origin.id} should be able to route to ${stop.destinationId}`,
          ).not.toBeNull();
        }
      }
    }
  });

  it('offers meaningful level variety within every expedition', () => {
    for (const expedition of WORLD_FLIGHT_EXPEDITIONS) {
      const difficulties = expedition.stops.map((stop) => (
        WORLD_DESTINATIONS
          .find((destination) => destination.id === stop.destinationId)
          ?.focusOptions.find((focus) => focus.id === stop.recommendedFocusId)
          ?.difficulty
      ));

      expect(difficulties.some((difficulty) => difficulty === 'Beginner' || difficulty === 'Easy')).toBe(true);
      expect(difficulties.some((difficulty) => difficulty === 'Intermediate' || difficulty === 'Advanced' || difficulty === 'Expert')).toBe(true);
    }
  });
});

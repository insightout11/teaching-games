import { describe, expect, it } from 'vitest';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import { buildRoomFlightPlan, estimatePlanMinutes, roomFlightPresets, trimSlotsToMinutes } from './room-flight-plan';
import { buildTripPack, findTripDestination } from '@/lib/world-flight/trip-pack';

const captains = FLIGHT_PLAN_PRESETS.find((p) => p.id === 'all-around-flight-60')!;
const full = buildRoomFlightPlan({ preset: captains, topic: 'Should cities ban cars?', difficulty: 'Intermediate' });

describe('room flight plans', () => {
  it("builds Captain's Flight in the room from the Flight Question to the Verdict", () => {
    expect(full.slots[0].key).toBe('flight-question');
    expect(full.slots[full.slots.length - 1].key).toBe('flight-verdict');
    expect(full.flightPresetId).toBe('all-around-flight-60');
  });

  it('keeps the whole plan when there is time', () => {
    expect(trimSlotsToMinutes(full.slots, 90)).toHaveLength(full.slots.length);
  });

  it('trims breaks and the review game first, never the main event or the landing', () => {
    const short = trimSlotsToMinutes(full.slots, 30);
    const stages = short.map((s) => s.stageId);
    expect(estimatePlanMinutes(short)).toBeLessThanOrEqual(30);
    expect(stages).toContain('production');
    expect(stages[stages.length - 1]).toBe('landing');
    expect(short.some((s) => s.isMicroEvent)).toBe(false);
  });

  it('sizes a mid-air plan to the minutes left', () => {
    const plan = buildRoomFlightPlan({ preset: captains, topic: 'x', difficulty: 'Intermediate', minutesLeft: 20 });
    expect(estimatePlanMinutes(plan.slots)).toBeLessThanOrEqual(25);
    expect(plan.slots.some((s) => s.stageId === 'production')).toBe(true);
    expect(plan.lessonDurationMinutes).toBe(20);
  });
});

describe('Travel in the room', () => {
  it('is offered only when the destination has a trip pack', () => {
    expect(roomFlightPresets().some((p) => p.id === 'travel-60')).toBe(false);
    expect(roomFlightPresets({ travel: true }).some((p) => p.id === 'travel-60')).toBe(true);
  });

  it("flies to the room's destination with its trip pack", () => {
    const tokyo = findTripDestination('nope', 'Tokyo')!;
    expect(tokyo.city).toBe('Tokyo');
    const travel = FLIGHT_PLAN_PRESETS.find((p) => p.id === 'travel-60')!;
    const plan = buildRoomFlightPlan({ preset: travel, topic: 'ignored', difficulty: 'Intermediate', tripPack: buildTripPack(tokyo) });
    expect(plan.customTopic).toBe('Trip to Tokyo');
    expect(plan.flightPresetId).toBe('travel-60');
    expect(plan.slots[0].key).toBe('boarding-call');
    // Every stop's content is already built, so nothing is generated at class time.
    plan.slots.filter((s) => s.key.startsWith('trip-') || s.key === 'boarding-call')
      .filter((s) => s.key !== 'trip-recap')
      .forEach((s) => expect(plan.generatedContent[s.key], s.key).toBeTruthy());
  });
});

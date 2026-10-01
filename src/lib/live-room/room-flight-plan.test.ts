import { describe, expect, it } from 'vitest';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import { buildRoomFlightPlan, estimatePlanMinutes, trimSlotsToMinutes } from './room-flight-plan';

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

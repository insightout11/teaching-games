import { describe, expect, it } from 'vitest';
import { isRetired } from './retired-plugins';
import { FLIGHT_PLAN_PRESETS } from './flight-plan-presets';

describe("Captain's Flight micro-events", () => {
  const preset = FLIGHT_PLAN_PRESETS.find((candidate) => candidate.id === 'all-around-flight-60');

  it('is defined', () => {
    expect(preset).toBeDefined();
  });

  it('is built around the Flight Question (v2): question at takeoff, Verdict at landing', () => {
    expect(preset!.takeoff).toBe('flight-question');
    expect(preset!.landing).toBe('flight-verdict');
  });

  it('schedules no retired modules', () => {
    const keys = preset!.moduleSequence.flatMap((slot) => [slot.key, ...(slot.pool ?? [])]);
    keys.forEach((key) => expect(isRetired(key)).toBe(false));
  });

  it('never schedules two micro-event checks back-to-back (full route or home-filtered)', () => {
    const noBackToBack = (slots: { isMicroEvent?: boolean; worldFlightOnly?: boolean }[]) => {
      for (let i = 1; i < slots.length; i++) {
        expect(Boolean(slots[i].isMicroEvent && slots[i - 1].isMicroEvent)).toBe(false);
      }
    };
    noBackToBack(preset!.moduleSequence);
    noBackToBack(preset!.moduleSequence.filter((slot) => !slot.worldFlightOnly));
  });
});

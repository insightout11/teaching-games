import { describe, expect, it } from 'vitest';
import { FLIGHT_PLAN_PRESETS } from './flight-plan-presets';

describe("Captain's Flight micro-events", () => {
  const preset = FLIGHT_PLAN_PRESETS.find((candidate) => candidate.id === 'all-around-flight-60');

  it('is defined', () => {
    expect(preset).toBeDefined();
  });

  it('flags Navigation Check as World-Flight-only', () => {
    // radar-fix (geography) only belongs in World Flight; the launch filter drops it at home.
    const nav = preset!.moduleSequence.find((slot) => slot.stageId === 'navigation-check');
    expect(nav).toMatchObject({ key: 'radar-fix', isMicroEvent: true, worldFlightOnly: true });
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

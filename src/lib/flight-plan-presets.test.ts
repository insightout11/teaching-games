import { describe, expect, it } from 'vitest';
import { FLIGHT_PLAN_PRESETS } from './flight-plan-presets';

describe("Captain's Flight micro-events", () => {
  const preset = FLIGHT_PLAN_PRESETS.find((candidate) => candidate.id === 'all-around-flight-60');

  it('is defined', () => {
    expect(preset).toBeDefined();
  });

  it('never schedules two micro-event checks back-to-back', () => {
    const seq = preset!.moduleSequence;
    for (let i = 1; i < seq.length; i++) {
      expect(Boolean(seq[i].isMicroEvent && seq[i - 1].isMicroEvent)).toBe(false);
    }
  });

  it('keeps geography (radar-fix) out of the standalone preset', () => {
    // Navigation Check is World-Flight-only; it returns via the micro-event context system,
    // not baked into the home/standalone Captain's Flight.
    expect(preset!.moduleSequence.some((slot) => slot.key === 'radar-fix')).toBe(false);
    expect(preset!.flightConfig?.stageByKey['radar-fix']).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { FLIGHT_PLAN_PRESETS } from './flight-plan-presets';

describe("Captain's Flight navigation check", () => {
  const preset = FLIGHT_PLAN_PRESETS.find((candidate) => candidate.id === 'all-around-flight-60');

  it('keeps Radar Fix separate from language accuracy checks', () => {
    expect(preset).toBeDefined();

    const navigationCheck = preset?.moduleSequence.find((slot) => slot.stageId === 'navigation-check');
    const accuracyCheck = preset?.moduleSequence.find((slot) => slot.stageId === 'accuracy-check');

    expect(navigationCheck).toMatchObject({
      key: 'radar-fix',
      isMicroEvent: true,
    });
    expect(accuracyCheck?.pool).not.toContain('radar-fix');
    expect(preset?.flightConfig?.stageByKey['radar-fix']).toBe('navigation-check');
  });
});

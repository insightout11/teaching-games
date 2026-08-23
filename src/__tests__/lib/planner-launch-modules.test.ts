import { describe, expect, it } from 'vitest';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import type { PlanModule } from '@/lib/planner-utils';
import { refreshAllAroundModules } from '@/stores/planner-store';

const preset = FLIGHT_PLAN_PRESETS.find((candidate) => candidate.id === 'all-around-flight-60')!;

describe('Captain\'s Flight launch module refresh', () => {
  it('preserves removed modules and the edited order', () => {
    const selected: PlanModule[] = [
      {
        id: 'landing',
        slotType: 'landing',
        key: 'final-word',
        isLocked: false,
        stageId: 'landing',
      },
      {
        id: 'briefing',
        slotType: 'presentation',
        key: 'read-aloud',
        isLocked: false,
        stageId: 'briefing',
      },
    ];

    const refreshed = refreshAllAroundModules(selected, preset, 'text');

    expect(refreshed.map(({ id, key }) => ({ id, key }))).toEqual([
      { id: 'landing', key: 'final-word' },
      { id: 'briefing', key: 'read-aloud' },
    ]);
    expect(refreshed).toHaveLength(2);
  });

  it('routes the retained briefing to video without restoring other stages', () => {
    const selected: PlanModule[] = [{
      id: 'briefing',
      slotType: 'presentation',
      key: 'read-aloud',
      isLocked: false,
      stageId: 'briefing',
    }];

    expect(refreshAllAroundModules(selected, preset, 'video')).toMatchObject([
      { id: 'briefing', key: 'video-player', stageId: 'briefing' },
    ]);
    expect(refreshAllAroundModules(
      [{ ...selected[0], key: 'video-player' }],
      preset,
      'text',
    )).toMatchObject([
      { id: 'briefing', key: 'read-aloud', stageId: 'briefing' },
    ]);
  });
});

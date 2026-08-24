import { describe, expect, it } from 'vitest';
import { FLIGHT_PLAN_PRESETS } from '@/lib/flight-plan-presets';
import { isUndeterminedModule } from '@/lib/planner-compose';
import type { PlanModule } from '@/lib/planner-utils';
import { refreshAllAroundModules, replacePlannerModule } from '@/stores/planner-store';

const preset = FLIGHT_PLAN_PRESETS.find((candidate) => candidate.id === 'all-around-flight-60')!;

describe('Captain\'s Flight launch module refresh', () => {
  it('turns a pooled waypoint into the activity the teacher selected', () => {
    const pooledSlot: PlanModule = {
      id: 'review-game',
      slotType: 'practice',
      key: 'flash-quiz',
      isLocked: false,
      stageId: 'review-game',
      pool: ['flash-quiz', 'grid-rush'],
    };

    const [replacement] = replacePlannerModule(
      [pooledSlot],
      pooledSlot.id,
      'grid-rush',
      'practice',
    );

    expect(replacement).toMatchObject({
      id: pooledSlot.id,
      key: 'grid-rush',
      slotType: 'practice',
      stageId: 'review-game',
    });
    expect(replacement).not.toHaveProperty('pool');
    expect(isUndeterminedModule(replacement)).toBe(false);
  });

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

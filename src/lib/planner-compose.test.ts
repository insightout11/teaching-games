import { describe, expect, it } from 'vitest';
import {
  composeLesson,
  pickNearestPreset,
  suggestModules,
  difficultyToComposerLevel,
  type ComposeIntent,
} from './planner-compose';
import { getFlightPlanItem, type GoalTag } from './flight-plan-config';
import { DIFFICULTIES } from './difficulty';

const DURATIONS = [30, 45, 60, 90] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const GOALS: GoalTag[] = [
  'speaking-fluency',
  'discussion-debate',
  'vocabulary-building',
  'grammar-reinforcement',
  'collaboration',
  'creativity',
  'critical-thinking',
  'confidence-building',
  'functional-english',
];

function base(overrides: Partial<ComposeIntent> = {}): ComposeIntent {
  return { goal: 'speaking-fluency', level: 'intermediate', durationMinutes: 60, ...overrides };
}

describe('pickNearestPreset', () => {
  it('returns an exact goal match when a preset covers the goal', () => {
    expect(pickNearestPreset('grammar-reinforcement').goal).toBe('grammar-reinforcement');
    expect(pickNearestPreset('discussion-debate').goal).toBe('discussion-debate');
    expect(pickNearestPreset('functional-english').goal).toBe('functional-english');
  });

  it('falls back to the flagship all-rounder for uncovered goals', () => {
    // No live preset targets vocabulary-building / creativity directly.
    expect(pickNearestPreset('vocabulary-building').id).toBe('all-around-flight-60');
    expect(pickNearestPreset('creativity').id).toBe('all-around-flight-60');
  });

  it('never anchors to a single-module / specialty preset', () => {
    for (const goal of GOALS) {
      expect(pickNearestPreset(goal).skipTakeoffLanding).not.toBe(true);
    }
  });
});

describe('composeLesson — structural invariants', () => {
  it('grows the module count with duration (richer = longer), always a real lesson', () => {
    for (const goal of GOALS) {
      const d30 = composeLesson(base({ goal, durationMinutes: 30 })).length;
      const d45 = composeLesson(base({ goal, durationMinutes: 45 })).length;
      const d60 = composeLesson(base({ goal, durationMinutes: 60 })).length;
      const d90 = composeLesson(base({ goal, durationMinutes: 90 })).length;
      expect(d30).toBeLessThanOrEqual(d45);
      expect(d45).toBeLessThanOrEqual(d60);
      expect(d60).toBeLessThanOrEqual(d90);
      expect(d30).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the anchored preset micro-events for a micro-event goal', () => {
    // Speaking-fluency anchors to a preset whose rhythm includes micro-event beats.
    const mods = composeLesson(base({ goal: 'speaking-fluency' }));
    expect(mods.some((m) => m.isMicroEvent)).toBe(true);
  });

  it('never leaves a pooled slot whose key is not in its own pool', () => {
    for (const goal of GOALS) {
      for (const durationMinutes of DURATIONS) {
        const mods = composeLesson(base({ goal, durationMinutes }));
        for (const m of mods) {
          if (m.pool && m.pool.length > 0) {
            expect(m.pool).toContain(m.key);
          }
        }
      }
    }
  });

  it('always opens with a takeoff and closes with a landing', () => {
    for (const goal of GOALS) {
      const mods = composeLesson(base({ goal }));
      expect(mods[0].slotType).toBe('takeoff');
      expect(mods[mods.length - 1].slotType).toBe('landing');
    }
  });

  it('produces no duplicate modules', () => {
    for (const goal of GOALS) {
      for (const durationMinutes of DURATIONS) {
        const mods = composeLesson(base({ goal, durationMinutes }));
        const keys = mods.map((m) => m.key);
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });

  it('gives every module a stable id and unlocked state', () => {
    const mods = composeLesson(base());
    const ids = mods.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(mods.every((m) => m.isLocked === false)).toBe(true);
  });
});

describe('composeLesson — level adaptation', () => {
  it('never places a known module whose levelFit excludes the chosen level', () => {
    for (const level of LEVELS) {
      for (const goal of GOALS) {
        const mods = composeLesson(base({ goal, level }));
        for (const m of mods) {
          const item = getFlightPlanItem(m.key);
          if (!item) continue; // source briefing / off-config modules are exempt
          expect(item.levelFit).toContain(level);
        }
      }
    }
  });
});

describe('composeLesson — goal targeting', () => {
  it('includes at least one module that fits the requested goal', () => {
    for (const goal of GOALS) {
      const mods = composeLesson(base({ goal }));
      const hasGoalFit = mods.some((m) => getFlightPlanItem(m.key)?.goalFit.includes(goal));
      if (goal === 'functional-english') {
        // Trip Around intentionally uses activity keys owned by its preset rather than
        // the general FLIGHT_PLAN_ITEMS catalog, so validate the preset family directly.
        expect(mods.some((m) => m.key.startsWith('trip-'))).toBe(true);
      } else {
        expect(hasGoalFit).toBe(true);
      }
    }
  });

  it('composes Functional English from the intended Travel activity family', () => {
    const keys = composeLesson(base({ goal: 'functional-english' })).map((module) => module.key);

    expect(keys).toEqual(expect.arrayContaining([
      'boarding-call',
      'trip-arrival',
      'trip-getting-there',
      'trip-directions',
      'trip-hotel',
      'trip-attractions',
      'trip-meal',
      'trip-recap',
    ]));
  });
});

describe('composeLesson — source handling', () => {
  it('injects a video briefing when a video source is attached', () => {
    const mods = composeLesson(base({ sourceKind: 'video' }));
    expect(mods.some((m) => m.key === 'video-player')).toBe(true);
  });

  it('injects a reading briefing when a text source is attached', () => {
    const mods = composeLesson(base({ goal: 'functional-english', sourceKind: 'text' }));
    // Travel skips its source briefing; use a preset that briefs from text.
    const mods2 = composeLesson(base({ goal: 'speaking-fluency', sourceKind: 'text' }));
    expect(mods2.some((m) => m.key === 'read-aloud')).toBe(true);
    expect(Array.isArray(mods)).toBe(true);
  });

  it('drops source-required modules when no source is attached', () => {
    for (const goal of GOALS) {
      const mods = composeLesson(base({ goal, sourceKind: null }));
      for (const m of mods) {
        const item = getFlightPlanItem(m.key);
        if (item?.requiresSource) {
          throw new Error(`requiresSource module ${m.key} present without a source`);
        }
      }
    }
  });
});

describe('composeLesson — pacing', () => {
  it('avoids two high-energy modules back-to-back (known modules)', () => {
    for (const goal of GOALS) {
      for (const durationMinutes of DURATIONS) {
        const mods = composeLesson(base({ goal, durationMinutes }));
        for (let i = 1; i < mods.length; i++) {
          const prev = getFlightPlanItem(mods[i - 1].key);
          const cur = getFlightPlanItem(mods[i].key);
          if (!prev || !cur) continue;
          expect(prev.energy === 'high' && cur.energy === 'high').toBe(false);
        }
      }
    }
  });

  it('avoids known avoidAfter adjacency pairs', () => {
    for (const goal of GOALS) {
      const mods = composeLesson(base({ goal }));
      for (let i = 1; i < mods.length; i++) {
        const prev = getFlightPlanItem(mods[i - 1].key);
        if (!prev) continue;
        expect(prev.avoidAfter).not.toContain(mods[i].key);
      }
    }
  });
});

describe('difficultyToComposerLevel', () => {
  it('maps all 5 Difficulty levels onto the 3 composer levels', () => {
    expect(difficultyToComposerLevel('Beginner')).toBe('beginner');
    expect(difficultyToComposerLevel('Easy')).toBe('beginner');
    expect(difficultyToComposerLevel('Intermediate')).toBe('intermediate');
    expect(difficultyToComposerLevel('Advanced')).toBe('advanced');
    expect(difficultyToComposerLevel('Expert')).toBe('advanced');
  });

  it('produces a valid full-size plan for every Difficulty (incl. Easy/Expert)', () => {
    for (const difficulty of DIFFICULTIES) {
      const mods = suggestModules('speaking-fluency', difficulty, 60);
      expect(mods.length).toBeGreaterThan(3);
      const level = difficultyToComposerLevel(difficulty);
      for (const m of mods) {
        const item = getFlightPlanItem(m.key);
        if (item) expect(item.levelFit).toContain(level);
      }
    }
  });
});

describe('suggestModules — back-compat wrapper', () => {
  it('maps a capitalized Difficulty to the composer and returns a valid plan', () => {
    const mods = suggestModules('vocabulary-building', 'Beginner', 45);
    expect(mods.length).toBeGreaterThan(2);
    expect(mods[0].slotType).toBe('takeoff');
    for (const m of mods) {
      const item = getFlightPlanItem(m.key);
      if (item) expect(item.levelFit).toContain('beginner');
    }
  });
});

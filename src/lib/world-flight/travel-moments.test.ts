import { describe, it, expect } from 'vitest';
import {
  TRAVEL_MOMENTS,
  TRAVEL_MOMENT_TYPE_WEIGHTS,
  drawTravelMoment,
  type TravelMomentType,
} from './travel-moments';

describe('travel-moments deck', () => {
  it('has unique, non-empty ids and templates', () => {
    const ids = TRAVEL_MOMENTS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const moment of TRAVEL_MOMENTS) {
      expect(moment.id).toMatch(/^[a-z0-9-]+$/);
      expect(moment.situation.trim().length).toBeGreaterThan(0);
      expect(moment.speakingTask.trim().length).toBeGreaterThan(0);
    }
  });

  it('covers every moment type', () => {
    const types = new Set(TRAVEL_MOMENTS.map((m) => m.type));
    for (const type of Object.keys(TRAVEL_MOMENT_TYPE_WEIGHTS) as TravelMomentType[]) {
      expect(types.has(type)).toBe(true);
    }
  });
});

describe('drawTravelMoment', () => {
  it('fills {place} everywhere with no residual placeholder', () => {
    const moment = drawTravelMoment({ place: 'Senso-ji Temple', rng: () => 0 });
    expect(moment.situation).not.toContain('{place}');
    expect(moment.speakingTask).not.toContain('{place}');
    expect(moment.situation).toContain('Senso-ji Temple');
  });

  it('never returns an excluded moment', () => {
    const exclude = ['street-performance', 'friendly-local'];
    for (let i = 0; i < 200; i++) {
      const moment = drawTravelMoment({ place: 'X', rng: () => i / 200, exclude });
      expect(exclude).not.toContain(moment.id);
    }
  });

  it('falls back to the full deck when exclude would empty the pool', () => {
    const exclude = TRAVEL_MOMENTS.map((m) => m.id);
    const moment = drawTravelMoment({ place: 'X', rng: () => 0.5, exclude });
    expect(moment.id.length).toBeGreaterThan(0);
  });

  it('rng at 0 selects the first candidate', () => {
    const moment = drawTravelMoment({ place: 'X', rng: () => 0 });
    expect(moment.id).toBe(TRAVEL_MOMENTS[0].id);
  });

  it('weights the draw so opportunities dominate and obstacles are rare', () => {
    const counts: Record<TravelMomentType, number> = {
      opportunity: 0,
      choice: 0,
      'local-color': 0,
      obstacle: 0,
    };
    const samples = 1000;
    for (let i = 0; i < samples; i++) {
      // Sweep rng evenly across [0,1) for a deterministic distribution.
      const moment = drawTravelMoment({ place: 'X', rng: () => i / samples });
      counts[moment.type] += 1;
    }
    expect(counts.opportunity).toBeGreaterThan(counts.obstacle);
    expect(counts.choice).toBeGreaterThan(counts.obstacle);
    expect(counts.opportunity).toBeGreaterThan(counts['local-color']);
  });
});

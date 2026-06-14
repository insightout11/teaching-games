import { describe, expect, it } from 'vitest';
import { cinematicCameraFrame, cinematicCameraTransform, cinematicParallaxX, cinematicParallaxY } from '../cinematic-camera';
import type { ArrivalPhase } from '../types';

const phases: ArrivalPhase[] = ['approach', 'touchdown', 'taxi', 'landed'];

describe('cinematic arrival camera', () => {
  it('joins every arrival phase without a camera jump', () => {
    for (let index = 0; index < phases.length - 1; index += 1) {
      const end = cinematicCameraFrame('arrival', phases[index], 1);
      const start = cinematicCameraFrame('arrival', phases[index + 1], 0);
      expect(end.targetX).toBeCloseTo(start.targetX);
      expect(end.targetY).toBeCloseTo(start.targetY);
      expect(end.zoom).toBeCloseTo(start.zoom);
    }
  });

  it('continues tracking in the established direction at the end', () => {
    expect(cinematicCameraFrame('arrival', 'landed', 1)).toEqual({
      targetX: 1660,
      targetY: 504,
      zoom: 1.1,
      roll: 0,
    });
  });

  it('keeps motion restrained and departure camera unchanged', () => {
    let previousTargetX = Number.NEGATIVE_INFINITY;
    for (const phase of phases) {
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        const frame = cinematicCameraFrame('arrival', phase, progress);
        expect(frame.zoom).toBeGreaterThanOrEqual(1);
        expect(frame.zoom).toBeLessThanOrEqual(1.12);
        expect(Math.abs(frame.roll)).toBeLessThanOrEqual(0.16);
        expect(frame.targetX).toBeGreaterThanOrEqual(previousTargetX);
        previousTargetX = frame.targetX;
      }
    }
    expect(cinematicCameraFrame('departure', 'approach', 0.5)).toEqual({
      targetX: 1440,
      targetY: 450,
      zoom: 1,
      roll: 0,
    });
  });

  it('produces a valid transform and stronger near-layer parallax', () => {
    const frame = cinematicCameraFrame('arrival', 'taxi', 0.5);
    expect(cinematicCameraTransform(frame)).toContain('scale(');
    expect(cinematicCameraTransform(frame)).toContain('rotate(');
    expect(Math.abs(cinematicParallaxX(frame, 1))).toBeGreaterThan(Math.abs(cinematicParallaxX(frame, 0.2)));
    expect(Math.abs(cinematicParallaxY(frame, 1))).toBeGreaterThan(Math.abs(cinematicParallaxY(frame, 0.2)));
  });
});

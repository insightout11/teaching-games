import { describe, it, expect } from 'vitest';
import {
  ARRIVAL_DURATION_MS,
  DEPARTURE_DURATION_MS,
  DEP_ROLL,
  arrivalTimeline,
  departureCameraPan,
  departurePlaneFrame,
  departureCalibrationBlend,
} from '../cinematic-motion';
import { cinematicCameraFrame } from '../cinematic-camera';
import { VIEWBOX } from '../types';

describe('arrivalTimeline', () => {
  it('starts in approach at 0 and ends in landed at 1', () => {
    expect(arrivalTimeline(0)).toEqual({ phase: 'approach', progress: 0 });
    expect(arrivalTimeline(1).phase).toBe('landed');
    expect(arrivalTimeline(1).progress).toBeCloseTo(1, 5);
  });

  it('walks the phases in order with no gaps at the boundaries', () => {
    expect(arrivalTimeline(0.52).phase).toBe('touchdown');
    expect(arrivalTimeline(0.52).progress).toBeCloseTo(0, 5);
    expect(arrivalTimeline(0.72).phase).toBe('taxi');
    expect(arrivalTimeline(0.72).progress).toBeCloseTo(0, 5);
    expect(arrivalTimeline(0.94).phase).toBe('landed');
    expect(arrivalTimeline(0.94).progress).toBeCloseTo(0, 5);
    // each phase is ~complete just before the next begins
    expect(arrivalTimeline(0.5199).progress).toBeGreaterThan(0.99);
    expect(arrivalTimeline(0.7199).progress).toBeGreaterThan(0.99);
    expect(arrivalTimeline(0.9399).progress).toBeGreaterThan(0.99);
  });

  it('keeps per-phase progress inside [0,1] across the whole sweep and clamps input', () => {
    for (let i = 0; i <= 100; i += 1) {
      const { progress } = arrivalTimeline(i / 100);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    }
    expect(arrivalTimeline(-1)).toEqual({ phase: 'approach', progress: 0 });
    expect(arrivalTimeline(2).phase).toBe('landed');
  });
});

describe('arrival camera direction', () => {
  it('targetX never reverses across the full arrival (no final pullback)', () => {
    let prev = -Infinity;
    for (let i = 0; i <= 200; i += 1) {
      const { phase, progress } = arrivalTimeline(i / 200);
      const cam = cinematicCameraFrame('arrival', phase, progress);
      expect(cam.targetX).toBeGreaterThanOrEqual(prev - 1e-6);
      prev = cam.targetX;
    }
  });
});

describe('departure camera', () => {
  it('stays locked through the ground roll', () => {
    expect(cinematicCameraFrame('departure', 'approach', 0).targetY).toBe(VIEWBOX.h / 2);
    expect(cinematicCameraFrame('departure', 'approach', DEP_ROLL).targetY).toBe(VIEWBOX.h / 2);
  });

  it('after rotation follows up monotonically without horizontal drift or reverse', () => {
    let prevY = Infinity;
    for (let i = 0; i <= 200; i += 1) {
      const cam = cinematicCameraFrame('departure', 'approach', i / 200);
      expect(cam.targetX).toBe(VIEWBOX.w / 2); // tracking pan owns horizontal
      expect(cam.targetY).toBeLessThanOrEqual(prevY + 1e-6); // only ever rises
      prevY = cam.targetY;
    }
  });
});

describe('departureCameraPan', () => {
  it('is zero at the start and positive after', () => {
    expect(departureCameraPan(0)).toBe(0);
    expect(departureCameraPan(0.1)).toBeGreaterThan(0);
  });

  it('is monotonically non-decreasing (camera only ever moves one direction)', () => {
    let prev = -Infinity;
    for (let i = 0; i <= 200; i += 1) {
      const v = departureCameraPan(i / 200);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });

  it('reaches the full pan distance at p=1 and clamps out-of-range input', () => {
    expect(departureCameraPan(1)).toBeCloseTo(1980, 5); // 1500 roll + 480 climb
    expect(departureCameraPan(-1)).toBe(0);
    expect(departureCameraPan(5)).toBeCloseTo(1980, 5);
  });
});

describe('departurePlaneFrame', () => {
  it('holds the plane near centre, level, during the ground roll', () => {
    expect(departurePlaneFrame(0).cx).toBeGreaterThan(700);
    expect(departurePlaneFrame(0).cx).toBeLessThan(840);
    expect(departurePlaneFrame(DEP_ROLL * 0.5).cx).toBeLessThan(840);
    expect(departurePlaneFrame(0).flying).toBe(false);
    expect(departurePlaneFrame(0).rot).toBe(0);
  });

  it('is continuous at the DEP_ROLL rotation boundary (no kink)', () => {
    const eps = 1e-6;
    const before = departurePlaneFrame(DEP_ROLL - eps);
    const at = departurePlaneFrame(DEP_ROLL);
    expect(at.cx).toBeCloseTo(before.cx, 2);
    expect(at.cyBase).toBeCloseTo(before.cyBase, 2);
    expect(at.rot).toBeCloseTo(before.rot, 2);
  });

  it('climbs up and to the right after rotation, shrinking', () => {
    const mid = departurePlaneFrame(0.8);
    const end = departurePlaneFrame(1);
    expect(end.cx).toBeGreaterThan(mid.cx);
    expect(end.cyBase).toBeLessThan(mid.cyBase);
    expect(end.depthScale).toBeLessThan(1);
    expect(end.flying).toBe(true);
  });

  it('cx is monotonically non-decreasing through the whole takeoff', () => {
    let prev = -Infinity;
    for (let i = 0; i <= 200; i += 1) {
      const cx = departurePlaneFrame(i / 200).cx;
      expect(cx).toBeGreaterThanOrEqual(prev - 1e-6);
      prev = cx;
    }
  });
});

describe('departureCalibrationBlend', () => {
  it('is parked (1) through the roll and flying (0) once rotation settles', () => {
    expect(departureCalibrationBlend(0)).toBe(1);
    expect(departureCalibrationBlend(DEP_ROLL)).toBe(1);
    expect(departureCalibrationBlend(1)).toBe(0);
  });

  it('is continuous and monotonically non-increasing (no scale snap)', () => {
    let prev = Infinity;
    for (let i = 0; i <= 200; i += 1) {
      const v = departureCalibrationBlend(i / 200);
      expect(v).toBeLessThanOrEqual(prev + 1e-9);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      prev = v;
    }
  });
});

describe('cinematic durations', () => {
  it('takeoff beat is shorter than the full arrival review', () => {
    expect(DEPARTURE_DURATION_MS).toBeGreaterThan(0);
    expect(ARRIVAL_DURATION_MS).toBeGreaterThan(DEPARTURE_DURATION_MS);
  });
});

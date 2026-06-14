import { VIEWBOX, type ArrivalMode, type ArrivalPhase } from './types';
import { DEP_ROLL } from './cinematic-motion';

export interface CinematicCameraFrame {
  targetX: number;
  targetY: number;
  zoom: number;
  roll: number;
}

const CENTER_X = VIEWBOX.w / 2;
const CENTER_Y = VIEWBOX.h / 2;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => {
  const value = clamp01(t);
  return value * value * (3 - 2 * value);
};
const sineArc = (t: number) => {
  const value = clamp01(t);
  return value === 0 || value === 1 ? 0 : Math.sin(value * Math.PI);
};
const sway = (t: number, amplitude: number) => {
  const arc = sineArc(t);
  return arc === 0 ? 0 : arc * amplitude;
};

const IDENTITY_CAMERA: CinematicCameraFrame = {
  targetX: CENTER_X,
  targetY: CENTER_Y,
  zoom: 1,
  roll: 0,
};

/**
 * Deterministic arrival camera. Phase endpoints intentionally match the next
 * phase's starting frame so a continuous arrival timeline never jumps.
 */
export function cinematicCameraFrame(mode: ArrivalMode, phase: ArrivalPhase, progress: number): CinematicCameraFrame {
  if (mode === 'departure') {
    // The ground roll keeps the camera locked (the tracking pan does the work).
    // After rotation, a VERY subtle upward follow + hair of push-in keeps the
    // climbing plane in frame while the ground falls away. Monotonic, no shake.
    const dp = clamp01(progress);
    if (dp < DEP_ROLL) return IDENTITY_CAMERA;
    const climb = smoothstep((dp - DEP_ROLL) / (1 - DEP_ROLL));
    return {
      targetX: CENTER_X,
      targetY: CENTER_Y - 70 * climb,
      zoom: 1 + 0.03 * climb,
      roll: 0,
    };
  }

  const p = clamp01(progress);
  const eased = smoothstep(p);

  switch (phase) {
    case 'approach':
      return {
        targetX: lerp(1120, 1375, eased),
        targetY: lerp(450, 495, eased),
        zoom: lerp(1, 1.085, eased),
        roll: sway(p, -0.16),
      };
    case 'touchdown': {
      // One restrained suspension compression replaces the old oscillating
      // impact shake. Wheel contact should feel weighty, not like a camera hit.
      const compression = sineArc(p);
      return {
        targetX: lerp(1375, 1490, eased),
        targetY: lerp(495, 512, eased) + compression * 1.8,
        zoom: lerp(1.085, 1.115, eased) + compression * 0.004,
        roll: sway(p, 0.05),
      };
    }
    case 'taxi':
      return {
        targetX: lerp(1490, 1620, eased),
        targetY: lerp(512, 506, eased),
        zoom: lerp(1.115, 1.1, eased),
        roll: sway(p, 0.06),
      };
    case 'landed': {
      // Keep travelling in the established screen direction. The previous
      // return to centre read as a reverse camera move at the end of the shot.
      const settleBreath = sineArc(p) * 0.003;
      return {
        targetX: lerp(1620, 1660, eased),
        targetY: lerp(506, 504, eased),
        zoom: 1.1 + settleBreath,
        roll: 0,
      };
    }
    default:
      return IDENTITY_CAMERA;
  }
}

/** SVG transform that moves and zooms the world around the camera target. */
export function cinematicCameraTransform(frame: CinematicCameraFrame): string {
  return `translate(${CENTER_X} ${CENTER_Y}) rotate(${frame.roll}) scale(${frame.zoom}) translate(${-frame.targetX} ${-frame.targetY})`;
}

/**
 * Small extra layer offset on top of the global camera transform. It gives the
 * existing flat SVG layers a restrained 2.5D parallax response during arrival.
 */
export function cinematicParallaxX(frame: CinematicCameraFrame, depth: number): number {
  return -(frame.targetX - CENTER_X) * depth * 0.14;
}

export function cinematicParallaxY(frame: CinematicCameraFrame, depth: number): number {
  return -(frame.targetY - CENTER_Y) * depth * 0.1;
}
